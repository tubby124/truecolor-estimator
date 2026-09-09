import { describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { readExampleInputs, renderPreview, writeReviewPackage } from './creative-os-preview-lib.mjs';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cli = path.join(repository, 'scripts/social/creative-os-preview.mjs');
const run = args => execFileSync(process.execPath, [cli, ...args], { cwd: tmpdir(), env: { PATH: process.env.PATH }, encoding: 'utf8', stdio: 'pipe' });
async function temporary(fn) {
  const root = await mkdtemp(path.join(tmpdir(), 'creative-os-test-'));
  try { await fn(root); } finally { await rm(root, { recursive: true, force: true }); }
}

describe('private offline creative review', () => {
  it('compiles three isolated drafts from actual local facts and refuses overwrite', async () => temporary(async root => {
    const output = path.join(root, 'review');
    const receipt = JSON.parse(run(['--output', output, '--sticker-v2', 'true']));
    expect(receipt).toMatchObject({ status: 'draft_review_created', briefCount: 3, usageScope: 'fixture_only', productionRuntimeRefreshed: false });
    const { briefs } = JSON.parse(await readFile(path.join(output, 'briefs.json'), 'utf8'));
    expect(briefs[0].facts.quote.amountMinor).toBe(2500);
    expect(briefs.slice(1).map(brief => brief.facts.quote)).toEqual([null, null]);
    for (const brief of briefs) {
      expect(brief.kind).not.toBe('truecolor-month-plan');
      expect(brief).not.toHaveProperty('scheduleTime');
      expect(brief).not.toHaveProperty('channels');
    }
    const before = await readFile(path.join(output, 'index.html'), 'utf8');
    expect(() => run(['--output', output, '--sticker-v2', 'true'])).toThrow();
    expect(await readFile(path.join(output, 'index.html'), 'utf8')).toBe(before);
    expect((await stat(output)).mode & 0o777).toBe(0o700);
    expect((await stat(path.join(output, 'briefs.json'))).mode & 0o777).toBe(0o600);
  }));

  it('requires an explicit flag and rejects unknown or duplicate CLI options', () => {
    expect(() => run(['--output', '/tmp/not-created'])).toThrow();
    expect(() => run(['--publish', 'true'])).toThrow();
    expect(() => run(['--sticker-v2', 'true', '--sticker-v2', 'false'])).toThrow();
  });

  it('blocks the whole package before writing when any request fails', async () => temporary(async root => {
    const inputDir = path.join(root, 'inputs');
    await mkdir(inputDir);
    const examples = path.join(repository, 'docs/social/creative-os/examples');
    for (const name of ['truecolor-kit.json', 'sticker-recipes.json', 'fixture-proofs.json', 'offer-inputs.json']) {
      let contents = await readFile(path.join(examples, name), 'utf8');
      if (name === 'offer-inputs.json') {
        const requests = JSON.parse(contents);
        requests[1].scheduleTime = '2026-09-10T15:00:00Z';
        contents = JSON.stringify(requests);
      }
      await writeFile(path.join(inputDir, name), contents);
    }
    const output = path.join(root, 'held');
    expect(() => run(['--output', output, '--sticker-v2', 'true', '--input-dir', inputDir])).toThrow();
    await expect(stat(output)).rejects.toThrow();
  }));

  it('rejects public-checkout output even through a symlink and rejects traversal names', async () => temporary(async root => {
    const checkout = path.join(root, 'checkout');
    await mkdir(checkout);
    await writeFile(path.join(checkout, '.git'), 'gitdir: placeholder');
    const alias = path.join(root, 'alias');
    await symlink(checkout, alias, 'dir');
    await expect(writeReviewPackage(path.join(alias, 'review'), { 'index.html': 'x' })).rejects.toThrow('outside Git');
    await expect(writeReviewPackage(path.join(root, 'review'), { '../escape.json': '{}' })).rejects.toThrow('Invalid output');
    await expect(stat(path.join(root, 'review'))).rejects.toThrow();
  }));

  it('escapes all visible and diagnostic text and never emits executable input', () => {
    const attack = '<script>fetch("https://example.invalid")</script>';
    const html = renderPreview([{
      id: 'safe', facts: { mode: 'configurator', cta: { instruction: attack } }, recipeRef: { id: 'recipe' },
      headlineDirection: attack, requiredVisibleText: [attack], layoutInstructions: [attack],
      contactPanel: { website: attack, address: attack, phone: attack }, proofRefs: [{ disclosure: attack }],
    }], { message: attack });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain("default-src 'none'");
    expect(html).not.toMatch(/<script|<iframe|<img|<link/i);
  });

  it('bounds fixture input size before parsing', async () => temporary(async root => {
    await writeFile(path.join(root, 'truecolor-kit.json'), ' '.repeat(1024 * 1024 + 1));
    expect(() => readExampleInputs(root)).toThrow('exceeds one MiB');
  }));
  it('uses supplied identity, count and required contacts without True Color defaults', () => {
    const html = renderPreview([{id: 'sample',brandKey: 'other',facts: {mode: 'education',cta: {instruction: 'Explore samples'}},recipeRef: {id: 'sample'},headlineDirection: 'A sample',requiredVisibleText: [],layoutInstructions: [],contactPanel: {website: 'https://example.test/'},proofRefs: [{disclosure: 'Illustration'}]}], {}, [], {name: 'Example Studio'});
    expect(html).toContain('Example Studio');
    expect(html).toContain('1 draft brief to discuss');
    expect(html).not.toMatch(/True Color|TRUE COLOR|Pickup:|Three different|undefined/);
    expect(html).toContain('your own samples');
  });
});
