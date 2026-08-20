import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildGraphUrl,
  friendlyMetaError,
  getMetaConfig,
  MetaGraphError,
  publishFacebook,
  publishInstagram,
  reconcileIgContainer,
} from "../meta";

function jsonResponse(payload: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? "OK" : "Error",
    json: async () => payload,
  } as Response;
}

function errorResponse(code: number, message: string, subcode?: number, status = 400) {
  return jsonResponse({ error: { code, message, error_subcode: subcode } }, status);
}

describe("getMetaConfig", () => {
  afterEach(() => {
    delete process.env.META_PAGE_ID;
    delete process.env.META_IG_USER_ID;
    delete process.env.META_PAGE_ACCESS_TOKEN;
    delete process.env.META_GRAPH_VERSION;
  });

  it("returns null when any required env is missing", () => {
    process.env.META_PAGE_ID = "123";
    expect(getMetaConfig()).toBeNull();
    process.env.META_IG_USER_ID = "456";
    expect(getMetaConfig()).toBeNull();
    process.env.META_PAGE_ACCESS_TOKEN = "tok";
    expect(getMetaConfig()).not.toBeNull();
  });

  it("defaults graph version to v23.0 and honors an override", () => {
    process.env.META_PAGE_ID = "123";
    process.env.META_IG_USER_ID = "456";
    process.env.META_PAGE_ACCESS_TOKEN = "tok";
    expect(getMetaConfig()?.graphVersion).toBe("v23.0");
    process.env.META_GRAPH_VERSION = "v24.0";
    expect(getMetaConfig()?.graphVersion).toBe("v24.0");
  });
});

describe("buildGraphUrl", () => {
  it("builds a graph URL with params", () => {
    expect(buildGraphUrl("v23.0", "123/media", { image_url: "https://x/y.jpg", access_token: "t" })).toBe(
      "https://graph.facebook.com/v23.0/123/media?image_url=https%3A%2F%2Fx%2Fy.jpg&access_token=t"
    );
  });
});

describe("friendlyMetaError", () => {
  it("maps token expiry, permission, and rate-limit codes to friendly text", () => {
    expect(friendlyMetaError(new MetaGraphError("x", { metaCode: 190 }))).toContain("token expired");
    expect(friendlyMetaError(new MetaGraphError("x", { metaCode: 200, subcode: 33 }))).toContain("permission");
    expect(friendlyMetaError(new MetaGraphError("x", { metaCode: 4 }))).toContain("rate limit");
    expect(friendlyMetaError(new MetaGraphError("boom", { status: 500 }))).toContain("boom");
    expect(friendlyMetaError(new Error("plain"))).toBe("plain");
  });
});

describe("publishInstagram", () => {
  const config = { pageId: "page1", igUserId: "ig1", accessToken: "tok", graphVersion: "v23.0" };
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    process.env.NEXT_PUBLIC_SITE_URL = "https://truecolorprinting.ca";
    // Keep polls instant in tests (production default is 5s per attempt).
    process.env.META_IG_POLL_INTERVAL_MS = "1";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.META_IG_POLL_INTERVAL_MS;
    delete process.env.META_IG_POLL_MAX_ATTEMPTS;
  });

  function mockSequence(...responses: Response[]) {
    responses.forEach((r) => fetchMock.mockResolvedValueOnce(r));
  }

  it("publishes a single image: create → poll FINISHED → publish → permalink", async () => {
    mockSequence(
      jsonResponse({ id: "container-1" }),
      jsonResponse({ status_code: "IN_PROGRESS" }),
      jsonResponse({ status_code: "FINISHED" }),
      jsonResponse({ id: "media-9" }),
      jsonResponse({ permalink: "https://www.instagram.com/p/ABC/" })
    );

    const result = await publishInstagram(config, {
      caption: "Hello #print",
      imageUrls: ["/images/one.jpg"],
    });

    expect(result.status).toBe("published");
    expect(result.submissionId).toBe("media-9");
    expect(result.publicUrl).toBe("https://www.instagram.com/p/ABC/");

    const calls = fetchMock.mock.calls.map((c) => ({
      url: String(c[0]),
      body: c[1]?.body ? String(c[1].body) : null,
    }));

    expect(calls[0].url).toContain("/ig1/media");
    expect(calls[0].body).toContain("image_url=https%3A%2F%2Ftruecolorprinting.ca%2Fimages%2Fone.jpg");
    expect(calls[0].body).toContain("caption=Hello+%23print");
    expect(calls[1].url).toContain("/container-1?");
    expect(calls[1].url).toContain("fields=status_code%2Cerror");
    expect(calls[3].url).toContain("/ig1/media_publish");
    expect(calls[3].body).toContain("creation_id=container-1");
  });

  it("builds a carousel when multiple images are supplied", async () => {
    mockSequence(
      jsonResponse({ id: "child-1" }),
      jsonResponse({ id: "child-2" }),
      jsonResponse({ id: "carousel-1" }),
      jsonResponse({ status_code: "FINISHED" }),
      jsonResponse({ id: "media-10" }),
      jsonResponse({ permalink: "https://www.instagram.com/p/CAR/" })
    );

    const result = await publishInstagram(config, {
      caption: "Carousel",
      imageUrls: ["https://cdn/x/1.jpg", "https://cdn/x/2.jpg"],
    });

    expect(result.status).toBe("published");
    const bodies = fetchMock.mock.calls.map((c) => String(c[1]?.body ?? ""));
    expect(bodies[0]).toContain("is_carousel_item=true");
    expect(bodies[1]).toContain("is_carousel_item=true");
    expect(bodies[2]).toContain("media_type=CAROUSEL");
    expect(bodies[2]).toContain("children=child-1%2Cchild-2");
  });

  it("publishes a reel for video content", async () => {
    mockSequence(
      jsonResponse({ id: "reel-1" }),
      jsonResponse({ status_code: "FINISHED" }),
      jsonResponse({ id: "media-11" }),
      jsonResponse({ permalink: "https://www.instagram.com/reel/R/" })
    );

    const result = await publishInstagram(config, {
      caption: "Reel",
      imageUrls: [],
      videoUrl: "https://cdn/x/clip.mp4",
    });

    expect(result.status).toBe("published");
    const body = String(fetchMock.mock.calls[0][1].body);
    expect(body).toContain("media_type=REELS");
    expect(body).toContain("video_url=");
    expect(body).toContain("share_to_feed=true");
  });

  it("fails cleanly when there is no media", async () => {
    const result = await publishInstagram(config, { caption: "x", imageUrls: [] });
    expect(result.status).toBe("failed");
    expect(result.errorMessage).toContain("no image or video");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps container ERROR to a failed result", async () => {
    mockSequence(
      jsonResponse({ id: "container-1" }),
      jsonResponse({ status_code: "ERROR", error: { message: "bad image url" } })
    );

    const result = await publishInstagram(config, { caption: "x", imageUrls: ["https://cdn/x.jpg"] });
    expect(result.status).toBe("failed");
    expect(result.errorMessage).toContain("bad image url");
  });

  it("returns in-progress with the container id when polling times out", async () => {
    process.env.META_IG_POLL_INTERVAL_MS = "1";
    const responses: Response[] = [];
    responses.push(jsonResponse({ id: "container-1" }));
    for (let i = 0; i < 8; i++) responses.push(jsonResponse({ status_code: "IN_PROGRESS" }));
    mockSequence(...responses);

    const result = await publishInstagram(config, { caption: "x", imageUrls: ["https://cdn/x.jpg"] });
    expect(result.status).toBe("in-progress");
    expect(result.submissionId).toBe("container-1");
    // 1 create + 8 polls, no publish call
    expect(fetchMock).toHaveBeenCalledTimes(9);
  });

  it("maps token-expired API errors to a friendly failure", async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(190, "Session has expired"));
    const result = await publishInstagram(config, { caption: "x", imageUrls: ["https://cdn/x.jpg"] });
    expect(result.status).toBe("failed");
    expect(result.errorMessage).toContain("token expired");
  });

  it("never throws — network errors become failed results", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    const result = await publishInstagram(config, { caption: "x", imageUrls: ["https://cdn/x.jpg"] });
    expect(result.status).toBe("failed");
    expect(result.errorMessage).toBeTruthy();
  });
});

describe("publishFacebook", () => {
  const config = { pageId: "page1", igUserId: "ig1", accessToken: "tok", graphVersion: "v23.0" };
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("publishes a single photo with the caption", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "ph-1", post_id: "page1_999" }));

    const result = await publishFacebook(config, { caption: "Hi", imageUrls: ["https://cdn/x.jpg"] });

    expect(result.status).toBe("published");
    expect(result.publicUrl).toBe("https://www.facebook.com/page1_999");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/page1/photos");
    expect(String(init.body)).toContain("message=Hi");
  });

  it("posts multiple images as one feed post via unpublished uploads", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: "ph-1" }))
      .mockResolvedValueOnce(jsonResponse({ id: "ph-2" }))
      .mockResolvedValueOnce(jsonResponse({ id: "feed-1", post_id: "page1_888" }));

    const result = await publishFacebook(config, {
      caption: "Album",
      imageUrls: ["https://cdn/1.jpg", "https://cdn/2.jpg"],
    });

    expect(result.status).toBe("published");
    const bodies = fetchMock.mock.calls.map((c) => String(c[1].body));
    expect(bodies[0]).toContain("published=false");
    expect(bodies[1]).toContain("published=false");
    expect(bodies[2]).toContain("attached_media=");
    expect(bodies[2]).toContain("%7B%22media_fbid%22%3A%22ph-1%22%7D");
  });

  it("publishes video via /videos", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "vid-1", post_id: "page1_777" }));

    const result = await publishFacebook(config, {
      caption: "Video",
      imageUrls: [],
      videoUrl: "https://cdn/clip.mp4",
    });

    expect(result.status).toBe("published");
    expect(String(fetchMock.mock.calls[0][0])).toContain("/page1/videos");
  });

  it("fails cleanly when there is no media", async () => {
    const result = await publishFacebook(config, { caption: "x", imageUrls: [] });
    expect(result.status).toBe("failed");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("reconcileIgContainer", () => {
  const config = { pageId: "page1", igUserId: "ig1", accessToken: "tok", graphVersion: "v23.0" };
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    process.env.META_IG_POLL_INTERVAL_MS = "1";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.META_IG_POLL_INTERVAL_MS;
    delete process.env.META_IG_POLL_MAX_ATTEMPTS;
  });

  it("publishes a FINISHED container", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ status_code: "FINISHED" }))
      .mockResolvedValueOnce(jsonResponse({ id: "media-5" }))
      .mockResolvedValueOnce(jsonResponse({ permalink: "https://www.instagram.com/p/R/" }));

    const result = await reconcileIgContainer(config, "container-1");
    expect(result).not.toBeNull();
    expect(result?.status).toBe("published");
    expect(result?.submissionId).toBe("media-5");
  });

  it("returns null while still processing", async () => {
    process.env.META_IG_POLL_INTERVAL_MS = "1";
    fetchMock.mockResolvedValue(jsonResponse({ status_code: "IN_PROGRESS" }));
    const result = await reconcileIgContainer(config, "container-1");
    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(8);
  });

  it("marks an ERROR container failed", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status_code: "ERROR", error: { message: "expired" } }));
    const result = await reconcileIgContainer(config, "container-1");
    expect(result?.status).toBe("failed");
    expect(result?.errorMessage).toContain("expired");
  });
});
