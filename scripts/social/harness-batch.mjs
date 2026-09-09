/** Offline bridge. Node 22.18+; no credentials, uploads, approvals or scheduling. */
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, realpath, stat, mkdtemp, rm } from 'node:fs/promises';
import { dirname, resolve, basename, join } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { brandMedia } from './brand-media.mjs';
import { fileURLToPath } from 'node:url';
import { parseMonthPlan, planReginaTime } from '../../src/lib/social/monthly-plan.ts';
import { prepareMonthlyMedia } from '../../src/lib/social/prepare-media.ts';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const text = v => typeof v === 'string' && v.trim().length > 0 && v.length <= 500;
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
export function checkedLearningContext(context, batch) {
  if (context === undefined || context === null) return null;
  if (typeof context !== 'object' || Array.isArray(context)) throw new Error('Malformed learning context.');
  const {context_sha256, ...content} = context;
  if (context.schema !== 'social-draft-learning-context-v1' || context.business_id !== batch.businessKey || context.target?.id !== batch.packageId || context.target?.kind !== 'package' || context.target?.status !== 'draft' || context_sha256 !== sha(JSON.stringify(canonical(content),null,2)+'\n')) throw new Error('Learning context does not match this draft or its digest.');
  if (!Array.isArray(context.selected_decision_ids) || !Array.isArray(context.lessons) || context.selected_decision_ids.some(id => !context.lessons.some(lesson => lesson.decision_id === id)) || batch.lineage.some(row => row.recipeId !== context.source_scope?.recipe_id || row.recipeVersion !== context.source_scope?.recipe_version)) throw new Error('Learning context recipe/decision scope mismatch.');
  return {contextSha256:context_sha256, consultedDecisionIds:context.selected_decision_ids, sourceScope:context.source_scope, status:'consulted_not_automatic_application', authority:context.authority};
}

export function checkedPreparationPolicy(input, batch) {
  const context=checkedLearningContext(input.learningContext,batch), policy=input.preparationPolicy;
  if (!context || !policy || typeof policy !== 'object' || Array.isArray(policy)) throw new Error('A checked learning context and preparation policy are required.');
  const {policy_sha256,...content}=policy;
  if (policy.schema !== 'social-preparation-policy-v1' || policy.business_id !== batch.businessKey || policy.target_package_id !== batch.packageId || policy.authority !== 'preparation_only_not_publication' || policy_sha256 !== sha(JSON.stringify(canonical(content),null,2)+'\n') || policy.source_context_sha256 !== context.contextSha256 || JSON.stringify(canonical(policy.source_scope)) !== JSON.stringify(canonical(context.sourceScope))) throw new Error('Preparation policy binding mismatch.');
  if (!Array.isArray(policy.applied_decision_ids) || !policy.applied_decision_ids.length || policy.applied_decision_ids.length !== context.consultedDecisionIds.length || new Set(policy.applied_decision_ids).size !== policy.applied_decision_ids.length || policy.applied_decision_ids.some(id=>!context.consultedDecisionIds.includes(id)) || !/^[a-f0-9]{64}$/.test(policy.binding_sha256 ?? '')) throw new Error('Preparation policy decision evidence mismatch.');
  const r=policy.renderer;
  if (!r || JSON.stringify(Object.keys(r).sort()) !== JSON.stringify(['backing','corner','inset_ratio','logo_sha256','width_ratio']) || r.backing !== 'white' || r.corner !== 'top-right' || r.width_ratio !== 0.20 || r.inset_ratio !== 0.035 || !/^[a-f0-9]{64}$/.test(r.logo_sha256 ?? '')) throw new Error('True Color requires its bound logo, solid white backing and reviewed placement.');
  if (policy.caption?.mode !== 'provided_draft' || !Array.isArray(policy.caption.fact_ids) || policy.caption.fact_ids.length || batch.plan.creatives.some(c=>c.product)) throw new Error('This bridge accepts provided price-free drafts; offers require pricing integration.');
  if (!text(input.logoFilename) || basename(input.logoFilename)!==input.logoFilename || !/^[a-zA-Z0-9_.-]+\.png$/.test(input.logoFilename)) throw new Error('Choose a local PNG logo basename.');
  for(const row of batch.lineage) if(row.sourceStage !== 'unbranded' || !['contain','cover-4x5-centre'].includes(row.framing) || (row.framing==='cover-4x5-centre' && !text(row.framingEvidence))) throw new Error('Bind unbranded sources and explicit reviewed framing before rendering.');
  return policy;
}

export function validateHarnessBatch(input) {
  if (input?.schemaVersion !== 1 || input?.kind !== 'truecolor-harness-batch' || input.businessKey !== 'truecolor' || !text(input.packageId) || input.status !== 'draft') throw new Error('Use a draft True Color harness batch v1.');
  const plan = parseMonthPlan(input.plan);
  if (plan.creatives.length > 7) throw new Error('A rehearsal is limited to seven creatives.');
  if (!Array.isArray(input.lineage) || input.lineage.length !== plan.creatives.length) throw new Error('Every creative needs exactly one lineage record.');
  const slots = new Set();
  for (const creative of plan.creatives) {
    const matches = input.lineage.filter(row => row.creativeId === creative.id);
    const row = matches[0];
    if (matches.length !== 1 || !text(row.sourceId) || !text(row.recipeId) || !text(row.recipeVersion) || !['illustrative','customer-work'].includes(row.sourceType) || !text(row.rightsEvidence) || !text(row.factsEvidence) || !text(row.purpose)) throw new Error('Missing or ambiguous creative provenance.');
    if (row.sourceType === 'customer-work' && row.customerClearance !== 'confirmed') throw new Error('Customer work requires recorded clearance.');
    for (const channel of creative.channels) {
      const slot = `${creative.scheduleTime}:${channel}`;
      if (slots.has(slot)) throw new Error('Conflicting destination times in this batch.');
      slots.add(slot);
    }
  }
  return { plan, lineage: input.lineage, packageId: input.packageId, businessKey: input.businessKey };
}

async function privateDirectory(path) {
  let probe = resolve(path);
  while (true) {
    try { probe = await realpath(probe); break; } catch (error) { if (error.code !== 'ENOENT') throw error; const parent = dirname(probe); if (parent === probe) throw error; probe = parent; }
  }
  for (let dir = probe;; dir = dirname(dir)) {
    try { await stat(join(dir, '.git')); throw new Error('Keep private batches outside Git checkouts.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (dirname(dir) === dir) break;
  }
}

export async function buildHarnessBatch(input, assetDirectory, outputDirectory) {
  const batch = validateHarnessBatch(input);
  await privateDirectory(outputDirectory);
  const policy=checkedPreparationPolicy(input,batch);
  const logo=await readFile(join(assetDirectory,input.logoFilename));
  if (sha(logo)!==policy.renderer.logo_sha256) throw new Error('Logo bytes do not match the accepted preparation policy.');
  // Freeze verified bytes before invoking the renderer; source changes cannot race rendering.
  const inputs=[];
  for(const creative of batch.plan.creatives){
    const raw=await readFile(join(assetDirectory,creative.imageFilename));
    if (!raw.length || raw.length>30*1024*1024) throw new Error(`${creative.imageFilename}: source must be 1 byte to 30 MB.`);
    if(sha(raw)!==creative.imageSha256) throw new Error(`${creative.imageFilename}: source bytes changed.`);
    inputs.push({creative,raw,lineage:batch.lineage.find(row=>row.creativeId===creative.id)});
  }
  const media=[], temporary=await mkdtemp(join(tmpdir(),'tc-learned-render-'));
  try {
    const logoPath=join(temporary,'logo.png');await writeFile(logoPath,logo);
    for(const {creative,raw,lineage} of inputs){
      const framed=lineage.framing==='cover-4x5-centre' ? await sharp(raw).rotate().resize(1080,1350,{fit:'cover',position:'centre'}).png().toBuffer() : raw;
      const sourcePath=join(temporary,`${creative.id}-source`);await writeFile(sourcePath,framed);
      const branded=await brandMedia({source:sourcePath,output:join(temporary,`${creative.id}.jpg`),logo:logoPath,corner:policy.renderer.corner,backing:policy.renderer.backing,widthRatio:policy.renderer.width_ratio,inset:policy.renderer.inset_ratio,maxHeight:1350});
      const source=await readFile(branded.files.output), prepared=await prepareMonthlyMedia(source);
      const renderedCreative={...creative,imageFilename:`${creative.id}.jpg`,imageSha256:sha(source)};
      const receipt={schema:'social-render-receipt-v1',business_id:batch.businessKey,target_package_id:batch.packageId,policy_sha256:policy.policy_sha256,renderer:policy.renderer,source_sha256:sha(raw),output_sha256:sha(source),framing:lineage.framing,framed_source_sha256:sha(framed),upload_preview_sha256:sha(prepared.buffer),layout:branded.layout,caption_sha256:{facebook:sha(creative.captionFacebook),instagram:sha(creative.captionInstagram)}};
      media.push({creative:renderedCreative,source,prepared,receipt});
    }
  } finally {await rm(temporary,{recursive:true,force:true});}
  batch.plan=parseMonthPlan({...batch.plan,creatives:media.map(m=>m.creative)});
  const learningContext = checkedLearningContext(input.learningContext, batch);
  const planJson = JSON.stringify(batch.plan, null, 2) + '\n';
  const sidecar = { schemaVersion: 1, kind: 'truecolor-harness-lineage', packageId: batch.packageId, businessKey: batch.businessKey,
    status: 'prepared_not_approved', planSha256: sha(planJson),
    queueJoinKey: 'creative_id', accountBinding: 'resolved_by_authenticated_server_review',
    schedulerEnrollment: 'not_enrolled', learningContext, preparationPolicy:policy, appliedDecisionIds:policy.applied_decision_ids,
    creatives: media.map(({ creative, prepared, receipt }) => ({ ...batch.lineage.find(row => row.creativeId === creative.id), sourceSha256: receipt.source_sha256, finalImageSha256:creative.imageSha256, renderReceipt:receipt, expectedUploadSha256: sha(prepared.buffer), expectedUploadWidth: prepared.width, expectedUploadHeight: prepared.height, scheduleTime: creative.scheduleTime, channels: creative.channels })) };
  await mkdir(dirname(resolve(outputDirectory)), { recursive: true });
  await mkdir(outputDirectory);
  await mkdir(join(outputDirectory, 'images'), { recursive: true });
  await mkdir(join(outputDirectory, 'upload-preview'), { recursive: true });
  for (const { creative, source, prepared } of media) {
    await writeFile(join(outputDirectory, 'images', creative.imageFilename), source, {flag:'wx'});
    await writeFile(join(outputDirectory, 'upload-preview', `${creative.id}.jpg`), prepared.buffer, {flag:'wx'});
  }
  await writeFile(join(outputDirectory, 'month-plan.json'), planJson, {flag:'wx'});
  await writeFile(join(outputDirectory, 'lineage.json'), JSON.stringify(sidecar, null, 2)+'\n', {flag:'wx'});
  const cards = media.map(({ creative }) => `<article><img src="upload-preview/${creative.id}.jpg" alt="${escape(creative.title)}"><div><small>${escape(batch.lineage.find(r=>r.creativeId===creative.id).purpose)}</small><h2>${escape(creative.title)}</h2><p class="date">Proposed: ${escape(planReginaTime(creative.scheduleTime).replace('T',' '))} · Regina</p><h3>Facebook</h3><p>${escape(creative.captionFacebook)}</p><h3>Instagram</h3><p>${escape(creative.captionInstagram)}</p><small>${escape(batch.lineage.find(r=>r.creativeId===creative.id).sourceType)} source; internal provenance is saved separately.</small></div></article>`).join('');
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>True Color · Small batch review</title><style>*{box-sizing:border-box}body{margin:0;background:#f4f2ed;color:#19362e;font:16px/1.6 system-ui}main{max-width:1200px;margin:auto;padding:32px}h1{font:48px/1.1 Georgia}h2{font:28px/1.2 Georgia}h3,small{font-size:12px}p{white-space:pre-wrap;overflow-wrap:anywhere}.intro{max-width:800px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}article{background:white}article img{width:100%;display:block}article>div{padding:22px}.date{font-size:13px;color:#596b62}.notice{padding:16px;background:#e1e7dc;margin:24px 0}a{color:inherit}@media(max-width:800px){.grid{grid-template-columns:1fr}main{padding:20px}h1{font-size:36px}}</style><main><small>TRUE COLOR · PRIVATE REVIEW</small><h1>${media.length} posts. One complete rehearsal.</h1><p class="intro">Existing concept sources rendered with the saved white-logo policy and draft captions, prepared for the current Facebook and Instagram review flow. Dates below are proposals. Source types and clearance evidence are recorded in the private lineage file.</p><div class="notice">Nothing uploaded, approved, scheduled or posted. The builder applied the saved logo rule and the same local preparation function as the app uploader; hosted output still needs readback. The existing September schedule remains unchanged.</div><div class="grid">${cards}</div><h2>Ready for the existing review screen</h2><p>Import <a href="month-plan.json">month-plan.json</a> and matching files from images/. The existing app creates drafts, then binds approval to the final image, caption, account and time. The <a href="lineage.json">private lineage record</a> keeps creative IDs connected to recipes and sources.</p><p>After exact batch approval, enroll the returned destination IDs alongside the existing authorized scope. The app and VPS scopes and their journals must be reconciled together. Saving a draft alone does not enroll or publish it.</p></main></html>`;
  await writeFile(join(outputDirectory, 'index.html'), html, {flag:'wx'});
  return sidecar;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath) throw new Error('Usage: node --experimental-strip-types scripts/social/harness-batch.mjs PRIVATE_INPUT.json NEW_PRIVATE_OUTPUT_DIR');
  const input = JSON.parse(await readFile(inputPath, 'utf8'));
  await buildHarnessBatch(input, dirname(resolve(inputPath)), resolve(outputPath));
  console.log(`Prepared ${basename(outputPath)}; no network, approval or scheduling performed.`);
}
