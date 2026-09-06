import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SocialPost } from "@/lib/types/social";
import { createOAuthState, decryptRefreshToken, encryptRefreshToken, verifyOAuthState } from "../oauth";
import { createGbpRequest, GbpApiError, type GbpRequest, locationParent, TRUE_COLOR_GBP_IDENTITY } from "../client";
import { discoverGbpLocation, matchesIdentity, verifyGbpLocation } from "../discovery";
import { buildGbpPost, dispatchGbpPost, resultFromGbpPost, type GbpPostPayload } from "../publisher";
import { fetchGbpHistoryPage, fetchGbpInsights, historyRow } from "../history";
vi.mock("@/lib/social/business", () => ({ DEFAULT_SOCIAL_BUSINESS_ID: "00000000-0000-4000-8000-000000000001", socialBusinessScopingEnabled: () => true }));
const parent = "accounts/test/locations/location";
const postName = `${parent}/localPosts/first`;
const location = { name: "locations/location", title: TRUE_COLOR_GBP_IDENTITY.title, storefrontAddress: TRUE_COLOR_GBP_IDENTITY, metadata: { canOperateLocalPost: true } };
const basePost = { caption_raw: "A real, reviewed product.", caption_gbp: null, image_urls: ["https://example.test/photo.jpg"], image_url: null } as SocialPost;
const offer: GbpPostPayload = { topicType: "OFFER", event: { title: "Reviewed product offer", schedule: { startDate: { year: 2026, month: 9, day: 6 }, endDate: { year: 2026, month: 9, day: 12 } } }, offer: { redeemOnlineUrl: "https://example.test/product", termsConditions: "Existing catalogue price. Tax extra." } };
beforeEach(() => {
  vi.stubEnv("GOOGLE_GBP_CLIENT_ID", "test-client"); vi.stubEnv("GOOGLE_GBP_CLIENT_SECRET", "test-secret");
  vi.stubEnv("GOOGLE_GBP_REDIRECT_URI", "https://example.test/callback"); vi.stubEnv("GOOGLE_GBP_TOKEN_ENCRYPTION_KEY", "a".repeat(64));
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("Google OAuth business binding", () => {
  it("binds state to business, user, expiry and signed cookie", () => {
    const context = { businessId: "business-a", userId: "operator" }, now = 10000;
    const state = createOAuthState(context, now);
    expect(verifyOAuthState(state.value, state.cookieValue, context, now)).toBe(true);
    expect(verifyOAuthState(state.value, state.cookieValue, { ...context, businessId: "business-b" }, now)).toBe(false);
    expect(verifyOAuthState(state.value, state.cookieValue, { ...context, userId: "other" }, now)).toBe(false);
    expect(verifyOAuthState(state.value, state.cookieValue, context, now + 600001)).toBe(false);
    expect(verifyOAuthState(state.value, `${state.cookieValue}x`, context, now)).toBe(false);
  });
  it("cannot decrypt a credential transplanted to a second business", () => {
    const secret = encryptRefreshToken("synthetic-refresh-token", "business-a");
    const row = { business_id: "business-a", token_key_version: 2, refresh_token_ciphertext: secret.ciphertext, refresh_token_iv: secret.iv, refresh_token_auth_tag: secret.authTag };
    expect(decryptRefreshToken(row)).toBe("synthetic-refresh-token");
    expect(() => decryptRefreshToken({ ...row, business_id: "business-b" })).toThrow();
    expect(() => decryptRefreshToken({ ...row, token_key_version: 1 })).toThrow(/reconnection/);
  });
});

describe("Google discovery", () => {
  it("rejects same-name wrong-address listings", () => {
    expect(matchesIdentity(location, TRUE_COLOR_GBP_IDENTITY)).toBe(true);
    expect(matchesIdentity({ ...location, storefrontAddress: { ...TRUE_COLOR_GBP_IDENTITY, postalCode: "S7L 0V2" } }, TRUE_COLOR_GBP_IDENTITY)).toBe(false);
    expect(matchesIdentity({ ...location, storefrontAddress: { ...TRUE_COLOR_GBP_IDENTITY, addressLines: ["218 33rd St W"] } }, TRUE_COLOR_GBP_IDENTITY)).toBe(false);
  });
  it("fully paginates accounts and locations before selecting the exact address", async () => {
    const request = vi.fn().mockResolvedValueOnce({ accounts: [{ name: "accounts/first" }], nextPageToken: "account-next" }).mockResolvedValueOnce({ locations: [], nextPageToken: "location-next" }).mockResolvedValueOnce({ locations: [] }).mockResolvedValueOnce({ accounts: [{ name: "accounts/test" }] }).mockResolvedValueOnce({ locations: [location] });
    const result = await discoverGbpLocation(request as GbpRequest, TRUE_COLOR_GBP_IDENTITY);
    expect(result?.locationName).toBe(parent); expect(request).toHaveBeenCalledTimes(5);
    expect(request.mock.calls[2][0]).toContain("pageToken=location-next"); expect(request.mock.calls[3][0]).toContain("pageToken=account-next");
  });
  it("fails closed on two distinct matching listings", async () => {
    const request = vi.fn().mockResolvedValueOnce({ accounts: [{ name: "accounts/test" }] }).mockResolvedValueOnce({ locations: [location, { ...location, name: "locations/duplicate" }] });
    await expect(discoverGbpLocation(request as GbpRequest, TRUE_COLOR_GBP_IDENTITY)).rejects.toThrow(/Multiple/);
  });
  it("fails closed on repeated pagination and changed location identity", async () => {
    const request = vi.fn().mockResolvedValue({ accounts: [], nextPageToken: "same" });
    await expect(discoverGbpLocation(request as GbpRequest, TRUE_COLOR_GBP_IDENTITY)).rejects.toThrow(/repeated/);
    await expect(verifyGbpLocation(vi.fn().mockResolvedValue({ ...location, name: "locations/another" }) as GbpRequest, parent, TRUE_COLOR_GBP_IDENTITY)).rejects.toThrow(/identity changed/);
  });
  it("canonicalizes location parents and rejects resource traversal", () => {
    expect(locationParent("accounts/test", "locations/location")).toBe(parent);
    expect(() => locationParent("accounts/test", "locations/../evil")).toThrow();
    expect(() => locationParent("accounts/test", "accounts/other/locations/location")).toThrow();
  });
});

describe("Google publish truth", () => {
  it("ordinary promotion uses STANDARD with no invented expiry", () => { expect(buildGbpPost(basePost)).toMatchObject({ topicType: "STANDARD", summary: basePost.caption_raw, media: [{ mediaFormat: "PHOTO", sourceUrl: "https://example.test/photo.jpg" }] }); expect(buildGbpPost(basePost)).not.toHaveProperty("event"); });
  it("OFFER uses reviewed dates, redemption fields and no generic CTA", () => {
    const body = buildGbpPost({ ...basePost, gbp_payload: offer });
    expect(body).not.toHaveProperty("callToAction"); expect(body).toMatchObject({ event: { schedule: { startTime: { hours: 0 }, endTime: { hours: 23 } } }, offer: { redeemOnlineUrl: "https://example.test/product" } });
    expect(() => buildGbpPost({ ...basePost, gbp_payload: { ...offer, callToAction: { actionType: "LEARN_MORE", url: "https://example.test" } } })).toThrow(/redemption/);
  });
  it("rejects invalid dates, reversed dates, missing terms and extra media", () => {
    expect(() => buildGbpPost({ ...basePost, gbp_payload: { ...offer, event: { ...offer.event!, schedule: { ...offer.event!.schedule, startDate: { year: 2026, month: 2, day: 30 } } } } })).toThrow(/date/);
    expect(() => buildGbpPost({ ...basePost, gbp_payload: { ...offer, event: { ...offer.event!, schedule: { ...offer.event!.schedule, endDate: { year: 2026, month: 9, day: 1 } } } } })).toThrow(/precedes/);
    expect(() => buildGbpPost({ ...basePost, gbp_payload: { ...offer, offer: { redeemOnlineUrl: "https://example.test" } } })).toThrow(/terms/);
    expect(() => buildGbpPost({ ...basePost, image_urls: ["https://example.test/1.jpg", "https://example.test/2.jpg"] })).toThrow(/exactly one/);
  });
  it.each(["PROCESSING", "SCHEDULED", "", "LOCAL_POST_STATE_UNSPECIFIED"])("holds provider state %s", state => { expect(resultFromGbpPost(parent, { name: postName, state }).status).toBe("in-progress"); });
  it("only reports LIVE with a valid provider ID as published", () => {
    expect(resultFromGbpPost(parent, { name: postName, state: "LIVE" }).status).toBe("published");
    expect(resultFromGbpPost(parent, { state: "LIVE" }).status).toBe("in-progress");
    expect(resultFromGbpPost(parent, { name: "accounts/other/locations/location/localPosts/p", state: "LIVE" }).status).toBe("in-progress");
  });
  it.each([null, 500, 429, 408])("holds uncertain HTTP %s without retry", async status => {
    const request = vi.fn().mockRejectedValue(new GbpApiError(status));
    expect((await dispatchGbpPost(request as GbpRequest, parent, buildGbpPost(basePost))).status).toBe("in-progress"); expect(request).toHaveBeenCalledTimes(1);
  });
  it("records definitive request rejection without retry", async () => { const request = vi.fn().mockRejectedValue(new GbpApiError(403)); expect((await dispatchGbpPost(request as GbpRequest, parent, buildGbpPost(basePost))).status).toBe("failed"); expect(request).toHaveBeenCalledTimes(1); });
});

describe("actual history and unavailable insight semantics", () => {
  it("imports only a valid provider post and retains state and dates separately from queue", () => {
    const row = historyRow("business-a", parent, { name: postName, state: "PROCESSING", topicType: "OFFER", createTime: "2026-09-01T00:00:00Z", summary: "Provider copy" }, "2026-09-06T00:00:00Z");
    expect(row).toMatchObject({ business_id: "business-a", provider_post_id: postName, provider_state: "PROCESSING", provider_created_at: "2026-09-01T00:00:00Z" });
    expect(row).not.toHaveProperty("approval_hash"); expect(() => historyRow("business-b", parent, { name: "fake" }, "now")).toThrow();
  });
  it("passes each saved history cursor and returns the next page", async () => {
    const request = vi.fn().mockResolvedValue({ localPosts: [{ name: postName }], nextPageToken: "next" });
    expect(await fetchGbpHistoryPage(request as GbpRequest, parent, "previous")).toMatchObject({ nextPageToken: "next" }); expect(request.mock.calls[0][0]).toContain("pageToken=previous");
  });
  it("never calls the sunset insights endpoint or invents zero metrics", async () => {
    const request = vi.fn(); const result = await fetchGbpInsights(request as GbpRequest, parent, [postName]);
    expect(result.get(postName)).toMatchObject({ status: "unavailable", values: null, error: expect.stringContaining("2023-02-20") }); expect(request).not.toHaveBeenCalled();
  });
  it("never forwards Google credentials to another host or redirects", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 })); const request = createGbpRequest("synthetic-token", fetcher);
    await expect(request("https://evil.test/steal")).rejects.toThrow(/destination/); expect(fetcher).not.toHaveBeenCalled();
    await request(`https://mybusiness.googleapis.com/v4/${parent}/localPosts`); expect(fetcher.mock.calls[0][1]).toMatchObject({ redirect: "error", cache: "no-store" });
  });
});
