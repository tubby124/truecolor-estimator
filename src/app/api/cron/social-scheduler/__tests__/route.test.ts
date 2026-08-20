import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

// ── Mocks (must be hoisted above the route import) ───────────────────────────

const { fromMock, heartbeatMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  heartbeatMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({ from: fromMock }),
}));

vi.mock("@/lib/cron/heartbeat", () => ({
  recordCronRun: heartbeatMock,
}));

vi.mock("@/lib/social/meta", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/social/meta")>();
  return {
    ...actual,
    metaEnabled: vi.fn(() => true),
    getMetaConfig: vi.fn(() => ({
      pageId: "page1",
      igUserId: "ig1",
      accessToken: "tok",
      graphVersion: "v23.0",
    })),
    reconcileIgContainer: vi.fn(),
  };
});

vi.mock("@/lib/social/publisher", () => ({
  publishSocialPost: vi.fn(),
}));

import { GET } from "../route";
import { metaEnabled, reconcileIgContainer } from "@/lib/social/meta";
import { publishSocialPost } from "@/lib/social/publisher";

const metaEnabledMock = vi.mocked(metaEnabled);
const publishSocialPostMock = vi.mocked(publishSocialPost);
const reconcileIgContainerMock = vi.mocked(reconcileIgContainer);

// ── Fluent supabase fake ─────────────────────────────────────────────────────

type Script = (
  table: string,
  chain: string[],
  args: unknown[][]
) => unknown | Promise<unknown>;

function makeFrom(script: Script) {
  const chains: Array<{ table: string; chain: string[]; args: unknown[][] }> = [];
  fromMock.mockReset().mockImplementation((table: string) => {
    const chain: string[] = [];
    const args: unknown[][] = [];
    const proxy: Record<string, unknown> = new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop === "then") {
            return (resolve: (v: unknown) => void, reject: (e: unknown) => void) => {
              Promise.resolve(script(table, chain, args)).then(resolve, reject);
            };
          }
          return (...callArgs: unknown[]) => {
            chain.push(String(prop));
            args.push(callArgs);
            return proxy;
          };
        },
      }
    );
    chains.push({ table, chain, args }); // reference for assertions
    return proxy;
  });
  return chains;
}

/** Builds a cron request. `authedReq()` sends a valid token; `req("wrong")` a bad one; `unauthReq()` none. */
function req(authToken: string | undefined) {
  const headers: Record<string, string> = {};
  if (authToken !== undefined) headers.authorization = `Bearer ${authToken}`;
  return new Request("https://truecolorprinting.ca/api/cron/social-scheduler", { headers }) as NextRequest;
}
const authedReq = () => req("cron-secret");
const unauthReq = () => req(undefined);

const emptyResults = () => ({ data: [], error: null });

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/cron/social-scheduler", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "cron-secret";
    process.env.META_PAGE_ID = "page1";
    process.env.META_IG_USER_ID = "ig1";
    process.env.META_PAGE_ACCESS_TOKEN = "tok";
    fromMock.mockReset();
    metaEnabledMock.mockReset().mockReturnValue(true);
    heartbeatMock.mockReset().mockResolvedValue(undefined);
    publishSocialPostMock.mockReset().mockResolvedValue({
      results: [{ platform: "instagram", status: "published", submissionId: "m1" }],
      attempted: true,
      metaActive: true,
    });
    reconcileIgContainerMock.mockReset().mockResolvedValue(null);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.CRON_SECRET;
    delete process.env.META_PAGE_ID;
    delete process.env.META_IG_USER_ID;
    delete process.env.META_PAGE_ACCESS_TOKEN;
  });

  it("fails closed without CRON_SECRET", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(authedReq());
    expect(res.status).toBe(503);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("rejects a missing or wrong bearer token", async () => {
    expect((await GET(unauthReq())).status).toBe(401);
    expect((await GET(req("wrong"))).status).toBe(401);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("is a no-op when Meta is not configured (posts stay ready)", async () => {
    metaEnabledMock.mockReturnValue(false);
    const res = await GET(authedReq());
    const body = await res.json();

    expect(body.skipped).toBe(true);
    expect(fromMock).not.toHaveBeenCalled();
    expect(heartbeatMock).toHaveBeenCalledWith("social-scheduler", true, "meta not configured — skipped");
  });

  it("publishes due posts and records the heartbeat", async () => {
    makeFrom((table, chain, args) => {
      if (table === "social_posts" && chain[0] === "select") {
        const selectArg = String(args[0]?.[0] ?? "");
        if (selectArg === "id") {
          // due-by-time query: lte(schedule_time, ...); due-by-date: is(schedule_time, null)
          const lteArg = args.find((a) => a[0] === "schedule_time");
          if (lteArg) return { data: [{ id: "post-due-1" }], error: null };
          return { data: [], error: null };
        }
        return { data: [], error: null };
      }
      if (table === "social_posts" && chain[0] === "update") {
        const update = args[0]?.[0] as Record<string, unknown> | undefined;
        if (update?.status === "posting") {
          return {
            data: {
              id: "post-due-1",
              caption_raw: "Scheduled post",
              image_url: "https://cdn/x.jpg",
              image_urls: [],
              platforms: ["instagram"],
              status: "posting",
            },
            error: null,
          };
        }
        return { data: null, error: null };
      }
      if (table === "social_post_results") {
        if (chain[0] === "upsert") return { error: null };
        return { data: [], error: null };
      }
      return emptyResults();
    });

    const res = await GET(authedReq());
    const body = await res.json();

    expect(body.published).toBe(1);
    expect(body.failed).toBe(0);
    expect(publishSocialPostMock).toHaveBeenCalledTimes(1);
    expect(heartbeatMock).toHaveBeenCalledWith(
      "social-scheduler",
      true,
      "published=1 failed=0 inProgress=0 claimedSkipped=0 reconciled=0"
    );
  });

  it("skips posts another run already claimed (claim race)", async () => {
    makeFrom((table, chain, args) => {
      if (table === "social_posts" && chain[0] === "select" && String(args[0]?.[0]) === "id") {
        const lteArg = args.find((a) => a[0] === "schedule_time");
        if (lteArg) return { data: [{ id: "post-race" }], error: null };
        return { data: [], error: null };
      }
      if (table === "social_posts" && chain[0] === "update") {
        // claim returns null → this run lost the race
        return { data: null, error: null };
      }
      return emptyResults();
    });

    const res = await GET(authedReq());
    const body = await res.json();

    expect(body.claimedSkipped).toBe(1);
    expect(publishSocialPostMock).not.toHaveBeenCalled();
  });

  it("reconciles an in-progress IG container and finalizes the post", async () => {
    reconcileIgContainerMock.mockResolvedValue({
      platform: "instagram",
      status: "published",
      submissionId: "media-9",
      publicUrl: "https://www.instagram.com/p/X/",
    });

    makeFrom((table, chain, args) => {
      if (table === "social_posts" && chain[0] === "select" && String(args[0]?.[0]) === "id") {
        const lteArg = args.find((a) => a[0] === "schedule_time");
        if (lteArg) return { data: [{ id: "post-due-1" }], error: null };
        return { data: [], error: null };
      }
      if (table === "social_posts" && chain[0] === "select" && String(args[0]?.[0]) === "id, platforms") {
        return { data: [], error: null };
      }
      if (table === "social_posts" && chain[0] === "update") {
        const update = args[0]?.[0] as Record<string, unknown> | undefined;
        if (update?.status === "posting") {
          return {
            data: {
              id: "post-due-1",
              caption_raw: "x",
              image_url: "https://cdn/x.jpg",
              image_urls: [],
              platforms: ["instagram"],
              status: "posting",
            },
            error: null,
          };
        }
        return { data: null, error: null };
      }
      if (table === "social_post_results") {
        if (chain[0] === "select") {
          // stuck-results query includes eq(platform, instagram)
          const platformEq = args.find((a) => a[0] === "platform");
          if (platformEq) return { data: [{ post_id: "post-stuck", blotato_submission_id: "container-1" }], error: null };
          // finalizePostIfSettled query
          return { data: [{ platform: "instagram", status: "published", error_message: null }], error: null };
        }
        if (chain[0] === "upsert") return { error: null };
        return { error: null };
      }
      return emptyResults();
    });

    const res = await GET(authedReq());
    const body = await res.json();

    expect(reconcileIgContainerMock).toHaveBeenCalledWith(
      expect.objectContaining({ igUserId: "ig1" }),
      "container-1"
    );
    expect(body.reconciled).toBe(1);
    expect(body.published).toBe(1);
  });

  it("leaves a still-processing container for the next run", async () => {
    reconcileIgContainerMock.mockResolvedValue(null);

    makeFrom((table, chain, args) => {
      if (table === "social_posts" && chain[0] === "select") return { data: [], error: null };
      if (table === "social_post_results" && chain[0] === "select") {
        const platformEq = args.find((a) => a[0] === "platform");
        if (platformEq) return { data: [{ post_id: "post-stuck", blotato_submission_id: "container-1" }], error: null };
        return { data: [], error: null };
      }
      return emptyResults();
    });

    const res = await GET(authedReq());
    const body = await res.json();

    expect(body.reconciled).toBe(0);
    expect(publishSocialPostMock).not.toHaveBeenCalled();
  });
});
