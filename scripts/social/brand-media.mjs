#!/usr/bin/env node
// Preparation only: never called by the publisher. Review these final bytes before approval.
import sharp from 'sharp';
import { readFile, open, mkdir, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function writePackage(files) {
  // Exclusive writes preserve versioned originals and any previous prepared outputs.
  const created = [];
  try {
    for (const [path, bytes] of files) {
      const handle = await open(path, 'wx');
      created.push(path);
      try { await handle.writeFile(bytes); } finally { await handle.close(); }
    }
  } catch (error) {
    // Only paths exclusively created by this invocation belong to its rollback.
    const cleanup = await Promise.allSettled(created.map((path) => unlink(path)));
    const failures = cleanup.filter((result) => result.status === 'rejected').map((result) => result.reason);
    if (failures.length) throw new AggregateError([error, ...failures], 'Brand package failed and cleanup was incomplete');
    throw error;
  }
}

export async function brandMedia({ source, output, logo, corner, widthRatio = 0.20, inset = 0.035, backing = 'transparent' }) {
  if (!['transparent', 'white'].includes(backing)) throw new Error('backing must be transparent or white');
  if (!logo) throw new Error('Explicit transparent logo path is required');
  if (!['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(corner)) throw new Error('Explicit corner is required');
  if (!Number.isFinite(widthRatio) || widthRatio < 0.1 || widthRatio > 0.3) throw new Error('widthRatio must be between 0.1 and 0.3');
  if (!Number.isFinite(inset) || inset < 0 || inset > 0.1) throw new Error('inset must be between 0 and 0.1');
  if (!source || !output || !/\.jpe?g$/i.test(output)) throw new Error('Provide source and a new .jpg output path');
  const paths = { source: resolve(source), logo: resolve(logo), output: resolve(output) };
  const pngPath = paths.output.slice(0, -extname(paths.output).length) + '.png';
  const manifestPath = paths.output + '.json';
  if ([paths.output, pngPath, manifestPath].some((p) => [paths.source, paths.logo].includes(p))) {
    throw new Error('Output paths must differ from source and logo');
  }
  const [sourceBytes, logoBytes] = await Promise.all([readFile(paths.source), readFile(paths.logo)]);
  const logoStats = await sharp(logoBytes).stats();
  const logoMeta = await sharp(logoBytes).metadata();
  if (!logoMeta.hasAlpha || logoStats.isOpaque) throw new Error('Logo must have transparent pixels');
  const normalized = await sharp(sourceBytes).rotate().flatten({ background: '#ffffff' }).png().toBuffer();
  const meta = await sharp(normalized).metadata();
  const artwork = await sharp(normalized).resize({ width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true }).png().toBuffer({ resolveWithObject: true });
  const { width, height } = artwork.info;
  const marginX = Math.round(width * inset);
  const marginY = Math.round(height * inset);
  const brand = await sharp(logoBytes).rotate().resize({ width: Math.max(1, Math.round(width * widthRatio)) }).png().toBuffer({ resolveWithObject: true });
  const padding = backing === 'white' ? Math.max(2, Math.round(brand.info.width * 0.08)) : 0;
  const badgeWidth = brand.info.width + 2 * padding, badgeHeight = brand.info.height + 2 * padding;
  if (badgeWidth + 2 * marginX > width || badgeHeight + 2 * marginY > height) throw new Error('Logo does not fit within source; choose a smaller widthRatio');
  const badgeLeft = corner.endsWith('right') ? width - marginX - badgeWidth : marginX;
  const badgeTop = corner.startsWith('bottom') ? height - marginY - badgeHeight : marginY;
  let overlay = brand.data;
  if (backing === 'white') {
    const backdrop = Buffer.from(`<svg width="${badgeWidth}" height="${badgeHeight}"><rect width="${badgeWidth}" height="${badgeHeight}" rx="${Math.max(2,Math.round(padding*.6))}" fill="#fff"/></svg>`);
    overlay = await sharp(backdrop).composite([{input:brand.data,left:padding,top:padding}]).png().toBuffer();
  }
  const logoLeft = badgeLeft + padding, logoTop = badgeTop + padding;
  const png = await sharp(artwork.data).composite([{ input: overlay, left: badgeLeft, top: badgeTop }]).png().toBuffer();
  const jpeg = await sharp(png).jpeg({ quality: 90, chromaSubsampling: '4:4:4' }).toBuffer();
  const manifest = {
    method: backing === 'white' ? 'white-backed-corner-overlay' : 'transparent-corner-overlay', version: backing === 'white' ? 3 : 2, approvalStage: 'prepared-for-review',
    source: { sha256: sha256(sourceBytes), width: meta.width, height: meta.height },
    logo: { sha256: sha256(logoBytes) },
    output: { sha256: sha256(jpeg), format: 'jpeg', quality: 90, width, height },
    lossless: { sha256: sha256(png), format: 'png' },
    layout: { corner, widthRatio, inset, ...(backing === 'white' ? {badge:{left:badgeLeft,top:badgeTop,width:badgeWidth,height:badgeHeight,backing,padding}} : {}), artwork: { left: 0, top: 0, width, height }, logo: { left: logoLeft, top: logoTop, width: brand.info.width, height: brand.info.height } },
  };
  await mkdir(dirname(paths.output), { recursive: true });
  await writePackage([[pngPath, png], [paths.output, jpeg], [manifestPath, JSON.stringify(manifest, null, 2) + '\n']]);
  return { ...manifest, files: { output: paths.output, lossless: pngPath, manifest: manifestPath } };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [source, output, logo, corner, ratio, backing, ...extra] = process.argv.slice(2);
  if (extra.length) throw new Error('Usage: node scripts/social/brand-media.mjs SOURCE OUTPUT.jpg LOGO CORNER [WIDTH_RATIO] [transparent|white]');
  brandMedia({ source, output, logo, corner, widthRatio: ratio === undefined ? undefined : Number(ratio), backing }).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
