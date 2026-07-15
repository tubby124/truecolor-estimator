import type { UtmAttribution } from "./utm";

export interface AttributionDbColumns {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  google_keyword: string | null;
  google_matchtype: string | null;
  google_device: string | null;
  google_loc_physical_ms: string | null;
  google_loc_interest_ms: string | null;
  google_adgroup_id: string | null;
  google_creative_id: string | null;
  google_campaign_id: string | null;
  google_network: string | null;
}

export function mapAttributionToDb(attribution: UtmAttribution): AttributionDbColumns {
  return {
    utm_source: attribution.utm_source ?? null,
    utm_medium: attribution.utm_medium ?? null,
    utm_campaign: attribution.utm_campaign ?? null,
    utm_content: attribution.utm_content ?? null,
    utm_term: attribution.utm_term ?? null,
    gclid: attribution.gclid ?? null,
    gbraid: attribution.gbraid ?? null,
    wbraid: attribution.wbraid ?? null,
    google_keyword: attribution.keyword ?? null,
    google_matchtype: attribution.matchtype ?? null,
    google_device: attribution.device ?? null,
    google_loc_physical_ms: attribution.loc_physical_ms ?? null,
    google_loc_interest_ms: attribution.loc_interest_ms ?? null,
    google_adgroup_id: attribution.adgroupid ?? null,
    google_creative_id: attribution.creative ?? null,
    google_campaign_id: attribution.campaignid ?? null,
    google_network: attribution.network ?? null,
  };
}
