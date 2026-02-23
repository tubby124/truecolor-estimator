/**
 * Product spec diagram SVG generator — pure string output, safe for both
 * server-side (email/PDF via @resvg/resvg-js) and client-side (print preview).
 *
 * Extracted from quoteTemplate.ts so it can be imported without pulling in
 * the full email template and its server-only dependencies.
 */

export interface DiagramJobDetails {
  category: string;
  categoryLabel: string;
  widthIn?: number;
  heightIn?: number;
  qty: number;
  sides?: 1 | 2;
  materialName?: string;
  isRush: boolean;
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Builds the raw <svg>...</svg> XML string for the product spec diagram.
 * Mirrors ProductProof.tsx layout — dimensions labelled, material badge, rush badge.
 */
export function buildSpecDiagramSvg(jobDetails: DiagramJobDetails): string {
  const VB_W = 400, VB_H = 220;
  const MAX_W = 280, MAX_H = 140;
  const CX = VB_W / 2, CY = VB_H / 2;

  const SQFT_CATS = ["SIGN","BANNER","RIGID","FOAMBOARD","MAGNET","DECAL","VINYL_LETTERING","PHOTO_POSTER","DISPLAY"];
  const PRINT_ASPECT: Record<string, number> = {
    FLYER: 8.5 / 11, BUSINESS_CARD: 3.5 / 2, BROCHURE: 11 / 8.5, POSTCARD: 6 / 4, STICKER: 1,
  };

  const isSqft = SQFT_CATS.includes(jobDetails.category);
  const wIn = jobDetails.widthIn ?? 0;
  const hIn = jobDetails.heightIn ?? 0;
  const wFt = wIn / 12;
  const hFt = hIn / 12;

  const aspect = isSqft && wIn > 0 && hIn > 0
    ? wIn / hIn
    : (PRINT_ASPECT[jobDetails.category] ?? 1);

  let rW: number, rH: number;
  if (aspect > MAX_W / MAX_H) { rW = MAX_W; rH = MAX_W / aspect; }
  else                         { rH = MAX_H; rW = MAX_H * aspect; }
  const x = CX - rW / 2;
  const y = CY - rH / 2;
  const fmt = (n: number) => (n % 1 === 0 ? `${n}` : n.toFixed(2));

  let markers = "";
  const cat = jobDetails.category;
  if (cat === "SIGN") {
    const lines = [0.25, 0.5, 0.75].map(t => y + rH * t);
    markers = `<g opacity="0.25">${lines.map(ly =>
      `<line x1="${x+4}" y1="${ly}" x2="${x+rW-4}" y2="${ly}" stroke="#888" stroke-width="1"/>`
    ).join("")}</g>`;
  } else if (cat === "RIGID") {
    const r = 4, ins = 8;
    const corners = [[x+ins,y+ins],[x+rW-ins,y+ins],[x+ins,y+rH-ins],[x+rW-ins,y+rH-ins]];
    markers = `<g>${corners.map(([cx,cy]) =>
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="#aaa" stroke-width="1"/>`
    ).join("")}</g>`;
  } else if (cat === "BANNER") {
    markers = `<g opacity="0.25"><rect x="${x}" y="${y}" width="${rW}" height="6" fill="#ccc"/><rect x="${x}" y="${y+rH-6}" width="${rW}" height="6" fill="#ccc"/></g>`;
  } else if (cat === "FOAMBOARD") {
    markers = `<rect x="${x+4}" y="${y+4}" width="${rW-8}" height="${rH-8}" fill="none" stroke="#d0d0d0" stroke-width="1" rx="1"/>`;
  } else if (cat === "FLYER" || cat === "POSTCARD") {
    const ls = [0.25,0.4,0.55,0.7];
    markers = `<g opacity="0.2">${ls.map((t,i)=>{const lw=i===0?rW*0.5:rW*0.7;return `<line x1="${x+(rW-lw)/2}" y1="${y+rH*t}" x2="${x+(rW+lw)/2}" y2="${y+rH*t}" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>`}).join("")}</g>`;
  } else if (cat === "BUSINESS_CARD") {
    markers = `<g opacity="0.2"><line x1="${x+rW*0.15}" y1="${y+rH*0.38}" x2="${x+rW*0.85}" y2="${y+rH*0.38}" stroke="#333" stroke-width="3" stroke-linecap="round"/><line x1="${x+rW*0.15}" y1="${y+rH*0.58}" x2="${x+rW*0.6}" y2="${y+rH*0.58}" stroke="#333" stroke-width="2" stroke-linecap="round"/></g>`;
  } else if (cat === "BROCHURE") {
    markers = `<g opacity="0.3"><line x1="${x+rW/3}" y1="${y+4}" x2="${x+rW/3}" y2="${y+rH-4}" stroke="#888" stroke-width="1" stroke-dasharray="4 2"/><line x1="${x+rW*2/3}" y1="${y+4}" x2="${x+rW*2/3}" y2="${y+rH-4}" stroke="#888" stroke-width="1" stroke-dasharray="4 2"/></g>`;
  }

  const isDashed = cat === "DECAL" || cat === "STICKER";
  const rx = cat === "MAGNET" ? 10 : 2;

  const materialBadge = isSqft && jobDetails.materialName
    ? `<text x="${x+6}" y="${y+14}" font-size="8" fill="#9ca3af" font-family="-apple-system,sans-serif">${escHtml(jobDetails.materialName)}</text>`
    : "";

  const rushBadge = jobDetails.isRush
    ? `<g><rect x="${x+rW-52}" y="${y+4}" width="48" height="14" rx="3" fill="#ef4444"/><text x="${x+rW-28}" y="${y+14}" font-size="7" fill="white" text-anchor="middle" font-family="-apple-system,sans-serif" font-weight="600">RUSH</text></g>`
    : "";

  const dimLabels = isSqft && wIn > 0 && hIn > 0
    ? `<text x="${x+rW/2}" y="${y+rH+22}" text-anchor="middle" fill="#777" font-size="11" font-family="system-ui,sans-serif">${fmt(wFt)} ft</text>
       <line x1="${x+2}" y1="${y+rH+16}" x2="${x+rW/2-22}" y2="${y+rH+16}" stroke="#999" stroke-width="0.75"/>
       <line x1="${x+rW/2+22}" y1="${y+rH+16}" x2="${x+rW-2}" y2="${y+rH+16}" stroke="#999" stroke-width="0.75"/>
       <text x="${x-16}" y="${y+rH/2}" text-anchor="middle" fill="#777" font-size="11" font-family="system-ui,sans-serif" transform="rotate(-90,${x-16},${y+rH/2})">${fmt(hFt)} ft</text>`
    : "";

  const qtyBadge = !isSqft && jobDetails.qty > 1
    ? `<g><rect x="${x+rW-36}" y="${y}" width="36" height="18" rx="9" fill="#e52222" opacity="0.9"/><text x="${x+rW-18}" y="${y+12.5}" text-anchor="middle" fill="white" font-size="10" font-weight="600" font-family="system-ui,sans-serif">×${jobDetails.qty.toLocaleString()}</text></g>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB_W} ${VB_H}" width="${VB_W}" height="${VB_H}"
    style="width:100%;max-height:180px;display:block;">
    <rect x="${x}" y="${y}" width="${rW}" height="${rH}" fill="#f5f2ee"
      stroke="${isDashed ? "#e52222" : "#c8bfb6"}" stroke-width="1.5"
      ${isDashed ? 'stroke-dasharray="6 3"' : ""} rx="${rx}" ry="${rx}"/>
    ${markers}
    ${materialBadge}
    ${rushBadge}
    ${dimLabels}
    ${qtyBadge}
  </svg>`;
}
