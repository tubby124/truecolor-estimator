/**
 * Single source of truth for "is anything wrong right now?"
 *
 * Read path:  /staff/lifecycle dashboard tile renders rollup.reds + rollup.yellows
 * Push path:  /api/cron/dashboard-alerts diffs rollup.reds vs last tick → Telegram
 *
 * Both callers compute the SAME rollup from the SAME inputs. Adding a new
 * silent-fail surface = ONE registration here; dashboard + Telegram pick it
 * up automatically. Do not add inline Telegram calls at the failure site —
 * they bypass the dedup layer and cause spam.
 *
 * Rule lives in .claude/rules/lifecycle-rollup-contract.md.
 */

import type { BookkeepingRiskRow } from "@/app/staff/lifecycle/BookkeepingRiskPanel";
import type { WebhookSourceGroup } from "@/app/staff/lifecycle/WebhookHealthPanel";
import type { Heartbeat } from "@/app/staff/lifecycle/HeartbeatsPanel";
import type { WaveDraftRow } from "@/app/staff/lifecycle/WaveDraftPanel";
import type { Orphan } from "@/app/staff/lifecycle/OrphanPanel";

export interface RollupIssue {
  /** Stable key — used by Telegram dedup AND dashboard anchor href. */
  key: string;
  /** Anchor target on /staff/lifecycle (id="panel-X"). */
  panel: string;
  /** Short human-readable label. Appears as a chip on the dashboard and as the Telegram subject line. */
  label: string;
}

export interface StatusRollup {
  reds: RollupIssue[];
  yellows: RollupIssue[];
}

export interface RollupInputs {
  bookkeepingRisks: BookkeepingRiskRow[];
  webhookGroups: WebhookSourceGroup[];
  heartbeats: Heartbeat[];
  waveDrafts: WaveDraftRow[];
  orphans: Orphan[];
  /** Latest reconcile-payments cron_runs.detail string (e.g. "3 issues, 1 recovered, 2 unverified"). */
  reconcileDetail: string | null;
}

const SEV1_CATEGORIES = new Set(["no_wave_invoice", "half_recorded"]);

export function buildRollup(inputs: RollupInputs): StatusRollup {
  const reds: RollupIssue[] = [];
  const yellows: RollupIssue[] = [];

  // ── Bookkeeping risk: severity-1 = red, 2-3 = yellow ───────────────────────
  const sev1Count = inputs.bookkeepingRisks.filter((r) => SEV1_CATEGORIES.has(r.category)).length;
  const sev23Count = inputs.bookkeepingRisks.length - sev1Count;
  if (sev1Count > 0) {
    reds.push({
      key: "bookkeeping:sev1",
      panel: "panel-bookkeeping-risk",
      label: `Bookkeeping risk: ${sev1Count} critical`,
    });
  }
  if (sev23Count > 0) {
    yellows.push({
      key: "bookkeeping:sev23",
      panel: "panel-bookkeeping-risk",
      label: `Bookkeeping risk: ${sev23Count} warning`,
    });
  }

  // ── Webhook failures (per source, last 24h) ────────────────────────────────
  for (const g of inputs.webhookGroups) {
    if (g.failed_24h > 0) {
      reds.push({
        key: `webhook:${g.source}:failed`,
        panel: "panel-webhook-health",
        label: `${g.label} webhook: ${g.failed_24h} failed (24h)`,
      });
    }
  }

  // ── Reconcile unverified count from latest cron_runs.detail ────────────────
  if (inputs.reconcileDetail) {
    const m = /(\d+)\s+unverified/i.exec(inputs.reconcileDetail);
    const unverified = m ? Number(m[1]) : 0;
    if (unverified > 0) {
      reds.push({
        key: "reconcile:unverified",
        panel: "panel-cron-heartbeats",
        label: `Reconcile: ${unverified} unverified`,
      });
    }
  }

  // ── Cron heartbeats: stale > 2× expected = red, persistent external-API
  //    failure = red, transient error rate > 0 = yellow ───────────────────────
  //
  // Why CRITICAL_EXTERNAL_CRONS escalates to red instead of yellow:
  // The 2026-05-13 → 2026-05-29 gsc-sync outage ran daily but returned
  // `invalid_grant` every time. hours_ago stayed at ~24h (not stale) and
  // error_rate_24h was 100%, which the old code surfaced as YELLOW only —
  // dashboard only, no Telegram. Result: nobody noticed for 16 days while
  // ranking pages decayed. External-API auth failures are not transient; if
  // half the runs fail in 24h, the auth is dead and needs hands-on rotation.
  const CRITICAL_EXTERNAL_CRONS = new Set(["gsc-sync"]);
  const CRITICAL_FAIL_THRESHOLD = 0.5;

  for (const h of inputs.heartbeats) {
    if (h.hours_ago !== null && h.hours_ago > 2 * h.max_age_hours) {
      reds.push({
        key: `cron:${h.name}:stale`,
        panel: "panel-cron-heartbeats",
        label: `${h.name} stale ${Math.round(h.hours_ago)}h (max ${h.max_age_hours}h)`,
      });
    } else if (
      CRITICAL_EXTERNAL_CRONS.has(h.name) &&
      h.runs_24h >= 1 &&
      h.error_rate_24h !== null &&
      h.error_rate_24h >= CRITICAL_FAIL_THRESHOLD
    ) {
      reds.push({
        key: `cron:${h.name}:persistent-fail`,
        panel: "panel-cron-heartbeats",
        label: `${h.name}: ${Math.round(h.error_rate_24h * 100)}% error rate (24h) — external API auth likely dead`,
      });
    } else if (h.error_rate_24h !== null && h.error_rate_24h > 0) {
      yellows.push({
        key: `cron:${h.name}:errors`,
        panel: "panel-cron-heartbeats",
        label: `${h.name}: ${Math.round(h.error_rate_24h * 100)}% error rate (24h)`,
      });
    }
  }

  // ── Wave drafts (24h) ─────────────────────────────────────────────────────
  const waveDrafts24h = inputs.waveDrafts.filter((d) => d.paid_age_hours < 24).length;
  if (waveDrafts24h > 0) {
    yellows.push({
      key: "wave:drafts:24h",
      panel: "panel-wave-drafts",
      label: `Wave drafts: ${waveDrafts24h} (24h)`,
    });
  }

  // ── Orphan orders ─────────────────────────────────────────────────────────
  // Urgent = customer-noted urgency (call/funeral/rush/urgent/asap) OR age > 12h.
  // These get a red telegram within the hour. Non-urgent stay yellow.
  // TC-2026-0115/0116 (Rodney Russell, funeral, 2026-05-27) was the trigger
  // for this escalation — sat unpaid with "call to confirm" notes and no push.
  const URGENT_NOTES = /\b(call|funeral|urgent|rush|asap|emergency)\b/i;
  const urgent = inputs.orphans.filter(
    (o) => o.age_hours > 12 || (o.notes != null && URGENT_NOTES.test(o.notes))
  );
  if (urgent.length > 0) {
    reds.push({
      key: "orphans:urgent",
      panel: "panel-orphans",
      label: `${urgent.length} urgent unpaid order(s)`,
    });
  }
  const nonUrgent = inputs.orphans.length - urgent.length;
  if (nonUrgent > 0) {
    yellows.push({
      key: "orphans",
      panel: "panel-orphans",
      label: `Orphans: ${nonUrgent}`,
    });
  }

  return { reds, yellows };
}
