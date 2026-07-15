import { describe, expect, it } from "vitest";
import { mapAttributionToDb } from "../attribution-db";

describe("mapAttributionToDb", () => {
  it("maps URL attribution names to nullable database columns", () => {
    expect(mapAttributionToDb({
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "summer",
      utm_content: "blue-ad",
      utm_term: "yard signs",
      gclid: "click-1",
      gbraid: "braid-2",
      wbraid: "braid-3",
      keyword: "yard signs",
      matchtype: "e",
      device: "m",
      loc_physical_ms: "100",
      loc_interest_ms: "200",
      adgroupid: "300",
      creative: "400",
      campaignid: "500",
      network: "g",
    })).toEqual({
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "summer",
      utm_content: "blue-ad",
      utm_term: "yard signs",
      gclid: "click-1",
      gbraid: "braid-2",
      wbraid: "braid-3",
      google_keyword: "yard signs",
      google_matchtype: "e",
      google_device: "m",
      google_loc_physical_ms: "100",
      google_loc_interest_ms: "200",
      google_adgroup_id: "300",
      google_creative_id: "400",
      google_campaign_id: "500",
      google_network: "g",
    });
  });

  it("returns null for every absent database field", () => {
    expect(Object.values(mapAttributionToDb({})).every((value) => value === null)).toBe(true);
  });
});
