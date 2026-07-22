import type { PaidAttributionTouch, UtmAttribution } from "./utm";

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

export type LatestPaidAttributionDbColumns = {
  [K in keyof AttributionDbColumns as `latest_paid_${K}`]: AttributionDbColumns[K]
} & { latest_paid_touch_captured_at: string | null };

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

export function mapLatestPaidAttributionToDb(
  touch: PaidAttributionTouch | null,
): LatestPaidAttributionDbColumns {
  const mapped = mapAttributionToDb(touch?.attribution ?? {});
  return {
    latest_paid_utm_source: mapped.utm_source,
    latest_paid_utm_medium: mapped.utm_medium,
    latest_paid_utm_campaign: mapped.utm_campaign,
    latest_paid_utm_content: mapped.utm_content,
    latest_paid_utm_term: mapped.utm_term,
    latest_paid_gclid: mapped.gclid,
    latest_paid_gbraid: mapped.gbraid,
    latest_paid_wbraid: mapped.wbraid,
    latest_paid_google_keyword: mapped.google_keyword,
    latest_paid_google_matchtype: mapped.google_matchtype,
    latest_paid_google_device: mapped.google_device,
    latest_paid_google_loc_physical_ms: mapped.google_loc_physical_ms,
    latest_paid_google_loc_interest_ms: mapped.google_loc_interest_ms,
    latest_paid_google_adgroup_id: mapped.google_adgroup_id,
    latest_paid_google_creative_id: mapped.google_creative_id,
    latest_paid_google_campaign_id: mapped.google_campaign_id,
    latest_paid_google_network: mapped.google_network,
    latest_paid_touch_captured_at: touch?.capturedAt ?? null,
  };
}
