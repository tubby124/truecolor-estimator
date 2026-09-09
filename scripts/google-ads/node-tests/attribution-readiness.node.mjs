import test from 'node:test';
import assert from 'node:assert/strict';
import {collect, REPORTS, ADS_QUERIES, safeDimension} from '../attribution-readiness.mjs';

test('scopes stay distinct; event activity never uses session counts',()=>{
  assert.deepEqual(REPORTS.eventActivity,[['eventName'],['eventCount']]);
  assert.deepEqual(REPORTS.userAcquisition,[['firstUserSourceMedium'],['totalUsers','newUsers']]);
  assert.deepEqual(REPORTS.items,[['itemName'],['itemsPurchased','itemRevenue']]);
  for(const q of Object.values(ADS_QUERIES)) assert.match(q,/^SELECT /);
});
test('query-only collection paginates, preserves metric meaning and hides resource IDs',async()=>{
  const requests=[];
  const analytics={properties:{runReport:async request=>{
    requests.push(request);
    const {dimensions,metrics,offset}=request.requestBody;
    return {data:{rowCount:2,rows:[{dimensionValues:dimensions.map(d=>({value:d.name==='landingPage'?'/pay/private?token=secret':'example'})),metricValues:metrics.map((m,i)=>({value:String(i+7)}))}],metadata:{subjectToThresholding:true}}};
  }}};
  const list=async()=>({data:{}});
  const admin={properties:{dataStreams:{list},keyEvents:{list},googleAdsLinks:{list},getAttributionSettings:async()=>({data:{name:'properties/private/attributionSettings',reportingAttributionModel:'PAID_AND_ORGANIC_LAST_CLICK'}})}};
  const result=await collect({analytics,admin,property:'properties/1',dateRanges:[],search:async()=>[{resourceName:'customers/123/conversionActions/456'}]});
  assert.equal(requests.length,12);
  assert.equal(result.ga4.sessionAcquisition.rows[0].sessions,7);
  assert.equal(result.ga4.landing.rows[0].landingPage,'/pay/[redacted]');
  assert.equal(result.ads.actions[0].resourceName,result.ads.customGoals[0].resourceName);
  assert.doesNotMatch(JSON.stringify(result),/customers\/123|token=secret|properties\/private/);
  assert.equal(result.errors.length,0);
});
test('dimension sanitization removes accidental identifiers',()=>{
  assert.equal(safeDimension('sessionSourceMedium','https://private.example?a=b'),'[redacted]');
  assert.match(safeDimension('itemName','owner@example.com'),/^item-[a-f0-9]{12}$/);
});
