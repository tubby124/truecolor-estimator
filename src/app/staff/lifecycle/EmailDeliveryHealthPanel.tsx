/**
 * EmailDeliveryHealthPanel — aggregate Resend delivery stats for the last 7 days.
 *
 * Sourced from email_log.delivered_at / opened_at / bounced_at columns
 * (added in migration 20260526140000_email_log_delivery_columns.sql).
 *
 * Until the Resend webhook has been firing for a while, delivered/opened/bounced
 * will show 0 even if sent > 0 — that's expected. The panel makes the gap visible.
 */

export interface EmailDeliveryHealth {
  sent: number;
  delivered: number;
  opened: number;
  bounced: number;
  delivery_rate_pct: number | null;  // null until at least 1 sent
  open_rate_pct: number | null;
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`rounded-lg border p-3 flex flex-col gap-0.5 ${color}`}>
      <div className="text-lg font-bold font-mono">{value}</div>
      <div className="text-xs font-medium text-gray-600">{label}</div>
    </div>
  );
}

export function EmailDeliveryHealthPanel({ health }: { health: EmailDeliveryHealth }) {
  const hasBounces = health.bounced > 0;
  const webhookGap = health.sent > 0 && health.delivered === 0;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Email delivery health <span className="text-gray-400 normal-case font-normal">last 7 days</span>
        </h2>
        <div className="flex items-center gap-2">
          {hasBounces && (
            <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded ring-1 ring-red-200">
              {health.bounced} BOUNCE{health.bounced !== 1 ? "S" : ""}
            </span>
          )}
          {webhookGap && (
            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded ring-1 ring-amber-200 font-medium">
              Resend webhook not confirming yet
            </span>
          )}
          {!hasBounces && !webhookGap && health.sent > 0 && (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {health.delivery_rate_pct !== null ? `${health.delivery_rate_pct}% delivered` : "tracking"}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat
          label="Sent"
          value={String(health.sent)}
          color="bg-white border-gray-200"
        />
        <Stat
          label={`Delivered${health.delivery_rate_pct !== null ? ` (${health.delivery_rate_pct}%)` : ""}`}
          value={health.sent === 0 ? "—" : String(health.delivered)}
          color={
            health.sent > 0 && health.delivered === 0
              ? "bg-amber-50 border-amber-200"
              : "bg-emerald-50 border-emerald-200"
          }
        />
        <Stat
          label={`Opened${health.open_rate_pct !== null ? ` (${health.open_rate_pct}%)` : ""}`}
          value={health.sent === 0 ? "—" : String(health.opened)}
          color="bg-blue-50 border-blue-200"
        />
        <Stat
          label="Bounced"
          value={String(health.bounced)}
          color={health.bounced > 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}
        />
      </div>

      {webhookGap && (
        <p className="text-xs text-amber-700 mt-2">
          Sent count is populated from successful Brevo API calls. Delivered/opened/bounced
          require the Resend webhook to fire. If this stays at 0 delivered for 24h after emails
          are sent, check the Resend webhook config in the Resend dashboard.
        </p>
      )}
    </section>
  );
}
