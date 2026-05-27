/**
 * EmailVolumePanel — per-recipient email send counts (24h + 7d).
 *
 * Built 2026-05-27 in response to the "am I spamming albert@true-color.ca?"
 * concern. The dashboard shows total volume, top recipients, and flags any
 * staff inbox that crosses a noise threshold.
 *
 * Source: email_log.to_address grouped by recipient. Counts are best-effort
 * (some sends pre-date the log; failed-but-logged rows still count).
 */

const STAFF_INBOXES = new Set([
  "info@true-color.ca",
  "albert@true-color.ca",
  "hasan.sharif.realtor@gmail.com",
  "hasan.sharif@exprealty.com",
]);

// Noise threshold per staff inbox per 7d before we flag yellow.
const STAFF_VOLUME_YELLOW = 40;

export interface EmailVolumeRow {
  to_address: string;
  count_24h: number;
  count_7d: number;
  is_staff: boolean;
}

export interface EmailVolumeSnapshot {
  total_24h: number;
  total_7d: number;
  rows: EmailVolumeRow[]; // sorted desc by 7d count
}

export function buildEmailVolumeSnapshot(
  log: Array<{ to_address: string; sent_at: string }>
): EmailVolumeSnapshot {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const counts = new Map<string, { c24: number; c7: number }>();
  let total24 = 0;
  let total7 = 0;
  for (const row of log) {
    const addr = row.to_address?.toLowerCase().trim();
    if (!addr) continue;
    const t = new Date(row.sent_at).getTime();
    const isRecent = t >= dayAgo;
    const bucket = counts.get(addr) ?? { c24: 0, c7: 0 };
    bucket.c7 += 1;
    total7 += 1;
    if (isRecent) {
      bucket.c24 += 1;
      total24 += 1;
    }
    counts.set(addr, bucket);
  }
  const rows: EmailVolumeRow[] = Array.from(counts.entries())
    .map(([to_address, b]) => ({
      to_address,
      count_24h: b.c24,
      count_7d: b.c7,
      is_staff: STAFF_INBOXES.has(to_address),
    }))
    .sort((a, b) => b.count_7d - a.count_7d);
  return { total_24h: total24, total_7d: total7, rows };
}

export function EmailVolumePanel({ snapshot }: { snapshot: EmailVolumeSnapshot }) {
  const topRows = snapshot.rows.slice(0, 12);
  const noisyStaff = snapshot.rows.filter(
    (r) => r.is_staff && r.count_7d > STAFF_VOLUME_YELLOW
  );

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Email volume <span className="text-gray-400 normal-case font-normal">by recipient</span>
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-0.5 rounded ring-1 ring-gray-200">
            {snapshot.total_24h} sent / 24h
          </span>
          <span className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-0.5 rounded ring-1 ring-gray-200">
            {snapshot.total_7d} sent / 7d
          </span>
          {noisyStaff.length > 0 && (
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded ring-1 ring-amber-200">
              {noisyStaff.length} noisy inbox
            </span>
          )}
        </div>
      </div>

      {topRows.length === 0 ? (
        <p className="text-xs text-gray-400">No emails sent yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Recipient</th>
                <th className="text-right px-3 py-2 font-medium">24h</th>
                <th className="text-right px-3 py-2 font-medium">7d</th>
                <th className="text-left px-3 py-2 font-medium">Tag</th>
              </tr>
            </thead>
            <tbody>
              {topRows.map((r) => {
                const noisy = r.is_staff && r.count_7d > STAFF_VOLUME_YELLOW;
                return (
                  <tr key={r.to_address} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-mono text-xs text-gray-800">{r.to_address}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{r.count_24h}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs font-semibold">{r.count_7d}</td>
                    <td className="px-3 py-2">
                      {r.is_staff ? (
                        <span
                          className={
                            noisy
                              ? "text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded"
                              : "text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded"
                          }
                        >
                          {noisy ? "staff · noisy" : "staff"}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">customer</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {noisyStaff.length > 0 && (
        <p className="text-xs text-amber-700 mt-2">
          {noisyStaff.map((r) => r.to_address).join(", ")} crossed {STAFF_VOLUME_YELLOW}+ emails in 7d.
          Consider trimming staff CC/BCC or moving low-priority alerts to Telegram.
        </p>
      )}
    </section>
  );
}
