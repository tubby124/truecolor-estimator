/**
 * Cron heartbeat — records that a cron route actually executed its logic.
 *
 * Fail-quiet by design: a heartbeat write must NEVER break the cron itself.
 * If the cron_runs table doesn't exist yet (migration not applied) or the
 * insert fails, we swallow the error — the cron's real work already happened.
 *
 * Read by scripts/harness/reconcile-check.mjs to detect silent cron death.
 *
 * Server-only — uses the service client.
 */

import { createServiceClient } from "@/lib/supabase/server";

export async function recordCronRun(
  cronName: string,
  ok: boolean = true,
  detail?: string
): Promise<void> {
  try {
    const supabase = createServiceClient();
    await supabase.from("cron_runs").insert({
      cron_name: cronName,
      ok,
      detail: detail ?? null,
    });
  } catch (err) {
    // Never let the heartbeat break the cron. Log and move on.
    console.error(
      `[heartbeat] failed to record cron_run for ${cronName} (non-fatal):`,
      err instanceof Error ? err.message : err
    );
  }
}
