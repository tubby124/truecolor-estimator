"use client";

import type { Category } from "@/lib/data/types";

interface CustomerProofProps {
  category: Category;
  widthIn: number;
  heightIn: number;
  qty: number;
  sides: 1 | 2;
  materialLabel: string;
  addonQtys: Record<string, number>;
}

// ─── Layout constants ──────────────────────────────────────────────────────────
const VB_W = 400;
const VB_H = 220;
const MAX_W = 280;
const MAX_H = 140;
const CX = VB_W / 2;
const CY = VB_H / 2;

const PRINT_ASPECT: Partial<Record<Category, number>> = {
  FLYER: 8.5 / 11,
  BUSINESS_CARD: 3.5 / 2,
  BROCHURE: 11 / 8.5,
  POSTCARD: 6 / 4,
  STICKER: 1,
};

const SQFT_CATEGORIES: Category[] = [
  "SIGN", "BANNER", "RIGID", "FOAMBOARD", "MAGNET",
  "DECAL", "VINYL_LETTERING", "PHOTO_POSTER", "DISPLAY",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function grommets(
  x: number, y: number, rW: number, rH: number,
  widthFt: number, heightFt: number
): { cx: number; cy: number }[] {
  const perimeterFt = 2 * (widthFt + heightFt);
  const count = Math.max(4, Math.ceil(perimeterFt / 2));
  const top = widthFt, right = heightFt, bottom = widthFt, left = heightFt;
  const perimeter = perimeterFt;
  const topCount = Math.max(2, Math.round((top / perimeter) * count));
  const rightCount = Math.max(1, Math.round((right / perimeter) * count));
  const bottomCount = Math.max(2, Math.round((bottom / perimeter) * count));
  const leftCount = Math.max(1, count - topCount - rightCount - bottomCount);
  const pts: { cx: number; cy: number }[] = [];
  for (let i = 0; i < topCount; i++)
    pts.push({ cx: x + (rW * (i + 1)) / (topCount + 1), cy: y });
  for (let i = 0; i < rightCount; i++)
    pts.push({ cx: x + rW, cy: y + (rH * (i + 1)) / (rightCount + 1) });
  for (let i = 0; i < bottomCount; i++)
    pts.push({ cx: x + rW - (rW * (i + 1)) / (bottomCount + 1), cy: y + rH });
  for (let i = 0; i < leftCount; i++)
    pts.push({ cx: x, cy: y + rH - (rH * (i + 1)) / (leftCount + 1) });
  return pts;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CustomerProof({
  category, widthIn, heightIn, qty, sides, materialLabel, addonQtys,
}: CustomerProofProps) {
  const isSqft = SQFT_CATEGORIES.includes(category);
  const hasGrommets = (addonQtys["Grommets"] || 0) > 0;
  const hasHStake = (addonQtys["H-Stakes"] || 0) > 0;

  let aspect: number;
  if (isSqft && widthIn > 0 && heightIn > 0) {
    aspect = widthIn / heightIn;
  } else {
    aspect = PRINT_ASPECT[category] ?? 1;
  }

  const { rW, rH, x, y } = scaleRect(aspect);
  const widthFt = widthIn / 12;
  const heightFt = heightIn / 12;

  const grommetPts = hasGrommets && isSqft && widthIn > 0
    ? grommets(x, y, rW, rH, widthFt, heightFt)
    : [];

  const fmt = (n: number) => (n % 1 === 0 ? `${n}` : n.toFixed(2));

  return (
    <div className="bg-[#f9f8f6] rounded-xl overflow-hidden">
      {/* SVG diagram */}
      <div className="px-4 pt-4 pb-2">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full"
          style={{ maxHeight: 180 }}
          aria-label={`Product preview for ${category}`}
        >
          {/* Product shape */}
          <ProductRect category={category} x={x} y={y} rW={rW} rH={rH} hasGrommets={hasGrommets} />

          {/* Material label — top-left, sqft products */}
          {isSqft && (
            <text
              x={x + 6} y={y + 14}
              fontSize="8" fill="#999"
              fontFamily="-apple-system, sans-serif"
            >
              {materialLabel}
            </text>
          )}

          {/* Qty badge — print products top-right */}
          {!isSqft && qty > 1 && (
            <g>
              <rect x={x + rW - 38} y={y + 4} width={38} height={16} rx={8} fill="#16C2F3" opacity={0.9} />
              <text
                x={x + rW - 19} y={y + 15}
                textAnchor="middle" fill="white"
                fontSize={9} fontWeight="600"
                fontFamily="system-ui,sans-serif"
              >
                ×{qty.toLocaleString()}
              </text>
            </g>
          )}

          {/* Grommet overlay */}
          {hasGrommets && isSqft && widthIn > 0 && (
            <g>
              {grommetPts.map((pt, i) => (
                <circle key={i} cx={pt.cx} cy={pt.cy} r={4}
                  fill="white" stroke="#16C2F3" strokeWidth={1.5} />
              ))}
            </g>
          )}

          {/* H-Stake overlay */}
          {hasHStake && <HStakeOverlay x={x} y={y} rW={rW} rH={rH} />}

          {/* Double-sided edge indicator */}
          {sides === 2 && (
            <line
              x1={x + rW + 4} y1={y + 4}
              x2={x + rW + 4} y2={y + rH - 4}
              stroke="#16C2F3" strokeWidth={2}
              strokeDasharray="4 3" opacity={0.6}
            />
          )}

          {/* Dimension labels — sqft products with known dimensions */}
          {isSqft && widthIn > 0 && heightIn > 0 && (
            <g fill="#aaa" fontSize={11} fontFamily="system-ui,sans-serif">
              {/* Width below */}
              <text x={x + rW / 2} y={y + rH + 22} textAnchor="middle" fill="#888" fontSize={11}>
                {fmt(widthFt)} ft
              </text>
              <line x1={x + 2} y1={y + rH + 16} x2={x + rW / 2 - 22} y2={y + rH + 16}
                stroke="#ccc" strokeWidth={0.75} />
              <line x1={x + rW / 2 + 22} y1={y + rH + 16} x2={x + rW - 2} y2={y + rH + 16}
                stroke="#ccc" strokeWidth={0.75} />
              {/* Height left rotated */}
              <text
                x={x - 16} y={y + rH / 2}
                textAnchor="middle" fill="#888" fontSize={11}
                transform={`rotate(-90, ${x - 16}, ${y + rH / 2})`}
              >
                {fmt(heightFt)} ft
              </text>
            </g>
          )}

          {/* Grommet count */}
          {hasGrommets && isSqft && widthIn > 0 && grommetPts.length > 0 && (
            <text
              x={VB_W / 2} y={y + rH + 36}
              fontSize="8" fill="#aaa"
              textAnchor="middle"
              fontFamily="-apple-system, sans-serif"
            >
              {grommetPts.length} grommets
            </text>
          )}
        </svg>
      </div>

      {/* Footer summary */}
      <div className="px-4 pb-3">
        <p className="text-xs text-gray-400 text-center">
          {[
            materialLabel,
            isSqft && widthIn > 0 && heightIn > 0 ? `${fmt(widthFt)}×${fmt(heightFt)} ft` : null,
            qty > 1 ? `×${qty.toLocaleString()}` : "1 unit",
            sides === 2 ? "2-sided" : "1-sided",
          ].filter(Boolean).join(" · ")}
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface Rect { x: number; y: number; rW: number; rH: number; }

function ProductRect({ category, x, y, rW, rH, hasGrommets }: Rect & { category: Category; hasGrommets: boolean }) {
  const isRounded = category === "MAGNET";
  const isDashed = category === "DECAL" || category === "STICKER";
  const rx = isRounded ? 10 : 2;
  return (
    <g>
      <rect
        x={x} y={y} width={rW} height={rH}
        fill="#f9f9f9"
        stroke={isDashed ? "#16C2F3" : "#d0d0d0"}
        strokeWidth={1.5}
        strokeDasharray={isDashed ? "6 3" : undefined}
        rx={rx} ry={rx}
      />
      {category === "SIGN" && <CoroplastFlutes x={x} y={y} rW={rW} rH={rH} />}
      {category === "RIGID" && <MountingHoles x={x} y={y} rW={rW} rH={rH} />}
      {category === "DISPLAY" && <DisplayPoles x={x} y={y} rW={rW} rH={rH} />}
      {(category === "FLYER" || category === "POSTCARD") && <ContentLines x={x} y={y} rW={rW} rH={rH} />}
      {category === "BUSINESS_CARD" && <CardLines x={x} y={y} rW={rW} rH={rH} />}
      {category === "BANNER" && !hasGrommets && <BannerHem x={x} y={y} rW={rW} rH={rH} />}
    </g>
  );
}

function CoroplastFlutes({ x, y, rW, rH }: Rect) {
  return (
    <g opacity={0.25}>
      {[0.25, 0.5, 0.75].map((t, i) => (
        <line key={i} x1={x + 4} y1={y + rH * t} x2={x + rW - 4} y2={y + rH * t}
          stroke="#888" strokeWidth={1} />
      ))}
    </g>
  );
}

function MountingHoles({ x, y, rW, rH }: Rect) {
  const corners = [
    { cx: x + 8, cy: y + 8 },
    { cx: x + rW - 8, cy: y + 8 },
    { cx: x + 8, cy: y + rH - 8 },
    { cx: x + rW - 8, cy: y + rH - 8 },
  ];
  return (
    <g>
      {corners.map((c, i) => (
        <circle key={i} cx={c.cx} cy={c.cy} r={4} fill="white" stroke="#aaa" strokeWidth={1} />
      ))}
    </g>
  );
}

function DisplayPoles({ x, y, rW, rH }: Rect) {
  const cx = x + rW / 2;
  return (
    <g opacity={0.4}>
      <line x1={cx} y1={y} x2={cx} y2={y - 14} stroke="#888" strokeWidth={2} />
      <line x1={x + rW * 0.2} y1={y - 12} x2={x + rW * 0.8} y2={y - 12} stroke="#888" strokeWidth={2} />
      <line x1={cx} y1={y + rH} x2={cx} y2={y + rH + 14} stroke="#888" strokeWidth={2} />
    </g>
  );
}

function ContentLines({ x, y, rW, rH }: Rect) {
  return (
    <g opacity={0.2}>
      {[0.25, 0.4, 0.55, 0.7].map((t, i) => {
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

function HStakeOverlay({ x, y, rW, rH }: Rect) {
  const stakeX = x + rW / 2;
  const baseY = y + rH;
  return (
    <g stroke="#666" strokeWidth={2}>
      <line x1={stakeX - 6} y1={baseY} x2={stakeX - 6} y2={baseY + 22} />
      <line x1={stakeX + 6} y1={baseY} x2={stakeX + 6} y2={baseY + 22} />
      <line x1={stakeX - 8} y1={baseY + 10} x2={stakeX + 8} y2={baseY + 10} />
    </g>
  );
}
