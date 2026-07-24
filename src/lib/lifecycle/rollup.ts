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

export interface MeasurementOutboxCounts {
  queryFailed: number;
  dead: number;
  staleProcessing: number;
  overdueRetry: number;
}

export interface WaveProvisioningHealth {
  staleCreating: number;
  ambiguous: number;
  failed: number;
}

export interface QuoteDeliveryHealth {
  publicStale: number;
  publicFailedUnresolved: number;
  pricedStale: number;
  pricedFailedUnresolved: number;
  publicQueryError: number;
  pricedQueryError: number;
}

export interface RollupInputs {
  bookkeepingRisks: BookkeepingRiskRow[];
  webhookGroups: WebhookSourceGroup[];
  heartbeats: Heartbeat[];
  waveDrafts: WaveDraftRow[];
  orphans: Orphan[];
  /** Latest reconcile-payments cron_runs.detail string (e.g. "3 issues, 1 recovered, 2 unverified"). */
  reconcileDetail: string | null;
  /**
   * Count of clover_card orders CREATED in the last 24h. Denominator for the
   * Clover webhook-silence check: real order flow with zero webhook events =
   * the confirmation pipe is down (auth-reject / unsubscribed), which failed_24h
   * cannot see because a rejected webhook writes no row. Born from the
   * 2026-06-04 Clover outage that ran silently for 21 days while staff
   * hand-confirmed 28 orders.
   */
  cloverOrders24h: number;
  /**
   * Count of clover_card orders still in pending_payment that are 30+ min old
   * AND have payment_reference set (customer opened Clover checkout). Card was
   * likely declined or abandoned. Staff should verify whether an e-transfer
   * landed or follow up with the customer.
   */
  stuckCloverAttempts: number;
  /** Days since `.claude/rules/seo-protected-pages.md` was last refreshed. */
  seoProtectedPagesStaleDays: number | null;
  /**
   * Percent divergence between GSC clicks and GA4 organic sessions over the
   * last stable 7-day window (max(a,b)-min(a,b))/max(a,b)*100. Null when one
   * or both sides have zero data (e.g. ga4-sync hasn't backfilled yet).
   * Fires YELLOW above 50% — meaningful divergence means one of the two
   * ingestion pipes is silently broken, even if both heartbeats are green.
   */
  gscVsGa4DivergencePct: number | null;
  /** Latest Google Ads monitor detail, retained for dashboard context. */
  googleAdsMonitorDetail: string | null;
  /** Durable conversion-delivery failure classes, split by outbox. */
  measurementOutboxes: {
    revenue: MeasurementOutboxCounts;
    quote: MeasurementOutboxCounts;
  };
  /** Durable receipt/GA4/Brevo work created by a paid Wave transition. */
  wavePaymentEffects: MeasurementOutboxCounts;
  /** Wave-before-Clover reservations that need intervention. */
  waveProvisioning: WaveProvisioningHealth;
  /** Public confirmations and payable quotes awaiting provider reconciliation. */
  quoteDeliveries: QuoteDeliveryHealth;
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

  // ── Stuck Clover checkout attempts ────────────────────────────────────────
  // Card was declined or abandoned. Staff may need to confirm an e-transfer or
  // follow up with the customer. Yellow (not red) because the customer might
  // still be paying; escalate to red only if persistent across multiple ticks.
  if (inputs.stuckCloverAttempts > 0) {
    yellows.push({
      key: "clover:stuck-attempts",
      panel: "panel-webhook-health",
      label: `${inputs.stuckCloverAttempts} card checkout unresolved — card may have been declined, verify or confirm e-transfer`,
    });
  }

  // ── Webhook SILENCE — the failed_24h check above is blind to it ─────────────
  // failed_24h counts ROWS in webhook_events. A webhook rejected at the secret
  // check (401) or never delivered (Clover subscription removed / URL changed)
  // writes NO row, so failed_24h stays 0 and the source reads healthy. The
  // 2026-06-04 Clover outage hid here for 21 days: zero Clover webhooks reached
  // the handler while 28 clover_card orders were confirmed by hand (staff:manual)
  // and several stuck unpaid. Same shape as the gsc-sync silent outage above —
  // detect via the order-volume denominator, not the (empty) failure count.
  const cloverGroup = inputs.webhookGroups.find((g) => g.source === "clover");
  if (cloverGroup && inputs.cloverOrders24h >= 2 && cloverGroup.total_24h === 0) {
    reds.push({
      key: "webhook:clover:silent",
      panel: "panel-webhook-health",
      label: `Clover webhook silent: ${inputs.cloverOrders24h} card order(s) in 24h, 0 webhooks — confirmations are manual or missing`,
    });
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

  // ── Google Ads spend monitor outcomes ────────────────────────────────────
  // A healthy heartbeat only proves that the monitor executed. WARNING and
  // STOPPED are successful monitor decisions, so they intentionally retain
  // ok=true; interpret the structured detail here so the shared dashboard
  // alert cron still sends Telegram evidence for spend warnings and stops.
  if (inputs.googleAdsMonitorDetail) {
    const detail = inputs.googleAdsMonitorDetail;
    const field = (name: string): string | null =>
      new RegExp(`(?:^|\\s)${name}=([^\\s]+)`).exec(detail)?.[1] ?? null;
    const outcome = field("outcome");
    const action = field("action");
    const spend = field("spend");
    const pauseVerified = field("pause_verified") === "1";
    const spendLabel = spend && spend !== "unknown" ? ` at CA$${spend}` : "";

    if (outcome === "WARNING") {
      reds.push({
        key: "google-ads-monitor:warning",
        panel: "panel-cron-heartbeats",
        label: `Google Ads spend warning${spendLabel} — CA$500 warning threshold reached`,
      });
    } else if (outcome === "STOPPED" && pauseVerified) {
      reds.push({
        key: "google-ads-monitor:protective-stop",
        panel: "panel-cron-heartbeats",
        label: `Google Ads protective stop verified${spendLabel} (${action ?? "paused"})`,
      });
    } else if (
      outcome === "STOP_REQUIRED"
      || outcome === "STOPPED"
      || outcome?.startsWith("ERROR")
    ) {
      reds.push({
        key: "google-ads-monitor:unsafe",
        panel: "panel-cron-heartbeats",
        label: `Google Ads monitor unsafe: outcome=${outcome ?? "unknown"} action=${action ?? "unknown"} pause_verified=${pauseVerified ? 1 : 0}${spendLabel}`,
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
  // ga4-sync joins the critical set as defense-in-depth — if it dies the same
  // way gsc-sync did (auth expiry, quota), we need to see RED before another
  // 16-day silent window. Both pipes are now on the same fail-loud contract.
  const CRITICAL_EXTERNAL_CRONS = new Set([
    "gsc-sync",
    "ga4-sync",
    "wave-payment-effects",
    "google-ads-monitor",
    "google-ads-conversions",
  ]);
  const STRICT_THIRTY_MINUTE_CRONS = new Set([
    "wave-payment-effects",
    "google-ads-monitor",
    "google-ads-conversions",
  ]);
  const CRITICAL_FAIL_THRESHOLD = 0.5;

  for (const h of inputs.heartbeats) {
    const strictThirtyMinute = STRICT_THIRTY_MINUTE_CRONS.has(h.name);
    const stale = h.hours_ago === null || h.hours_ago > (strictThirtyMinute ? h.max_age_hours : 2 * h.max_age_hours);
    if (stale) {
      const age = h.hours_ago === null ? "never ran" : `stale ${Math.round(h.hours_ago * 60)}m`;
      const maxAge = h.max_age_hours === 0.5 ? "30m" : `${h.max_age_hours}h`;
      reds.push({
        key: `cron:${h.name}:stale`,
        panel: "panel-cron-heartbeats",
        label: `${h.name} ${age} (max ${maxAge})`,
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

  // ── Paid-search measurement delivery ─────────────────────────────────────
  for (const [kind, counts] of Object.entries(inputs.measurementOutboxes) as Array<
    ["revenue" | "quote", MeasurementOutboxCounts]
  >) {
    const failures: Array<[keyof MeasurementOutboxCounts, string, string]> = [
      ["queryFailed", "query-failed", "query failed"],
      ["dead", "dead", "dead"],
      ["staleProcessing", "stale-processing", "stale processing"],
      ["overdueRetry", "overdue-retry", "overdue retry"],
    ];
    for (const [field, key, label] of failures) {
      if (counts[field] > 0) {
        reds.push({
          key: `measurement-outbox:${kind}:${key}`,
          panel: "panel-cron-heartbeats",
          label: `${kind} conversion outbox: ${counts[field]} ${label}`,
        });
      }
    }
  }

  // ── Wave paid-order effects ──────────────────────────────────────────────
  // The heartbeat proves the worker ran; these durable state checks catch a
  // dead or abandoned row that would otherwise disappear after a later empty,
  // successful run and remain invisible to both dashboard and Telegram.
  const waveEffectFailures: Array<[keyof MeasurementOutboxCounts, string, string]> = [
    ["queryFailed", "query-failed", "query failed"],
    ["dead", "dead", "dead"],
    ["staleProcessing", "stale-processing", "stale processing"],
    ["overdueRetry", "overdue-retry", "overdue retry"],
  ];
  for (const [field, key, label] of waveEffectFailures) {
    if (inputs.wavePaymentEffects[field] > 0) {
      reds.push({
        key: `wave-payment-effects:${key}`,
        panel: "panel-cron-heartbeats",
        label: `Wave payment effects: ${inputs.wavePaymentEffects[field]} ${label}`,
      });
    }
  }

  // ── Wave-before-Clover durable provisioning ──────────────────────────────
  const waveFailures: Array<[keyof WaveProvisioningHealth, string, string]> = [
    ["staleCreating", "stale-creating", "stale creating"],
    ["ambiguous", "ambiguous", "ambiguous"],
    ["failed", "failed", "failed"],
  ];
  for (const [field, key, label] of waveFailures) {
    if (inputs.waveProvisioning[field] > 0) {
      reds.push({
        key: `wave-provisioning:${key}`,
        panel: "panel-wave-drafts",
        label: `Wave provisioning: ${inputs.waveProvisioning[field]} ${label}`,
      });
    }
  }

  // ── Quote email provider reconciliation ──────────────────────────────────
  // These rows survive request failures and later healthy traffic. Surface
  // them in the shared rollup so both the dashboard and Telegram alert cron
  // tell staff to use the authenticated reconciliation endpoint.
  const quoteDeliveryFailures: Array<
    [keyof QuoteDeliveryHealth, string, string]
  > = [
    ["publicStale", "public-stale", "public quote email(s) awaiting provider confirmation"],
    ["publicFailedUnresolved", "public-failed", "public quote email failure(s) unresolved"],
    ["pricedStale", "priced-stale", "priced quote email(s) awaiting provider confirmation"],
    ["pricedFailedUnresolved", "priced-failed", "priced quote email failure(s) unresolved"],
    ["publicQueryError", "public-query-error", "public quote delivery ledger query failure(s)"],
    ["pricedQueryError", "priced-query-error", "priced quote delivery ledger query failure(s)"],
  ];
  for (const [field, key, label] of quoteDeliveryFailures) {
    if (inputs.quoteDeliveries[field] > 0) {
      reds.push({
        key: `quote-delivery:${key}`,
        panel: "panel-quote-deliveries",
        label: `${inputs.quoteDeliveries[field]} ${label}`,
      });
    }
  }

  // ── SEO protected-pages doc staleness ─────────────────────────────────────
  //
  // The May 2026 ranking decay went unnoticed for 60 days because the doc
  // said positions that no longer existed. The PostToolUse seo-cooldown-check
  // hook catches this at EDIT time, but only when somebody is editing — a
  // truly silent window (no SEO work for 35+ days) wouldn't trip it. This
  // daily rollup signal fires regardless of edit activity.
  if (inputs.seoProtectedPagesStaleDays !== null) {
    if (inputs.seoProtectedPagesStaleDays > 35) {
      reds.push({
        key: "seo:protected-pages:stale",
        panel: "panel-cron-heartbeats",
        label: `seo-protected-pages.md stale ${inputs.seoProtectedPagesStaleDays}d (>35d threshold)`,
      });
    } else if (inputs.seoProtectedPagesStaleDays > 28) {
      yellows.push({
        key: "seo:protected-pages:approaching-stale",
        panel: "panel-cron-heartbeats",
        label: `seo-protected-pages.md ${inputs.seoProtectedPagesStaleDays}d old (28d cadence)`,
      });
    }
  }

  // ── GSC vs GA4 organic-traffic divergence (Phase 9d defense-in-depth) ─────
  //
  // Both heartbeats can be green (cron returns 200) while one pipe is silently
  // returning stale or partial data — GSC OAuth refresh-token expiry returned
  // empty result sets without an HTTP error for the first few hours of the
  // May 2026 outage. Cross-checking the two pulls against each other catches
  // that class of failure: GSC clicks (organic) and GA4 organic-search sessions
  // are not identical metrics but should track within ~50% on any healthy site.
  if (inputs.gscVsGa4DivergencePct !== null && inputs.gscVsGa4DivergencePct > 50) {
    yellows.push({
      key: "seo:gsc-vs-ga4-divergence",
      panel: "panel-cron-heartbeats",
      label: `GSC clicks vs GA4 organic sessions ${inputs.gscVsGa4DivergencePct}% divergent (7d) — one pipe may be silently broken`,
    });
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
  // Urgent = rush order OR customer-noted urgency (call/funeral/rush/urgent/asap)
  // OR age > 12h. These get a red telegram within the hour. Non-urgent stay yellow.
  // TC-2026-0115/0116 (Rodney Russell, funeral, 2026-05-27) was the trigger
  // for this escalation — sat unpaid with "call to confirm" notes and no push.
  // is_rush added 2026-06-25 (TC-2026-0164, Keely Bitternose): a same-day rush
  // order sat as a low-priority yellow because its notes ("pick up same day")
  // didn't match URGENT_NOTES and it was <12h old. A rush slot the customer
  // configured but never paid for is exactly what staff must chase fastest.
  const URGENT_NOTES = /\b(call|funeral|urgent|rush|asap|emergency)\b/i;
  const urgent = inputs.orphans.filter(
    (o) => o.is_rush || o.age_hours > 12 || (o.notes != null && URGENT_NOTES.test(o.notes))
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
