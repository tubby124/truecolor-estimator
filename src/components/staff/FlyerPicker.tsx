"use client";

/**
 * FlyerPicker — the ONE flyer selector used by every staff surface.
 *
 * Why this exists: flyers are fixed-size SKUs that vary by size, paper weight,
 * sides, and qty. The staff estimator and the manual-order modal each used to
 * have their own (or no) flyer UI, so they diverged. This component is a single
 * cascading Size → Paper → Sides → Qty picker fed by /api/staff/flyer-pricing,
 * which prices every SKU through the live engine (src/lib/engine). Both surfaces
 * render this same picker and resolve to the same engine-priced SKU — no parallel
 * logic, no hand-typed prices.
 *
 * Client-safe: declares its own FlyerSku shape (mirrors src/lib/data/flyer-catalog.ts)
 * so the server-only engine never gets pulled into the client bundle.
 */

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export type FlyerSku = {
  productId: string;
  sizeKey: string; // FULL | HALF | RACK | other
  sizeLabel: string; // e.g. "Full Letter — 8.5×11″"
  widthIn: number;
  heightIn: number;
  materialCode: string;
  paperLabel: string; // e.g. "80lb Gloss Text"
  sides: 1 | 2;
  qty: number;
  price: number; // engine total for the lot (CAD, pre-tax)
  unitPrice: number; // price / qty
};

export interface FlyerSelection {
  sizeKey?: string;
  paperLabel?: string;
  sides?: 1 | 2;
  qty?: number;
}

// Process-lifetime cache so the catalog is fetched once per session, shared
// across every mount (estimator + orders modal) instead of refetching per open.
let _catalogCache: FlyerSku[] | null = null;

/** Fetch the engine-priced flyer catalog once and share it across components. */
export function useFlyerCatalog(): FlyerSku[] {
  const [skus, setSkus] = useState<FlyerSku[]>(_catalogCache ?? []);
  useEffect(() => {
    if (_catalogCache) return;
    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/staff/flyer-pricing");
        if (!res.ok) return;
        const data = (await res.json()) as { skus?: FlyerSku[] };
        if (active && Array.isArray(data.skus)) {
          _catalogCache = data.skus;
          setSkus(data.skus);
        }
      } catch {
        /* leave empty — picker shows a loading state */
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  return skus;
}

/** A selection only resolves to a price when all four levels are chosen. */
export function resolveFlyerSku(catalog: FlyerSku[], sel: FlyerSelection): FlyerSku | null {
  if (!sel.sizeKey || !sel.paperLabel || !sel.sides || !sel.qty) return null;
  return (
    catalog.find(
      (s) =>
        s.sizeKey === sel.sizeKey &&
        s.paperLabel === sel.paperLabel &&
        s.sides === sel.sides &&
        s.qty === sel.qty,
    ) ?? null
  );
}

/** Changing an upstream level clears everything downstream (cascade reset). */
export function applyFlyerLevel(
  sel: FlyerSelection,
  level: "size" | "paper" | "sides" | "qty",
  value: string | number,
): FlyerSelection {
  switch (level) {
    case "size":
      return { sizeKey: String(value) };
    case "paper":
      return { sizeKey: sel.sizeKey, paperLabel: String(value) };
    case "sides":
      return { sizeKey: sel.sizeKey, paperLabel: sel.paperLabel, sides: Number(value) as 1 | 2 };
    case "qty":
    default:
      return { ...sel, qty: Number(value) };
  }
}

interface Props {
  catalog: FlyerSku[];
  selection: FlyerSelection;
  onChange: (next: FlyerSelection, resolved: FlyerSku | null) => void;
}

function uniqBy<T>(arr: T[], key: (t: T) => string | number): T[] {
  return arr.filter((s, i, a) => a.findIndex((x) => key(x) === key(s)) === i);
}

// Module-level so it isn't re-created on every render (would remount + drop focus).
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700/70 w-12 shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

export function FlyerPicker({ catalog, selection, onChange }: Props) {
  if (catalog.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 text-[11px] text-emerald-700">
        Loading flyer prices…
      </div>
    );
  }

  const { sizeKey, paperLabel, sides, qty } = selection;
  const sizes = uniqBy(catalog, (s) => s.sizeKey);
  const papers = uniqBy(
    catalog.filter((s) => s.sizeKey === sizeKey),
    (s) => s.paperLabel,
  );
  const sidesOpts = uniqBy(
    catalog.filter((s) => s.sizeKey === sizeKey && s.paperLabel === paperLabel),
    (s) => s.sides,
  );
  const qtys = catalog
    .filter((s) => s.sizeKey === sizeKey && s.paperLabel === paperLabel && s.sides === sides)
    .sort((a, b) => a.qty - b.qty);
  const resolved = resolveFlyerSku(catalog, selection);

  const choose = (level: "size" | "paper" | "sides" | "qty", value: string | number) => {
    const next = applyFlyerLevel(selection, level, value);
    onChange(next, resolveFlyerSku(catalog, next));
  };

  const pill = (active: boolean) =>
    `px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors ${
      active
        ? "bg-emerald-500 border-emerald-500 text-white"
        : "bg-white border-emerald-200 text-emerald-700 hover:border-emerald-400"
    }`;

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
        Flyer price · live engine
      </p>
      <Row label="Size">
        {sizes.map((s) => (
          <button key={s.sizeKey} type="button" className={pill(sizeKey === s.sizeKey)} onClick={() => choose("size", s.sizeKey)}>
            {s.sizeLabel}
          </button>
        ))}
      </Row>
      {sizeKey && (
        <Row label="Paper">
          {papers.map((s) => (
            <button key={s.paperLabel} type="button" className={pill(paperLabel === s.paperLabel)} onClick={() => choose("paper", s.paperLabel)}>
              {s.paperLabel}
            </button>
          ))}
        </Row>
      )}
      {sizeKey && paperLabel && (
        <Row label="Sides">
          {sidesOpts.map((s) => (
            <button key={s.sides} type="button" className={pill(sides === s.sides)} onClick={() => choose("sides", s.sides)}>
              {s.sides === 2 ? "Double-sided" : "Single-sided"}
            </button>
          ))}
        </Row>
      )}
      {sizeKey && paperLabel && sides && (
        <Row label="Qty">
          {qtys.map((s) => (
            <button key={s.qty} type="button" className={pill(qty === s.qty)} onClick={() => choose("qty", s.qty)}>
              {s.qty}
            </button>
          ))}
        </Row>
      )}
      {resolved && (
        <p className="text-[11px] font-semibold text-emerald-800 pt-0.5">
          ✓ ${resolved.price.toFixed(2)} for {resolved.qty} (${resolved.unitPrice.toFixed(2)}/ea) — matches website
        </p>
      )}
    </div>
  );
}
