#!/usr/bin/env node
/** Offline draft compiler. No image generation, scheduling or production access. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';
import { createOfflineLoader, readExampleInputs, readSourceRevision, renderPreview, writeReviewPackage } from './creative-os-preview-lib.mjs';

const repository = realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'));
const usage = `Usage: node scripts/social/creative-os-preview.mjs --output /absolute/private/new-review --sticker-v2 true|false [--input-dir /absolute/input-folder]

The output parent must already exist, outside Git. A new private directory is
created exclusively; previous reviews are never overwritten. This tool reads
local source and fixture inputs only. It does not load environment files or
contact a service. The explicit pricing flag affects this process only.
`;

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') { process.stdout.write(usage); return; }
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    if (!['--output', '--input-dir', '--sticker-v2'].includes(key) || !args[i + 1] || Object.hasOwn(options, key)) throw new Error('Missing, duplicate or unknown option. Use --help.');
    options[key] = args[i + 1];
  }
  if (!options['--output'] || !['true', 'false'].includes(options['--sticker-v2'])) throw new Error('Provide --output and an explicit --sticker-v2 true|false.');
  if (options['--input-dir'] && !path.isAbsolute(options['--input-dir'])) throw new Error('Input directory must be absolute.');
  process.chdir(repository);
  process.env.NEXT_PUBLIC_USE_STICKER_PRICING_V2 = options['--sticker-v2'];
  const { bundle: rawBundle, requests } = readExampleInputs(options['--input-dir'] ?? path.join(repository, 'docs/social/creative-os/examples'));
  const load = createOfflineLoader(repository);
  const { validateBundle, digest } = load(path.join(repository, 'src/lib/creative-os/contracts.ts'));
  const { compileBrief } = load(path.join(repository, 'src/lib/creative-os/compile.ts'));
  const { createTrueColorFactsAdapter } = load(path.join(repository, 'src/lib/creative-os/truecolor-facts.ts'));
  const bundle = validateBundle(rawBundle);
  const sourceRevision = readSourceRevision(repository);
  const checkedAt = new Date().toISOString();
  const adapter = createTrueColorFactsAdapter({ sourceRevision, now: () => checkedAt });
  // Compile every request before writing anything. One invalid brief holds the package.
  const briefs = requests.map(request => compileBrief(request, bundle, adapter));
  const ids = briefs.map(brief => brief.id);
  if (new Set(ids).size !== ids.length || ids.some(id => ['index', 'report', 'briefs'].includes(id) || id.includes('..'))) throw new Error('Brief IDs must be unique and cannot use reserved output names.');
  const report = {
    schemaVersion: 1, kind: 'creative_os_local_review', status: 'draft',
    createdAt: checkedAt, sourceRevision, sourceRevisionScope: 'Git HEAD label; actual local fact source digest is recorded in each brief, including uncommitted source.',
    inputBundleDigest: digest(bundle), requestSetDigest: digest(requests),
    briefCount: briefs.length, usageScope: briefs.some(brief => brief.usageScope === 'fixture_only') ? 'fixture_only' : 'production_candidate',
    runtimeFlags: { NEXT_PUBLIC_USE_STICKER_PRICING_V2: options['--sticker-v2'] === 'true' },
    productionRuntimeRefreshed: false, imagesGenerated: 0, publishingActions: 0,
    limitations: ['Text instructions only; visual quality and owner review are still pending.', 'Synthetic input proof cannot establish real artwork rights.', 'This output is not a monthly importer or publishing file.'],
  };
  const files = Object.fromEntries(briefs.map(brief => [brief.id + '.json', JSON.stringify(brief, null, 2) + '\n']));
  files['briefs.json'] = JSON.stringify({ kind: 'creative_os_brief_collection', schemaVersion: 1, briefs }, null, 2) + '\n';
  files['report.json'] = JSON.stringify(report, null, 2) + '\n';
  files['index.html'] = renderPreview(briefs, report, bundle.recipes);
  const output = await writeReviewPackage(options['--output'], files);
  process.stdout.write(JSON.stringify({ status: 'draft_review_created', output, briefCount: briefs.length, usageScope: report.usageScope, productionRuntimeRefreshed: false }) + '\n');
}

main().catch(error => {
  // Return an actionable local error without dumping input content or environment.
  process.stderr.write(`Creative review blocked: ${error instanceof Error ? error.message : 'Unknown local error'}\n`);
  process.exitCode = 1;
});
