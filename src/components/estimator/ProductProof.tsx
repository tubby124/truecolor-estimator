"use client";

import type { Category, Addon } from "@/lib/data/types";

interface Props {
  category: Category;
  widthIn: number;   // 0 for fixed-size/print products
  heightIn: number;
  qty: number;
  sides: 1 | 2;
  addons: Addon[];
  materialName: string;
}

// ─── Layout constants ─────────────────────────────────────────────────────────

const VB_W = 400;  // SVG viewBox width
const VB_H = 220;  // SVG viewBox height
const MAX_W = 280; // max product rect width in SVG units
const MAX_H = 140; // max product rect height in SVG units
const CX = VB_W / 2;
const CY = VB_H / 2;

// Preset aspect ratios for print products (width:height)
const PRINT_ASPECT: Partial<Record<Category, number>> = {
  FLYER: 8.5 / 11,         // portrait
  BUSINESS_CARD: 3.5 / 2,  // landscape card
  BROCHURE: 11 / 8.5,      // tri-fold landscape source sheet
  POSTCARD: 6 / 4,         // landscape
  STICKER: 1,              // square default
};

const SQFT_CATEGORIES: Category[] = [
  "SIGN", "BANNER", "RIGID", "FOAMBOARD", "MAGNET",
  "DECAL", "VINYL_LETTERING", "PHOTO_POSTER", "DISPLAY",
];

// ─── Helper: scale rect to fit max bounds ────────────────────────────────────

function scaleRect(aspect: number): { rW: number; rH: number; x: number; y: number } {
  let rW: number, rH: number;
  if (aspect > MAX_W / MAX_H) {
    rW = MAX_W;
    rH = MAX_W / aspect;
  } else {
    rH = MAX_H;
    rW = MAX_H * aspect;
  }
  return { rW, rH, x: CX - rW / 2, y: CY - rH / 2 };
}

// ─── Grommet positions ────────────────────────────────────────────────────────

function grommets(
  x: number, y: number, rW: number, rH: number,
  widthFt: number, heightFt: number
): { cx: number; cy: number }[] {
  const perimeterFt = 2 * (widthFt + heightFt);
  const count = Math.max(4, Math.ceil(perimeterFt / 2));

  // Distribute around all 4 edges proportionally to edge length
  const top = widthFt;
  const right = heightFt;
  const bottom = widthFt;
  const left = heightFt;
  const perimeter = perimeterFt;

  const topCount = Math.max(2, Math.round((top / perimeter) * count));
  const rightCount = Math.max(1, Math.round((right / perimeter) * count));
  const bottomCount = Math.max(2, Math.round((bottom / perimeter) * count));
  // remainder to left
  const leftCount = Math.max(1, count - topCount - rightCount - bottomCount);

  const pts: { cx: number; cy: number }[] = [];

  // Top edge (left to right)
  for (let i = 0; i < topCount; i++) {
    pts.push({ cx: x + (rW * (i + 1)) / (topCount + 1), cy: y });
  }
  // Right edge (top to bottom)
  for (let i = 0; i < rightCount; i++) {
    pts.push({ cx: x + rW, cy: y + (rH * (i + 1)) / (rightCount + 1) });
  }
  // Bottom edge (right to left)
  for (let i = 0; i < bottomCount; i++) {
    pts.push({ cx: x + rW - (rW * (i + 1)) / (bottomCount + 1), cy: y + rH });
  }
  // Left edge (bottom to top)
  for (let i = 0; i < leftCount; i++) {
    pts.push({ cx: x, cy: y + rH - (rH * (i + 1)) / (leftCount + 1) });
  }

  return pts;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProductProof({
  category, widthIn, heightIn, qty, sides, addons, materialName,
}: Props) {
  const isSqft = SQFT_CATEGORIES.includes(category);
  const hasGrommets = addons.includes("GROMMETS");
  const hasHStake = addons.includes("H_STAKE");

  const today = new Date().toLocaleDateString("en-CA", {
    year: "numeric", month: "short", day: "numeric",
  });

  // Determine rect dimensions
  let aspect: number;
  if (isSqft && widthIn > 0 && heightIn > 0) {
    aspect = widthIn / heightIn;
  } else {
    aspect = PRINT_ASPECT[category] ?? 1;
  }

  const { rW, rH, x, y } = scaleRect(aspect);

  const widthFt = widthIn / 12;
  const heightFt = heightIn / 12;

  // Label formatting
  const dimLabel = isSqft && widthIn > 0
    ? `${widthFt % 1 === 0 ? widthFt : widthFt.toFixed(2)} ft × ${heightFt % 1 === 0 ? heightFt : heightFt.toFixed(2)} ft`
    : null;

  const footerParts = [
    materialName,
    qty > 1 ? `×${qty.toLocaleString()}` : "1 unit",
    sides === 2 ? "2-sided" : "1-sided",
  ];

  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest">
          Quote Proof
        </p>
        <p className="text-xs text-[var(--muted)] font-mono">{today}</p>
      </div>

      {/* SVG diagram */}
      <div className="px-4 py-4">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full"
          style={{ maxHeight: 200 }}
          aria-label={`Product proof diagram for ${category}`}
        >
          {/* Product rectangle */}
          <ProductRect
            category={category}
            x={x} y={y} rW={rW} rH={rH}
            hasGrommets={hasGrommets}
          />

          {/* Grommet overlay */}
          {hasGrommets && isSqft && widthIn > 0 && (
            <GrommetOverlay
              x={x} y={y} rW={rW} rH={rH}
              widthFt={widthFt} heightFt={heightFt}
            />
          )}

          {/* H-Stake overlay */}
          {hasHStake && (
            <HStakeOverlay x={x} y={y} rW={rW} rH={rH} />
          )}

          {/* Dimension labels */}
          {isSqft && widthIn > 0 && heightIn > 0 && (
            <DimensionLabels
              x={x} y={y} rW={rW} rH={rH}
              widthFt={widthFt} heightFt={heightFt}
            />
          )}

          {/* Qty badge (print products) */}
          {!isSqft && qty > 1 && (
            <QtyBadge x={x + rW - 4} y={y + 4} qty={qty} />
          )}
        </svg>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <p className="text-xs text-[var(--muted)] text-center">
          {footerParts.filter(Boolean).join(" · ")}
        </p>
        {dimLabel && (
          <p className="text-xs text-center font-medium text-[var(--foreground)] mt-0.5">
            {dimLabel}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProductRect({
  category, x, y, rW, rH, hasGrommets,
}: {
  category: Category; x: number; y: number; rW: number; rH: number; hasGrommets: boolean;
}) {
  const isRounded = category === "MAGNET";
  const isDashed = category === "DECAL" || category === "STICKER";
  const rx = isRounded ? 10 : 2;

  return (
    <g>
      {/* Main shape */}
      <rect
        x={x} y={y} width={rW} height={rH}
        fill="#f9f9f9"
        stroke={isDashed ? "var(--brand)" : "#d0d0d0"}
        strokeWidth={isDashed ? 1.5 : 1.5}
        strokeDasharray={isDashed ? "6 3" : undefined}
        rx={rx} ry={rx}
      />

      {/* Category-specific internal markers */}
      {category === "SIGN" && <CoroplastFlutes x={x} y={y} rW={rW} rH={rH} />}
      {category === "RIGID" && <MountingHoles x={x} y={y} rW={rW} rH={rH} />}
      {category === "FOAMBOARD" && <FoamboardBorder x={x} y={y} rW={rW} rH={rH} />}
      {category === "PHOTO_POSTER" && <PhotoFrame x={x} y={y} rW={rW} rH={rH} />}
      {category === "VINYL_LETTERING" && <TextLines x={x} y={y} rW={rW} rH={rH} />}
      {category === "DISPLAY" && <DisplayPoles x={x} y={y} rW={rW} rH={rH} />}
      {category === "BROCHURE" && <BrochureFolds x={x} y={y} rW={rW} rH={rH} />}
      {(category === "FLYER" || category === "POSTCARD") && <ContentLines x={x} y={y} rW={rW} rH={rH} />}
      {category === "BUSINESS_CARD" && <CardLines x={x} y={y} rW={rW} rH={rH} />}

      {/* Hemmed edge indicator for banners */}
      {category === "BANNER" && !hasGrommets && <BannerHem x={x} y={y} rW={rW} rH={rH} />}
    </g>
  );
}

function CoroplastFlutes({ x, y, rW, rH }: Rect) {
  const lines = [0.25, 0.5, 0.75].map((t) => y + rH * t);
  return (
    <g opacity={0.25}>
      {lines.map((ly, i) => (
        <line key={i} x1={x + 4} y1={ly} x2={x + rW - 4} y2={ly}
          stroke="#888" strokeWidth={1} />
      ))}
    </g>
  );
}

function MountingHoles({ x, y, rW, rH }: Rect) {
  const r = 4;
  const inset = 8;
  const corners = [
    { cx: x + inset, cy: y + inset },
    { cx: x + rW - inset, cy: y + inset },
    { cx: x + inset, cy: y + rH - inset },
    { cx: x + rW - inset, cy: y + rH - inset },
  ];
  return (
    <g>
      {corners.map((c, i) => (
        <circle key={i} cx={c.cx} cy={c.cy} r={r}
          fill="white" stroke="#aaa" strokeWidth={1} />
      ))}
    </g>
  );
}

function FoamboardBorder({ x, y, rW, rH }: Rect) {
  return (
    <rect x={x + 4} y={y + 4} width={rW - 8} height={rH - 8}
      fill="none" stroke="#d0d0d0" strokeWidth={1} rx={1} />
  );
}

function PhotoFrame({ x, y, rW, rH }: Rect) {
  const inset = 6;
  return (
    <rect x={x + inset} y={y + inset} width={rW - inset * 2} height={rH - inset * 2}
      fill="none" stroke="#ccc" strokeWidth={0.75} />
  );
}

function TextLines({ x, y, rW, rH }: Rect) {
  const lines = [0.35, 0.5, 0.65];
  const lineW = rW * 0.6;
  return (
    <g opacity={0.35}>
      {lines.map((t, i) => (
        <line key={i}
          x1={x + (rW - lineW) / 2} y1={y + rH * t}
          x2={x + (rW + lineW) / 2} y2={y + rH * t}
          stroke="#555" strokeWidth={3} strokeLinecap="round"
        />
      ))}
    </g>
  );
}

function DisplayPoles({ x, y, rW, rH }: Rect) {
  const cx = x + rW / 2;
  return (
    <g opacity={0.4}>
      <line x1={cx} y1={y} x2={cx} y2={y - 14}
        stroke="#888" strokeWidth={2} />
      <line x1={x + rW * 0.2} y1={y - 12} x2={x + rW * 0.8} y2={y - 12}
        stroke="#888" strokeWidth={2} />
      <line x1={cx} y1={y + rH} x2={cx} y2={y + rH + 14}
        stroke="#888" strokeWidth={2} />
    </g>
  );
}

function BrochureFolds({ x, y, rW, rH }: Rect) {
  return (
    <g opacity={0.3}>
      <line x1={x + rW / 3} y1={y + 4} x2={x + rW / 3} y2={y + rH - 4}
        stroke="#888" strokeWidth={1} strokeDasharray="4 2" />
      <line x1={x + (rW * 2) / 3} y1={y + 4} x2={x + (rW * 2) / 3} y2={y + rH - 4}
        stroke="#888" strokeWidth={1} strokeDasharray="4 2" />
    </g>
  );
}

function ContentLines({ x, y, rW, rH }: Rect) {
  const lines = [0.25, 0.4, 0.55, 0.7];
  return (
    <g opacity={0.2}>
      {lines.map((t, i) => {
        const lineW = i === 0 ? rW * 0.5 : rW * 0.7;
        return (
          <line key={i}
            x1={x + (rW - lineW) / 2} y1={y + rH * t}
            x2={x + (rW + lineW) / 2} y2={y + rH * t}
            stroke="#333" strokeWidth={2.5} strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}

function CardLines({ x, y, rW, rH }: Rect) {
  return (
    <g opacity={0.2}>
      <line x1={x + rW * 0.15} y1={y + rH * 0.38}
        x2={x + rW * 0.85} y2={y + rH * 0.38}
        stroke="#333" strokeWidth={3} strokeLinecap="round" />
      <line x1={x + rW * 0.15} y1={y + rH * 0.58}
        x2={x + rW * 0.6} y2={y + rH * 0.58}
        stroke="#333" strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function BannerHem({ x, y, rW, rH }: Rect) {
  return (
    <g opacity={0.25}>
      <rect x={x} y={y} width={rW} height={6} fill="#ccc" />
      <rect x={x} y={y + rH - 6} width={rW} height={6} fill="#ccc" />
    </g>
  );
}

function GrommetOverlay({
  x, y, rW, rH, widthFt, heightFt,
}: Rect & { widthFt: number; heightFt: number }) {
  const pts = grommets(x, y, rW, rH, widthFt, heightFt);
  return (
    <g>
      {pts.map((pt, i) => (
        <circle key={i} cx={pt.cx} cy={pt.cy} r={4}
          fill="white" stroke="var(--brand)" strokeWidth={1.5} />
      ))}
    </g>
  );
}

function HStakeOverlay({ x, y, rW, rH }: Rect) {
  const stakeX = x + rW / 2;
  const baseY = y + rH;
  const stakeH = 22;
  const crossbarW = 16;

  return (
    <g stroke="#666" strokeWidth={2}>
      {/* Left leg */}
      <line x1={stakeX - 6} y1={baseY} x2={stakeX - 6} y2={baseY + stakeH} />
      {/* Right leg */}
      <line x1={stakeX + 6} y1={baseY} x2={stakeX + 6} y2={baseY + stakeH} />
      {/* Crossbar */}
      <line
        x1={stakeX - crossbarW / 2} y1={baseY + stakeH * 0.45}
        x2={stakeX + crossbarW / 2} y2={baseY + stakeH * 0.45}
      />
    </g>
  );
}

function DimensionLabels({
  x, y, rW, rH, widthFt, heightFt,
}: Rect & { widthFt: number; heightFt: number }) {
  const fmt = (n: number) => (n % 1 === 0 ? `${n}` : n.toFixed(2));
  const fontSize = 11;
  const arrowColor = "#999";

  return (
    <g fill={arrowColor} fontSize={fontSize} fontFamily="system-ui,sans-serif">
      {/* Width label below */}
      <text
        x={x + rW / 2} y={y + rH + 22}
        textAnchor="middle" fill="#777" fontSize={fontSize}
      >
        {fmt(widthFt)} ft
      </text>
      {/* Width arrow lines */}
      <line x1={x + 2} y1={y + rH + 16} x2={x + rW / 2 - 22} y2={y + rH + 16}
        stroke={arrowColor} strokeWidth={0.75} />
      <line x1={x + rW / 2 + 22} y1={y + rH + 16} x2={x + rW - 2} y2={y + rH + 16}
        stroke={arrowColor} strokeWidth={0.75} />

      {/* Height label left (rotated) */}
      <text
        x={x - 16} y={y + rH / 2}
        textAnchor="middle" fill="#777" fontSize={fontSize}
        transform={`rotate(-90, ${x - 16}, ${y + rH / 2})`}
      >
        {fmt(heightFt)} ft
      </text>
    </g>
  );
}

function QtyBadge({ x, y, qty }: { x: number; y: number; qty: number }) {
  const label = `×${qty.toLocaleString()}`;
  return (
    <g>
      <rect x={x - 36} y={y} width={36} height={18} rx={9}
        fill="var(--brand)" opacity={0.9} />
      <text x={x - 18} y={y + 12.5}
        textAnchor="middle" fill="white"
        fontSize={10} fontWeight="600" fontFamily="system-ui,sans-serif"
      >
        {label}
      </text>
    </g>
  );
}

// ─── Shared type ──────────────────────────────────────────────────────────────

interface Rect {
  x: number; y: number; rW: number; rH: number;
}
