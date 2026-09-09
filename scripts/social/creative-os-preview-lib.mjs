/** Local text-brief review only. Does not generate images or contact services. */
import { readFileSync, existsSync, realpathSync, statSync } from 'node:fs';
import { mkdir, writeFile, unlink, rmdir } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { compileFunction } from 'node:vm';
import ts from 'typescript';

export const MAX_PACKAGE_BYTES = 1024 * 1024;
const within = (root, candidate) => candidate === root || candidate.startsWith(root + path.sep);

/** Load only the fixed, trusted local TS source graph. JSON input never names modules. */
export function createOfflineLoader(repository) {
  const root = realpathSync(repository);
  const sourceRoot = path.join(root, 'src', 'lib');
  const cache = new Map();
  function load(file) {
    let candidate = path.resolve(file);
    if (!path.extname(candidate)) candidate = existsSync(candidate + '.ts') ? candidate + '.ts' : path.join(candidate, 'index.ts');
    candidate = realpathSync(candidate);
    if (!within(sourceRoot, candidate) || !candidate.endsWith('.ts')) throw new Error('Offline loader accepts trusted src/lib TypeScript only.');
    if (cache.has(candidate)) return cache.get(candidate).exports;
    const loadedModule = { exports: {} };
    cache.set(candidate, loadedModule);
    const nativeRequire = createRequire(candidate);
    const sourceRequire = (specifier) => {
      if (specifier.startsWith('@/')) return load(path.join(root, 'src', specifier.slice(2)));
      if (specifier.startsWith('.')) {
        const local = path.resolve(path.dirname(candidate), specifier);
        if (specifier.endsWith('.json')) return nativeRequire(specifier);
        return load(local);
      }
      return nativeRequire(specifier);
    };
    const compiled = ts.transpileModule(readFileSync(candidate, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
      fileName: candidate,
    }).outputText;
    try {
      compileFunction(compiled, ['exports', 'require', 'module', '__filename', '__dirname'], { filename: candidate })(loadedModule.exports, sourceRequire, loadedModule, candidate, path.dirname(candidate));
      return loadedModule.exports;
    } catch (error) {
      cache.delete(candidate);
      throw error;
    }
  }
  return load;
}

/** Worktree-aware, read-only Git label. No shell, network, credentials or environment files. */
export function readSourceRevision(repository) {
  const dotGit = path.join(repository, '.git');
  let gitDir = dotGit;
  if (statSync(dotGit).isFile()) {
    const marker = readFileSync(dotGit, 'utf8').trim();
    if (!marker.startsWith('gitdir: ')) throw new Error('Cannot resolve repository metadata.');
    gitDir = path.resolve(repository, marker.slice(8));
  }
  const head = readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
  if (/^[a-f0-9]{40}$/.test(head)) return head;
  if (!/^ref: refs\/[a-zA-Z0-9._/-]+$/.test(head) || head.includes('..')) throw new Error('Cannot resolve source revision.');
  const ref = head.slice(5);
  const common = existsSync(path.join(gitDir, 'commondir')) ? path.resolve(gitDir, readFileSync(path.join(gitDir, 'commondir'), 'utf8').trim()) : gitDir;
  for (const dir of [gitDir, common]) {
    const loose = path.join(dir, ref);
    if (existsSync(loose)) {
      const value = readFileSync(loose, 'utf8').trim();
      if (/^[a-f0-9]{40}$/.test(value)) return value;
    }
  }
  const packed = path.join(common, 'packed-refs');
  if (existsSync(packed)) {
    const line = readFileSync(packed, 'utf8').split('\n').find(line => line.endsWith(' ' + ref));
    if (line && /^[a-f0-9]{40} /.test(line)) return line.slice(0, 40);
  }
  throw new Error('Cannot resolve source revision.');
}

export function readExampleInputs(inputDir) {
  const filenames = ['truecolor-kit.json', 'sticker-recipes.json', 'fixture-proofs.json', 'offer-inputs.json'];
  let size = 0;
  const values = filenames.map(name => {
    const file = path.join(inputDir, name);
    if (statSync(file).size > MAX_PACKAGE_BYTES) throw new Error('Input exceeds one MiB.');
    const bytes = readFileSync(file);
    size += bytes.length;
    if (size > MAX_PACKAGE_BYTES) throw new Error('Combined input exceeds one MiB.');
    return JSON.parse(bytes.toString('utf8'));
  });
  const [kit, recipes, proofs, requests] = values;
  if (!Array.isArray(requests) || requests.length < 1 || requests.length > 31) throw new Error('Use one to thirty-one brief requests. This is not publishing capacity.');
  return { bundle: { schemaVersion: 2, kind: 'creative_os_bundle', kit, recipes, proofs }, requests };
}

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const list = values => `<ul>${(values ?? []).map(value => `<li>${escapeHtml(value)}</li>`).join('')}</ul>`;
const modeLabels = { exact_configuration: 'A specific priced offer', configurator: 'Choosing your own options', design_help: 'Help with the artwork', education: 'Product education' };

export function renderPreview(briefs, report, recipes = [], identity = {}) {
  const brandName = identity.name ?? briefs[0]?.brandKey ?? 'Creative kit';
  const cards = briefs.map((brief, i) => `<article class="card">
    <div class="number">EXAMPLE ${String(i + 1).padStart(2, '0')} <span>${escapeHtml(modeLabels[brief.facts.mode] ?? 'Draft brief')}</span></div>
    <h2>${escapeHtml(recipes.find(recipe => recipe.id === brief.recipeRef.id)?.purchaseQuestion ?? brief.headlineDirection)}</h2>
    <p class="label">What the post must communicate</p>
    <section class="words"><h3>${escapeHtml(brief.headlineDirection)}</h3>${list(brief.requiredVisibleText)}</section>
    <p class="label">What the artist should make</p>${list(brief.layoutInstructions)}
    <p class="label">The customer’s next step</p>${list([brief.facts.cta.instruction, ...Object.values(brief.contactPanel)])}
    <p class="note">${escapeHtml(brief.proofRefs.map(proof => proof.disclosure).join(' '))}</p>
    <details><summary>Facts, source checks and boundaries</summary><pre>${escapeHtml(JSON.stringify(brief, null, 2))}</pre></details>
    <a class="download" href="${escapeHtml(brief.id)}.json" download>Download this brief →</a>
  </article>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
  <title>${escapeHtml(brandName)} — Creative brief review</title><style>
  *{box-sizing:border-box}body{margin:0;background:#f4f2ec;color:#162127;font-family:Arial,Helvetica,sans-serif;line-height:1.55}main{max-width:1500px;margin:auto;padding:48px 32px 72px}.eyebrow{font-size:12px;letter-spacing:.14em;font-weight:700;color:#38535b}h1{font-size:clamp(34px,4vw,58px);line-height:1.06;max-width:900px;letter-spacing:-.04em;margin:18px 0}.intro{font-size:19px;max-width:760px;color:#405259}.status{display:inline-block;background:#deece7;color:#214c3e;border-radius:24px;padding:8px 15px;font-weight:700;font-size:13px}.explain{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin:34px 0 42px;border-block:1px solid #c9d0cd;padding:22px 0}.explain p{margin:5px 0;color:#405259}.explain strong{font-size:16px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.card{background:#fffefa;border:1px solid #d6dad5;border-radius:18px;padding:25px;min-width:0}.number{font-size:11px;letter-spacing:.1em;color:#4b656d;font-weight:700}.number span{display:block;margin-top:7px;font-weight:400;letter-spacing:0}h2{font-size:25px;line-height:1.25;margin:18px 0 28px}.label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:27px 0 10px;color:#4b656d}.words{background:#073f9b;color:#fffaf0;padding:22px;border-radius:12px;min-height:240px}.card:nth-child(2) .words{background:#ece8dc;color:#253b40}.card:nth-child(3) .words{background:#202c35;color:#fffaf0}h3{font-size:28px;line-height:1.15;margin:0 0 20px;letter-spacing:-.025em}ul{padding-left:19px;margin:0}li{margin:9px 0;overflow-wrap:anywhere}.words ul{list-style:none;padding:0}.words li{font-size:15px}.note{font-size:13px;color:#566970;border-top:1px solid #d6dad5;padding-top:18px;margin-top:28px}details{font-size:13px;margin-top:20px}summary{cursor:pointer;font-weight:700}pre{font-size:11px;white-space:pre-wrap;overflow-wrap:anywhere;background:#edf1ee;padding:12px;border-radius:8px}.download{display:inline-block;margin-top:24px;color:#06458e;text-decoration:none;font-weight:700;font-size:14px}.footer{max-width:900px;margin-top:38px}.footer h2{margin-bottom:12px}.footer p{color:#405259}.fine{font-size:12px;color:#53636a}@media(max-width:1000px){.grid{grid-template-columns:1fr}.words{min-height:0}.explain{gap:18px}main{padding:30px 20px}}@media(max-width:560px){.explain{grid-template-columns:1fr;gap:15px}.card{padding:22px}main{padding-inline:16px}}
  </style></head><body><main><div class="eyebrow">${escapeHtml(brandName)} / CREATIVE BRIEF REVIEW</div>
  <h1>${briefs.length} draft ${briefs.length === 1 ? 'brief' : 'briefs'} to discuss.</h1>
  <p class="intro">This tool turns the saved brand rules and product facts into clear instructions for making a post. These are text briefs, not finished ads.</p>
  <div class="status">Private test · No images generated · Nothing scheduled</div>
  <section class="explain"><div><strong>The kit defines the brand.</strong><p>Identity, voice and lasting constraints; each recipe supplies its composition.</p></div><div><strong>Facts come from the adapter.</strong><p>An exact offer binds its validated configuration. Educational briefs can work without a price.</p></div><div><strong>You guide the creative.</strong><p>Discuss your samples and visual preferences before choosing a direction or planning new artwork.</p></div></section>
  <section class="grid">${cards}</section>
  <section class="footer"><h2>What to discuss</h2><p>Compare the wording and directions with your own samples. The planner and visual choices will be designed with you in that discussion.</p><p class="fine">Proof provenance and limitations are shown with each brief. This page does not authenticate rights, approve, import, post, or change business settings. Local fact verification does not prove deployed facts.</p><details><summary>Build receipt</summary><pre>${escapeHtml(JSON.stringify(report, null, 2))}</pre></details></section></main></body></html>`;
}

/** Outputs must be new and outside every detected Git checkout, including symlink aliases. */
export async function writeReviewPackage(output, files) {
  if (!path.isAbsolute(output)) throw new Error('Use an absolute private output directory.');
  const destination = path.resolve(output);
  const parent = realpathSync(path.dirname(destination));
  let ancestor = parent;
  while (true) {
    if (existsSync(path.join(ancestor, '.git'))) throw new Error('Populated reviews must be outside Git repositories.');
    if (path.dirname(ancestor) === ancestor) break;
    ancestor = path.dirname(ancestor);
  }
  const target = path.join(parent, path.basename(destination));
  for (const [name, contents] of Object.entries(files)) {
    if (!/^[a-z0-9][a-z0-9._-]*\.(json|html)$/.test(name) || name.includes('..') || Buffer.byteLength(contents) > 4 * MAX_PACKAGE_BYTES) throw new Error('Invalid output file.');
  }
  await mkdir(target, { mode: 0o700 });
  const created = [];
  try {
    for (const [name, contents] of Object.entries(files)) {
      const filename = path.join(target, name);
      await writeFile(filename, contents, { flag: 'wx', mode: 0o600 });
      created.push(filename);
    }
  } catch (error) {
    const cleanup = await Promise.allSettled(created.map(file => unlink(file)));
    const errors = cleanup.filter(result => result.status === 'rejected').map(result => result.reason);
    if (!errors.length) { try { await rmdir(target); } catch (cleanupError) { errors.push(cleanupError); } }
    if (errors.length) throw new AggregateError([error, ...errors], 'Review write failed; cleanup was incomplete.');
    throw error;
  }
  return target;
}
