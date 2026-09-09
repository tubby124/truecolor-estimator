// Query-only: no event ingestion, validation probes, orders or settings mutations.
import { createHash } from 'node:crypto';
import { google } from 'googleapis';
import { pathToFileURL } from 'node:url';
import { createReader } from './gaql-read.mjs';
import { safeReportPath } from './report-safety.mjs';

const sessionMetrics = ['sessions', 'engagedSessions', 'ecommercePurchases', 'purchaseRevenue'];
export const REPORTS = {
  sessionAcquisition: [['sessionSourceMedium', 'sessionDefaultChannelGroup'], sessionMetrics],
  userAcquisition: [['firstUserSourceMedium'], ['totalUsers', 'newUsers']],
  device: [['deviceCategory'], sessionMetrics],
  landing: [['landingPage'], sessionMetrics],
  items: [['itemName'], ['itemsPurchased', 'itemRevenue']],
  eventActivity: [['eventName'], ['eventCount']],
};
export const ADS_QUERIES = {
  campaigns: 'SELECT campaign.name, campaign.status FROM campaign WHERE campaign.status != \'REMOVED\'',
  actions: 'SELECT conversion_action.resource_name, conversion_action.name, conversion_action.category, conversion_action.type, conversion_action.status, conversion_action.primary_for_goal FROM conversion_action',
  customerGoals: 'SELECT customer_conversion_goal.category, customer_conversion_goal.origin, customer_conversion_goal.biddable FROM customer_conversion_goal',
  campaignGoals: 'SELECT campaign.name, campaign_conversion_goal.category, campaign_conversion_goal.origin, campaign_conversion_goal.biddable FROM campaign_conversion_goal',
  goalConfigs: 'SELECT campaign.name, conversion_goal_campaign_config.goal_config_level, conversion_goal_campaign_config.custom_conversion_goal FROM conversion_goal_campaign_config',
  customGoals: 'SELECT custom_conversion_goal.resource_name, custom_conversion_goal.name, custom_conversion_goal.status, custom_conversion_goal.conversion_actions FROM custom_conversion_goal',
};
export function safeDimension(name, value) {
  if (name === 'landingPage') return safeReportPath(value);
  if (name === 'itemName') return `item-${createHash('sha256').update(String(value ?? '')).digest('hex').slice(0, 12)}`;
  // Source and item fields can contain accidental private data; never emit URLs or emails.
  if (/@|https?:|[?&=]|\b\d{7,}\b/i.test(value ?? '')) return '[redacted]';
  return String(value ?? '').slice(0, 160);
}
export async function collect({ analytics, admin, property, search, dateRanges }) {
  const result = { caveat: 'Independent aggregate reports; event activity is not a sequential cohort funnel. No event/session ratios. No synthetic traffic filter applied.', ga4: {}, admin: {}, ads: {}, errors: [] };
  async function attempt(label, fn) {
    try { return await fn(); } catch (e) {
      // Provider bodies can contain account identifiers or request data.
      result.errors.push({ section: label, code: String(e.code ?? e.response?.status ?? 'READ_FAILED'), status: e.response?.data?.error?.status ?? 'unavailable', reason: (e.response?.data?.error?.details ?? []).find(d => d.reason)?.reason ?? 'unspecified' });
      return null;
    }
  }
  for (const [label, [dimensions, metrics]] of Object.entries(REPORTS)) {
    result.ga4[label] = await attempt(label, async () => {
      const rows = []; let offset = 0; let data;
      do {
        ({ data } = await analytics.properties.runReport({ property, requestBody: { dateRanges, dimensions: dimensions.map(name => ({name})), metrics: metrics.map(name => ({name})), limit: '10000', offset: String(offset) } }));
        rows.push(...(data.rows ?? []).map(row => Object.fromEntries([
          ...dimensions.map((name, i) => [name, safeDimension(name, row.dimensionValues[i].value)]),
          ...metrics.map((name, i) => [name, Number(row.metricValues[i].value)]),
        ])));
        offset += data.rows?.length ?? 0;
      } while (offset < (data.rowCount ?? 0) && data.rows?.length);
      return { rows, rowCount: data.rowCount ?? 0, metadata: data.metadata };
    });
  }
  for (const [label, resource, field, project] of [
    ['streams', 'dataStreams', 'dataStreams', x => ({type:x.type, measurementId:x.webStreamData?.measurementId})],
    ['keyEvents', 'keyEvents', 'keyEvents', x => ({eventName:safeDimension('eventName',x.eventName), countingMethod:x.countingMethod})],
    ['adsLinks', 'googleAdsLinks', 'googleAdsLinks', x => ({adsPersonalizationEnabled:x.adsPersonalizationEnabled, linkedToExpectedAccount:x.customerId === '1072816342'})],
  ]) result.admin[label] = await attempt(label, async () => {
    const rows=[]; let pageToken;
    do { const {data}=await admin.properties[resource].list({parent:property,pageToken}); rows.push(...(data[field]??[]).map(project)); pageToken=data.nextPageToken; } while(pageToken);
    return rows;
  });
  result.admin.attribution = await attempt('attribution', async () => {
    const {data}=await admin.properties.getAttributionSettings({name:`${property}/attributionSettings`});
    const {name, ...settings}=data; return settings;
  });
  // Replace account/resource IDs with stable local aliases; preserve joins for goal audit.
  const aliases=new Map();
  const sanitize = value => {
    if (Array.isArray(value)) return value.map(sanitize);
    if (value && typeof value==='object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,sanitize(v)]));
    if (typeof value==='string' && value.startsWith('customers/')) {
      if(!aliases.has(value)) aliases.set(value,`resource-${aliases.size+1}`);
      return aliases.get(value);
    }
    return typeof value==='string' ? safeDimension('ads',value) : value;
  };
  for(const [label,query] of Object.entries(ADS_QUERIES)) result.ads[label]=await attempt(label,async()=>sanitize(await search(query,label)));
  return result;
}
async function main() {
  const days=Number(process.argv[2] ?? 30);
  if(!Number.isInteger(days)||days<1||days>90) throw new Error('Days must be 1-90');
  if(!process.env.GA4_SERVICE_ACCOUNT_JSON || !/^\d+$/.test(process.env.GA4_PROPERTY_ID??'')) throw new Error('GA4 credentials/property missing');
  const creds=JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON);
  const auth=new google.auth.JWT({email:creds.client_email,key:creds.private_key,scopes:['https://www.googleapis.com/auth/analytics.readonly']});
  const {search}=await createReader(); // Fail closed on Ads identity before any reports.
  const result=await collect({analytics:google.analyticsdata({version:'v1beta',auth}),admin:google.analyticsadmin({version:'v1alpha',auth}),property:`properties/${process.env.GA4_PROPERTY_ID}`,search,dateRanges:[{startDate:`${days}daysAgo`,endDate:'yesterday'}]});
  console.log(JSON.stringify({generatedAt:new Date().toISOString(),days,...result},null,2));
  if(result.errors.length) process.exitCode=1;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) main().catch(()=>{console.error('Readiness report blocked: check required GA4/Ads credentials and approved account identity. No provider error body printed.');process.exitCode=1;});
