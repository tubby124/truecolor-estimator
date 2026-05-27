/**
 * StatusRollupPanel — single 2-second-scan answer to "is anything wrong?"
 *
 * Pinned at the top of /staff/lifecycle. Renders the rollup shape built by
 * @/lib/lifecycle/rollup — the SAME function /api/cron/dashboard-alerts uses
 * to fire Telegram. Types live in the lib so drift is impossible.
 *
 *   GREEN  = nothing red anywhere
 *   YELLOW = N warnings (clickable list of which panels)
 *   RED    = N criticals (clickable list of which panels)
 *
 * Anchor hrefs link to id="panel-X" wrappers added on the lifecycle page.
 */

import type { RollupIssue, StatusRollup } from "@/lib/lifecycle/rollup";

function Tile({ tone, title, subtitle, items }: {
  tone: "green" | "yellow" | "red";
  title: string;
  subtitle: string;
  items: RollupIssue[];
}) {
  const styles: Record<typeof tone, { border: string; bg: string; titleClr: string; subClr: string; icon: string }> = {
    green:  { border: "border-emerald-400", bg: "bg-emerald-50", titleClr: "text-emerald-900", subClr: "text-emerald-700", icon: "✓" },
    yellow: { border: "border-amber-400",   bg: "bg-amber-50",   titleClr: "text-amber-900",   subClr: "text-amber-700",   icon: "⚠" },
    red:    { border: "border-red-500",     bg: "bg-red-50",     titleClr: "text-red-900",     subClr: "text-red-700",     icon: "●" },
  };
  const s = styles[tone];
  return (
    <div className={`rounded-xl border-2 ${s.border} ${s.bg} p-4`}>
      <div className="flex items-center gap-3 mb-1">
        <span className={`text-2xl leading-none ${s.titleClr}`}>{s.icon}</span>
        <div>
          <div className={`text-sm font-bold uppercase tracking-wider ${s.titleClr}`}>{title}</div>
          <div className={`text-xs ${s.subClr}`}>{subtitle}</div>
        </div>
      </div>
      {items.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {items.map((it) => (
            <li key={it.panel + it.label}>
              <a
                href={`#${it.panel}`}
                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${s.titleClr} bg-white/60 ring-1 ring-current/20 hover:bg-white`}
              >
                {it.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function StatusRollupPanel({ rollup }: { rollup: StatusRollup }) {
  const { reds, yellows } = rollup;
  if (reds.length === 0 && yellows.length === 0) {
    return (
      <section className="mb-4">
        <Tile tone="green" title="All green" subtitle="Nothing red or yellow across every panel." items={[]} />
      </section>
    );
  }
  return (
    <section className="mb-4 space-y-2">
      {reds.length > 0 && (
        <Tile
          tone="red"
          title={`${reds.length} critical${reds.length !== 1 ? "s" : ""}`}
          subtitle="Address now — these are silent-fail surfaces or stuck money."
          items={reds}
        />
      )}
      {yellows.length > 0 && (
        <Tile
          tone="yellow"
          title={`${yellows.length} warning${yellows.length !== 1 ? "s" : ""}`}
          subtitle="Watch list — recoverable but worth a glance today."
          items={yellows}
        />
      )}
    </section>
  );
}
