#!/usr/bin/env node
/** Import explicitly observed Google owner-gallery URLs. No rights grant or publishing. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import ts from 'typescript';
const parserSource = await fs.readFile(new URL('../../src/lib/social/asset-library.ts', import.meta.url), 'utf8');
const parserJs = ts.transpileModule(parserSource, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { parseLibraryCatalog } = await import('data:text/javascript;base64,' + Buffer.from(parserJs).toString('base64'));
const args = process.argv.slice(2);
const value = key => { const i = args.indexOf(key); return i < 0 ? null : args[i + 1]; };
const sources = value('--sources'), output = value('--output'), receiptPath = value('--receipt');
const check = args.includes('--check'), limit = 30 * 1024 * 1024;
if (![sources, output].every(p => p && path.isAbsolute(p)) || (receiptPath && !path.isAbsolute(receiptPath))) throw new Error('Use absolute --sources, --output and optional --receipt paths');
let ancestor = path.resolve(output), suffix = [];
while (true) { try { ancestor = await fs.realpath(ancestor); break; } catch (err) { if (err.code !== 'ENOENT') throw err; suffix.unshift(path.basename(ancestor)); const parent = path.dirname(ancestor); if (parent === ancestor) throw err; ancestor = parent; } }
const directory = path.join(ancestor, ...suffix);
try { execFileSync('git', ['-C', ancestor, 'rev-parse', '--show-toplevel'], { stdio: 'pipe' }); throw new Error('Output must be outside every Git repository'); } catch (err) { if (!err.status) throw err; }
// Reject symlink components inside the output, including existing catalog targets.
async function safe(relative) {
 let current = directory;
 for (const part of relative.split('/')) {
  current = path.join(current, part);
  try { if ((await fs.lstat(current)).isSymbolicLink()) throw new Error('Output symlink rejected'); } catch (err) { if (err.code !== 'ENOENT') throw err; }
 }
 return current;
}
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(await fs.readFile(sources, 'utf8'));
if (manifest.ownerTabObserved !== true || !Array.isArray(manifest.photos) || !manifest.photos.length || manifest.photos.length > 500) throw new Error('Expected 1–500 explicitly observed owner-gallery inputs');
for (const photo of manifest.photos) {
 const u = new URL(photo.url);
 if (u.protocol !== 'https:' || u.hostname !== 'lh3.googleusercontent.com' || u.port || u.username || u.password || u.search || u.hash || !u.pathname.startsWith('/gps-cs-s/') || u.href !== photo.url) throw new Error('Invalid observed image URL');
}
let cache = new Map();
if (receiptPath) { const receipt = JSON.parse(await fs.readFile(receiptPath, 'utf8')); cache = new Map(receipt.photos.map(p => [p.sourceUrl, p])); }
const catalogPath = await safe('catalogs/website-v1.json');
let previous = { schemaVersion: 1, businessId: 'truecolor', assets: [] };
try { previous = JSON.parse(await fs.readFile(catalogPath, 'utf8')); } catch (err) { if (err.code !== 'ENOENT') throw err; }
if (previous.schemaVersion !== 1 || previous.businessId !== 'truecolor' || !Array.isArray(previous.assets)) throw new Error('Invalid existing catalog');
const assets = [], failures = [];
let cursor = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
 while (cursor < manifest.photos.length) {
  const photo = manifest.photos[cursor++];
  try {
   let bytes;
   const cached = cache.get(photo.url);
   if (cached && cached.status === 'downloaded') {
    if (!path.isAbsolute(cached.path) || (await fs.stat(cached.path)).size > limit) throw new Error('Invalid cache file');
    bytes = await fs.readFile(cached.path);
    if (hash(bytes) !== cached.sha256) throw new Error('Cache hash mismatch');
   } else {
    if (check) throw new Error('Check requires a valid cached receipt for every image');
    const res = await fetch(photo.url, { redirect: 'error', signal: AbortSignal.timeout(45000) });
    if (!res.ok || !res.headers.get('content-type')?.startsWith('image/')) throw new Error('Image download failed');
    const chunks = []; let size = 0;
    for await (const chunk of res.body) { size += chunk.length; if (size > limit) throw new Error('Image exceeds 30MB'); chunks.push(chunk); }
    bytes = Buffer.concat(chunks);
   }
   if (bytes.length > limit) throw new Error('Image exceeds 30MB');
   const meta = await sharp(bytes, { limitInputPixels: 40_000_000 }).metadata();
   const ext = { jpeg: 'jpg', png: 'png', webp: 'webp' }[meta.format];
   if (!ext || !meta.width || !meta.height) throw new Error('Unsupported image');
   const sha256 = hash(bytes), storagePath = `originals/${sha256}.${ext}`;
   const destination = await safe(storagePath);
   if (!check) {
    await fs.mkdir(await safe('originals'), { recursive: true, mode: 0o700 });
    try { await fs.writeFile(destination, bytes, { flag: 'wx', mode: 0o600 }); } catch (err) { if (err.code !== 'EEXIST' || hash(await fs.readFile(destination)) !== sha256) throw err; }
   }
   assets.push({ id: 'gbp-' + hash(photo.url.split('=')[0]).slice(0, 20), sha256, storagePath, filename: path.basename(storagePath), title: photo.label || 'Google owner-gallery photo', description: 'Subject and posting suitability need review.', alt: 'True Color photo; description needs review', category: 'Unclassified', kind: 'unclassified', sourceUrl: photo.url, sourcePage: manifest.sourcePage, sourceType: 'google-business-profile', width: meta.width, height: meta.height, bytes: bytes.length, rightsStatus: 'review-required', privacyStatus: 'review-required', sourcePublished: true, tags: [], acquisition: 'observed-owner-gallery-download', reviewNote: 'Owner-gallery observation is provenance only, not permission for social or advertising use. Preserve original bytes.' });
  } catch (err) { failures.push({ label: photo.label, reason: err.message.replace(/https?:\/\/\S+/g, '[URL]') }); }
 }
}));
const merged = new Map(previous.assets.map(a => [a.id, a]));
for (const asset of assets) {
 const old = merged.get(asset.id);
 const changed = old && old.sha256 !== asset.sha256;
 merged.set(asset.id, old ? {
  ...asset, ...old, sha256: asset.sha256, storagePath: asset.storagePath,
  bytes: asset.bytes, width: asset.width, height: asset.height, sourcePublished: true,
  rightsStatus: old.rightsStatus === 'hold' ? 'hold' : 'review-required',
  privacyStatus: changed ? 'review-required' : old.privacyStatus,
 } : asset);
}
const catalog = { ...previous, collectedAt: new Date().toISOString(), assets: [...merged.values()].sort((a, b) => a.id.localeCompare(b.id)) };
// Validate the final merged schema during cache checks as well as imports.
parseLibraryCatalog(catalog);
if (!check && !failures.length) {
 await fs.mkdir(await safe('catalogs/snapshots'), { recursive: true, mode: 0o700 });
 try { const old = await fs.readFile(catalogPath); const snapshot = await safe(`catalogs/snapshots/${hash(old)}.json`); try { await fs.writeFile(snapshot, old, { flag: 'wx', mode: 0o600 }); } catch (err) { if (err.code !== 'EEXIST' || hash(await fs.readFile(snapshot)) !== hash(old)) throw err; } } catch (err) { if (err.code !== 'ENOENT') throw err; }
 const temporary = await safe(`catalogs/import-${randomUUID()}.tmp`);
 await fs.writeFile(temporary, JSON.stringify(catalog, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
 await fs.rename(temporary, catalogPath);
}
console.log(JSON.stringify({ check, inputs: manifest.photos.length, validated: assets.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
