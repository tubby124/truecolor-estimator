#!/usr/bin/env node
/** Archive business website assets. No publishing, rights grant, or image changes. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import sharp from 'sharp';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const value = name => { const i = args.indexOf(name); return i < 0 ? null : args[i + 1]; };
const output = value('--output');
if (!output || !path.isAbsolute(output)) throw new Error('Choose an absolute private output directory outside Git');
// Resolve existing ancestors too: a not-yet-created child of a symlink is unsafe.
let ancestor = path.resolve(output), suffix = [];
while (true) { try { ancestor = await fs.realpath(ancestor); break; } catch (err) { if (err.code !== 'ENOENT') throw err; suffix.unshift(path.basename(ancestor)); const parent = path.dirname(ancestor); if (parent === ancestor) throw err; ancestor = parent; } }
const resolvedOutput = path.join(ancestor, ...suffix);
try { execFileSync('git', ['-C', ancestor, 'rev-parse', '--show-toplevel'], {stdio:'pipe'}); throw new Error('Output must be outside every Git repository'); } catch (err) { if (!err.status) throw err; }
if (resolvedOutput === root || resolvedOutput.startsWith(root + path.sep)) throw new Error('Choose a private directory outside Git');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const source = await fs.readFile(path.join(root, 'src/lib/data/gallery-projects.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { GALLERY_PROJECTS } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const projects = new Map(GALLERY_PROJECTS.map(p => [p.src, p]));
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const paths = execFileSync('git', ['ls-files', 'public/images'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(p => /\.(webp|png|jpe?g)$/i.test(p));
await fs.mkdir(path.join(output, 'originals'), { recursive: true, mode: 0o700 });
const collectedAt = new Date().toISOString();
let previous = {assets:[]};
try { previous = JSON.parse(await fs.readFile(path.join(output,'catalogs/website-v1.json'),'utf8')); if (previous.businessId !== 'truecolor' || previous.schemaVersion !== 1 || !Array.isArray(previous.assets)) throw new Error('Invalid previous catalog'); } catch (err) { if (err.code !== 'ENOENT') throw err; }
const assets = [], failures = [];
let cursor = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < paths.length) {
    const file = paths[cursor++];
    const src = '/' + file.slice('public/'.length);
    const project = projects.get(src);
    const sourceUrl = 'https://truecolorprinting.ca' + src;
    try {
      // Held photos are preserved from the repository only, never fetched/published.
      const local = await fs.readFile(path.join(root, file));
      let bytes = local, acquisition = 'repository-source';
      if (project?.published !== false && project?.rightsStatus !== 'hold') {
        const res = await fetch(sourceUrl, { redirect: 'error', signal: AbortSignal.timeout(20000) });
        if (!res.ok || !res.headers.get('content-type')?.startsWith('image/')) throw new Error(`HTTP ${res.status}`);
        if (Number(res.headers.get('content-length') || 0) > 30 * 1024 * 1024) throw new Error('Image too large');
        bytes = Buffer.from(await res.arrayBuffer()); acquisition = 'website-download';
      }
      if (bytes.length > 30 * 1024 * 1024) throw new Error('Image too large');
      const meta = await sharp(bytes, { limitInputPixels: 40_000_000 }).metadata();
      if (!meta.width || !meta.height) throw new Error('Invalid dimensions');
      const sha256 = hash(bytes), ext = path.extname(file).toLowerCase();
      const storagePath = `originals/${sha256}${ext}`;
      const destination = path.join(output, storagePath);
      try { await fs.writeFile(destination, bytes, { flag: 'wx', mode: 0o600 }); } catch (err) { if (err.code !== 'EEXIST' || hash(await fs.readFile(destination)) !== sha256) throw err; }
      const filename = path.basename(file);
      assets.push({ id: `web-${hash(Buffer.from(src)).slice(0,20)}`, sha256, storagePath, filename,
        title: project?.title || filename.replace(/\.[^.]+$/, '').replaceAll('-', ' '),
        description: project?.caption || 'Website asset; subject and suitability need review.',
        alt: project?.alt || 'True Color website image; description needs review',
        category: project?.category || (src.includes('/products/') ? 'Product illustrations' : 'Website assets'),
        kind: project?.kind || 'unclassified', sourceUrl, sourcePage: 'https://truecolorprinting.ca' + (project ? '/gallery' : '/'),
        sourceType: project ? 'website-gallery' : 'website-other', width: meta.width, height: meta.height, bytes: bytes.length,
        rightsStatus: project?.rightsStatus === 'hold' ? 'hold' : 'review-required', privacyStatus: project?.privacyStatus || 'review-required',
        sourcePublished: acquisition === 'website-download', tags: [project?.productSlug, project?.category, project?.kind].filter(Boolean),
        acquisition, sourceRevision: revision, repositoryBytesMatch: hash(local) === sha256,
        sourceRightsStatus: project?.rightsStatus || 'unspecified',
        reviewNote: 'Saved for owner-requested library review. Collection does not grant social, ads, or customer artwork rights. Preserve originals.' });
    } catch (err) { failures.push({ file, reason: err.message }); }
  }
}));
assets.sort((a,b) => a.id.localeCompare(b.id));
const merged = new Map(previous.assets.map(a=>[a.id,a]));
for (const asset of assets) { const old=merged.get(asset.id); merged.set(asset.id,{...asset,rightsStatus:old?.rightsStatus==='hold'?'hold':asset.rightsStatus}); }
const catalog = { schemaVersion: 1, businessId: 'truecolor', collectedAt, sourceRevision: revision, assets: [...merged.values()].sort((a,b)=>a.id.localeCompare(b.id)) };
await fs.mkdir(path.join(output, 'catalogs'), { recursive: true, mode: 0o700 });
const catalogPath=path.join(output,'catalogs/website-v1.json');
try { const old=await fs.readFile(catalogPath); await fs.mkdir(path.join(output,'catalogs/snapshots'),{recursive:true,mode:0o700}); await fs.writeFile(path.join(output,'catalogs/snapshots',hash(old)+'.json'),old,{mode:0o600}); } catch(err) { if(err.code!=='ENOENT')throw err; }
await fs.writeFile(catalogPath+'.tmp',JSON.stringify(catalog,null,2)+'\n',{mode:0o600});
await fs.rename(catalogPath+'.tmp',catalogPath);
await fs.writeFile(path.join(output, 'collection-receipt.json'), JSON.stringify({ collectedAt, assets: assets.length, uniqueFiles: new Set(assets.map(a=>a.sha256)).size, failures }, null, 2) + '\n', { mode: 0o600 });
console.log(JSON.stringify({ collectedAt, assets: assets.length, uniqueFiles: new Set(assets.map(a=>a.sha256)).size, bytes: assets.reduce((n,a)=>n+a.bytes,0), held: assets.filter(a=>a.rightsStatus==='hold').length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
