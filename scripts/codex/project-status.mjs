#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const docs = ['AGENTS.md', 'docs/TRUE-COLOR-INDEX.md', ...['CURRENT-STATE.md', 'SEO-STANDARD.md', 'SOURCE-REGISTRY.md', 'CLOUD-PLAYBOOK.md', 'MIGRATION-RECEIPT.md'].map(p => `docs/operations/${p}`)];
const errors = [];
for (const file of docs) {
  if (!existsSync(resolve(root,file))) { errors.push(`Missing ${file}`); continue; }
  const text = readFileSync(resolve(root,file),'utf8');
  for (const [,target] of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    if (!existsSync(resolve(root,dirname(file),target.split('#')[0]))) errors.push(`Broken link ${file}: ${target}`);
  }
}
const pipeline = JSON.parse(readFileSync(resolve(root,'docs/operations/GROWTH-PIPELINE.json'),'utf8'));
const ids = new Set();
const statuses = new Set(['proposed','prepared','sent','submitted','existing-verified','blocked-captcha','correction-needed','verification-needed','owner-accepted','published-verified','declined','replied']);
for (const row of pipeline.opportunities) {
  if(ids.has(row.id)) errors.push(`Duplicate ID ${row.id}`); ids.add(row.id);
  for(const key of ['id','organization','url','status','evidence_date','evidence_level','owner','next_action']) if(!row[key]) errors.push(`${row.id}: missing ${key}`);
  if(!statuses.has(row.status)) errors.push(`${row.id}: invalid status`);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(row.evidence_date)) errors.push(`${row.id}: invalid date`);
  if(row.status==='published-verified' && !row.verified_link_url) errors.push(`${row.id}: published link requires evidence URL`);
}
if(errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Repository: tubby124/truecolor-estimator\nCheckout: ${execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()}`);
console.log(`Project records valid: ${docs.length} entry documents; ${ids.size} pipeline rows.`);
console.log('Verification scope: structure and recorded state only; not live account, delivery or publication proof.');
for (const row of pipeline.opportunities) console.log(`${row.id} | ${row.organization} | ${row.status} | ${row.evidence_date} | ${row.owner}`);
