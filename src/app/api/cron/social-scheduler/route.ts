/**
 * GET /api/cron/social-scheduler
 *
 * Fires due scheduled social posts and reconciles stuck ones.
 *
 * Due definition: status = 'ready' AND
 *   (schedule_time <= now  OR  (schedule_time IS NULL AND schedule_date <= today))
 *
 * Safety invariants:
 *   - Claim-before-publish: each post is transitioned ready → posting with
 *     `eq(status,'ready')` so a double cron fire can never publish twice.
 *   - When Meta is not configured yet, the cron is a no-op (posts stay 'ready'
 *     and fire the moment META_* env lands) — it never marks posts failed.
 *   - IG containers that were still processing when the publish poll timed out
 *     are reconciled here: container FINISHED → publish it; ERROR/EXPIRED →
 *     mark failed; still processing → leave for the next run.
 *   - Posts left in 'posting' whose per-platform results are all final get
 *     finalized (guards against orphaned states from Blotato callbacks).
 *
 * Run every hour via Railway cron:
 *   Schedule: 0 * * * *
 *   Command:  curl -s -H "Authorization: Bearer ***" https://truecolorprinting.ca/api/cron/social-scheduler
 *
 * Auth: Authorization: Bearer *** (CRON_SECRET)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { recordCronRun } from "@/lib/cron/heartbeat";
import { metaEnabled, getMetaConfig, reconcileIgContainer } from "@/lib/social/meta";
import { publishSocialPost } from "@/lib/social/publisher";

const RECONCILE_AFTER_MIN = 30;
const BATCH_LIMIT = 10;

interface DuePost {
  id: string;
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (req.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  if (!metaEnabled()) {
    await recordCronRun("social-scheduler", true, "meta not configured — skipped");
    return NextResponse.json({ ok: true, skipped: true, reason: "meta not configured" });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const today = nowIso.slice(0, 10);

  let published = 0;
  let failed = 0;
  let inProgress = 0;
  let claimedSkipped = 0;
  let reconciled = 0;

  // ── 1. Find due posts (two shapes: explicit schedule_time, or date-only) ──
  const [byTimeRes, byDateRes] = await Promise.all([
    supabase
      .from("social_posts")
      .select("id")
      .eq("status", "ready")
      .lte("schedule_time", nowIso)
      .limit(BATCH_LIMIT),
    supabase
      .from("social_posts")
      .select("id")
      .eq("status", "ready")
      .is("schedule_time", null)
      .lte("schedule_date", today)
      .limit(BATCH_LIMIT),
  ]);

  const dueMap = new Map<string, DuePost>();
  for (const row of byTimeRes.data ?? []) dueMap.set(row.id, row);
  for (const row of byDateRes.data ?? []) dueMap.set(row.id, row);
  const dueIds = [...dueMap.keys()].slice(0, BATCH_LIMIT);

  for (const id of dueIds) {
    // Claim: ready → posting (optimistic lock; a concurrent run loses the race)
    const { data: claimed, error: claimErr } = await supabase
      .from("social_posts")
      .update({ status: "posting" })
      .eq("id", id)
      .eq("status", "ready")
      .select("*")
      .single();

    if (claimErr) {
      console.error("[social-scheduler] claim failed", claimErr.message);
      continue;
    }
    if (!claimed) {
      claimedSkipped += 1;
      continue;
    }

    const { results, attempted } = await publishSocialPost(claimed);

    if (!attempted) {
      // Nothing dispatched — return to ready (e.g. post only targets platforms
      // with no publisher). It will retry on the next run.
      await supabase
        .from("social_posts")
        .update({ status: "ready", error_message: null })
        .eq("id", id);
      continue;
    }

    for (const r of results) {
      await supabase.from("social_post_results").upsert(
        {
          post_id: id,
          platform: r.platform,
          blotato_submission_id: r.submissionId ?? null,
          status: r.status,
          public_url: r.publicUrl ?? null,
          error_message: r.errorMessage ?? null,
          posted_at: r.status === "published" ? nowIso : null,
        },
        { onConflict: "post_id,platform" }
      );
    }

    const allPublished = results.every((r) => r.status === "published");
    const anyFailed = results.some((r) => r.status === "failed");
    const anyInProgress = results.some((r) => r.status === "in-progress");

    let finalStatus: string;
    let errorMessage: string | null = null;

    if (allPublished) {
      finalStatus = "posted";
      published += 1;
    } else if (anyFailed && !anyInProgress) {
      finalStatus = "failed";
      errorMessage = results
        .filter((r) => r.status === "failed" && r.errorMessage)
        .map((r) => `${r.platform}: ${r.errorMessage}`)
        .join(" | ");
      failed += 1;
    } else {
      finalStatus = "posting";
      errorMessage = anyFailed ? "Some platforms failed — see results" : null;
      inProgress += 1;
    }

    await supabase
      .from("social_posts")
      .update({
        status: finalStatus,
        posted_at: finalStatus === "posted" ? nowIso : null,
        error_message: errorMessage,
      })
      .eq("id", id);
  }

  // ── 2. Reconcile IG containers still in-progress past the poll window ──────
  const meta = getMetaConfig();
  const cutoff = new Date(Date.now() - RECONCILE_AFTER_MIN * 60 * 1000).toISOString();

  const { data: stuckResults } = await supabase
    .from("social_post_results")
    .select("post_id, blotato_submission_id")
    .eq("platform", "instagram")
    .eq("status", "in-progress")
    .not("blotato_submission_id", "is", null)
    .lt("created_at", cutoff)
    .limit(BATCH_LIMIT);

  for (const row of stuckResults ?? []) {
    const containerId = row.blotato_submission_id as string;
    if (!meta || !containerId) continue;

    const reconciledRes = await reconcileIgContainer(meta, containerId);
    if (!reconciledRes) continue; // still processing — next run

    await supabase
      .from("social_post_results")
      .update({
        status: reconciledRes.status,
        blotato_submission_id: reconciledRes.submissionId ?? containerId,
        public_url: reconciledRes.publicUrl ?? null,
        error_message: reconciledRes.errorMessage ?? null,
        posted_at: reconciledRes.status === "published" ? new Date().toISOString() : null,
      })
      .eq("post_id", row.post_id)
      .eq("platform", "instagram");

    await finalizePostIfSettled(supabase, row.post_id);
    reconciled += 1;
  }

  // ── 3. Finalize posts stuck in 'posting' whose results are all final ───────
  const { data: postingPosts } = await supabase
    .from("social_posts")
    .select("id, platforms")
    .eq("status", "posting")
    .lt("updated_at", cutoff)
    .limit(BATCH_LIMIT);

  for (const post of postingPosts ?? []) {
    await finalizePostIfSettled(supabase, post.id);
  }

  const detail = `published=${published} failed=${failed} inProgress=${inProgress} claimedSkipped=${claimedSkipped} reconciled=${reconciled}`;
  await recordCronRun("social-scheduler", true, detail);

  return NextResponse.json({ ok: true, published, failed, inProgress, claimedSkipped, reconciled });
}

/**
 * If every platform result for a post is final (published/failed), collapse the
 * post to its terminal status. No-ops while any result is still in-progress.
 */
async function finalizePostIfSettled(
  supabase: ReturnType<typeof createServiceClient>,
  postId: string
): Promise<void> {
  const { data: results, error } = await supabase
    .from("social_post_results")
    .select("platform, status, error_message")
    .eq("post_id", postId);

  if (error || !results || results.length === 0) return;

  const anyInProgress = results.some((r: { status: string }) => r.status === "in-progress");
  if (anyInProgress) return;

  const anyFailed = results.some((r: { status: string }) => r.status === "failed");
  const errorMessage = anyFailed
    ? results
        .filter((r: { status: string; error_message: string | null }) => r.status === "failed" && r.error_message)
        .map((r: { platform: string; error_message: string | null }) => `${r.platform}: ${r.error_message}`)
        .join(" | ")
    : null;

  await supabase
    .from("social_posts")
    .update({
      status: anyFailed ? "failed" : "posted",
      posted_at: anyFailed ? null : new Date().toISOString(),
      error_message: errorMessage,
    })
    .eq("id", postId)
    .eq("status", "posting");
}
