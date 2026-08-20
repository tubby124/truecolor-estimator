import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildContent, publishSocialPost } from "../publisher";
import type { SocialPost } from "@/lib/types/social";

vi.mock("../meta", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../meta")>();
  return {
    ...actual,
    getMetaConfig: vi.fn(),
    publishInstagram: vi.fn(),
    publishFacebook: vi.fn(),
  };
});

import { getMetaConfig, publishFacebook, publishInstagram } from "../meta";

const getMetaConfigMock = vi.mocked(getMetaConfig);
const publishInstagramMock = vi.mocked(publishInstagram);
const publishFacebookMock = vi.mocked(publishFacebook);

function makePost(overrides: Partial<SocialPost> = {}): SocialPost {
  return {
    id: "post-1",
    campaign_id: null,
    caption_raw: "Raw caption",
    caption_instagram: null,
    caption_facebook: null,
    caption_twitter: null,
    hashtags: null,
    image_url: "https://cdn/x.jpg",
    image_urls: [],
    source: "manual",
    alt_text: null,
    platforms: ["instagram", "facebook"],
    schedule_date: null,
    schedule_time: null,
    use_next_free_slot: false,
    status: "ready",
    post_type: null,
    post_number: null,
    posted_at: null,
    blotato_submission_id: null,
    post_public_url: null,
    error_message: null,
    gbp_post_done: false,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("buildContent", () => {
  it("prefers the platform caption and appends IG hashtags to the caption", () => {
    const post = makePost({
      caption_raw: "Raw",
      caption_instagram: "IG caption",
      caption_facebook: "FB caption",
      hashtags: "#Saskatoon #PrintShop",
    });
    const ig = buildContent(post, "instagram");
    const fb = buildContent(post, "facebook");
    expect(ig.caption).toContain("IG caption");
    expect(ig.caption).toContain("#Saskatoon #PrintShop");
    expect(fb.caption).toBe("FB caption");
    expect(fb.caption).not.toContain("#Saskatoon");
  });

  it("falls back to caption_raw and image_url when specifics are missing", () => {
    const post = makePost({ image_url: "https://cdn/x.jpg", image_urls: [] });
    const content = buildContent(post, "facebook");
    expect(content.caption).toBe("Raw caption");
    expect(content.imageUrls).toEqual(["https://cdn/x.jpg"]);
  });

  it("detects video from the image_url extension", () => {
    const post = makePost({ image_url: "https://cdn/x.mp4" });
    const content = buildContent(post, "instagram");
    expect(content.videoUrl).toBe("https://cdn/x.mp4");
  });
});

describe("publishSocialPost", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getMetaConfigMock.mockReset();
    publishInstagramMock.mockReset().mockResolvedValue({ platform: "instagram", status: "published" });
    publishFacebookMock.mockReset().mockResolvedValue({ platform: "facebook", status: "published" });
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    delete process.env.BLOTATO_API_KEY;
    delete process.env.META_PAGE_ID;
    delete process.env.META_IG_USER_ID;
    delete process.env.META_PAGE_ACCESS_TOKEN;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("routes instagram and facebook through Meta when configured", async () => {
    getMetaConfigMock.mockReturnValue({
      pageId: "page1",
      igUserId: "ig1",
      accessToken: "tok",
      graphVersion: "v23.0",
    });

    const post = makePost({ caption_instagram: "IG", hashtags: "#YXE" });
    const outcome = await publishSocialPost(post);

    expect(outcome.metaActive).toBe(true);
    expect(outcome.attempted).toBe(true);
    expect(publishInstagramMock).toHaveBeenCalledWith(
      expect.objectContaining({ igUserId: "ig1" }),
      expect.objectContaining({ caption: expect.stringContaining("#YXE") })
    );
    expect(publishFacebookMock).toHaveBeenCalledWith(
      expect.objectContaining({ pageId: "page1" }),
      expect.objectContaining({ caption: "Raw caption" })
    );
    expect(outcome.results).toHaveLength(2);
  });

  it("uses Blotato for twitter when the API key is set", async () => {
    getMetaConfigMock.mockReturnValue(null);
    process.env.BLOTATO_API_KEY = "blotato-key";

    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ postSubmissionId: "sub-1" }) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: "published", publicUrl: "https://twitter.com/x" }),
      });

    const outcome = await publishSocialPost(makePost({ platforms: ["twitter"] }));

    expect(outcome.attempted).toBe(true);
    expect(outcome.results[0]).toMatchObject({ platform: "twitter", status: "published" });
    const firstCall = fetchMock.mock.calls[0];
    expect(String(firstCall[0])).toContain("backend.blotato.com/v2/posts");
    expect(firstCall[1]?.headers).toMatchObject({ "blotato-api-key": "blotato-key" });
  });

  it("marks unsupported platforms failed when only Meta is configured", async () => {
    getMetaConfigMock.mockReturnValue({
      pageId: "page1",
      igUserId: "ig1",
      accessToken: "tok",
      graphVersion: "v23.0",
    });

    const outcome = await publishSocialPost(makePost({ platforms: ["twitter"] }));

    expect(outcome.attempted).toBe(true);
    expect(outcome.results[0].status).toBe("failed");
    expect(outcome.results[0].errorMessage).toContain("BLOTATO_API_KEY");
  });

  it("does not dispatch anything when no publisher is configured", async () => {
    getMetaConfigMock.mockReturnValue(null);

    const outcome = await publishSocialPost(makePost({ platforms: ["instagram", "facebook"] }));

    expect(outcome.attempted).toBe(false);
    expect(outcome.results.every((r) => r.status === "failed")).toBe(true);
    expect(publishInstagramMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
