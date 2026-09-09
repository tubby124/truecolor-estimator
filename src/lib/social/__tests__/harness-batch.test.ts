import { describe, it, expect } from 'vitest';
import { validateHarnessBatch, buildHarnessBatch, checkedLearningContext } from '../../../../scripts/social/harness-batch.mjs';
import { mkdtemp, readFile, rm, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const id = '11111111-1111-4111-8111-111111111111';
const creative = { id, title: 'Print tip', scheduleTime: '2026-09-10T14:00:00-06:00', channels: ['facebook','instagram'], captionFacebook: 'Check the file.', captionInstagram: 'Check the file.', imageFilename: 'tip.png', imageSha256: 'a'.repeat(64) };
const fixture = () => ({ schemaVersion: 1, kind: 'truecolor-harness-batch', businessKey: 'truecolor', packageId: 'test', status: 'draft', plan: { schemaVersion: 1, kind: 'truecolor-month-plan', title: 'Test', creatives: [{...creative}] }, lineage: [{creativeId:id,sourceId:'synthetic-test',recipeId:'tip',recipeVersion:'v1',sourceType:'illustrative',rightsEvidence:'synthetic',factsEvidence:'synthetic',purpose:'helpful-tip'}] });
describe('bounded harness to existing month-plan bridge', () => {
  it('preserves exact copy, stable identity and Regina schedule without approval', () => {
    const result = validateHarnessBatch(fixture());
    expect(result.plan.creatives[0]).toMatchObject({id,captionFacebook:'Check the file.',scheduleTime:'2026-09-10T20:00:00.000Z'});
    expect(result.plan).not.toHaveProperty('approval');
  });
  it('holds wrong business, duplicate lineage, missing rights and uncleared real work', () => {
    expect(()=>validateHarnessBatch({...fixture(),businessKey:'other'})).toThrow();
    const duplicate=fixture();duplicate.lineage.push({...duplicate.lineage[0]});expect(()=>validateHarnessBatch(duplicate)).toThrow();
    const missing=fixture();missing.lineage[0].rightsEvidence='';expect(()=>validateHarnessBatch(missing)).toThrow();
    const real=fixture();real.lineage[0].sourceType='customer-work';expect(()=>validateHarnessBatch(real)).toThrow(/clearance/);
  });
  it('requires exact draft binding and digest for consulted lessons', () => {
    const batch=validateHarnessBatch(fixture());
    const content={business_id:'truecolor',lessons:[{decision_id:'lesson-1'}],schema:'social-draft-learning-context-v1',selected_decision_ids:['lesson-1'],source_scope:{recipe_id:'tip',recipe_version:'v1'},target:{id:'test',kind:'package',status:'draft'}};
    const context={...content,context_sha256:createHash('sha256').update(JSON.stringify(content,null,2)+'\n').digest('hex')};
    expect(checkedLearningContext(context,batch)?.status).toBe('consulted_not_automatic_application');
    expect(()=>checkedLearningContext({...context,target:{...content.target,id:'other'}},batch)).toThrow();
    expect(()=>checkedLearningContext({...context,selected_decision_ids:['changed']},batch)).toThrow();
    for (const malformed of [false,0,'',[]]) expect(()=>checkedLearningContext(malformed,batch)).toThrow();
    const wrongRecipe={...content,source_scope:{recipe_id:'other',recipe_version:'v1'}};
    expect(()=>checkedLearningContext({...wrongRecipe,context_sha256:createHash('sha256').update(JSON.stringify(wrongRecipe,null,2)+'\n').digest('hex')},batch)).toThrow(/scope/);
  });
  it('holds colliding channel/time slots while allowing a second time on the same day', () => {
    const input=fixture();const second='22222222-2222-4222-8222-222222222222';input.plan.creatives.push({...creative,id:second,imageFilename:'other.png',imageSha256:'b'.repeat(64)});input.lineage.push({...input.lineage[0],creativeId:second});
    expect(()=>validateHarnessBatch(input)).toThrow(/Conflicting/);
    input.plan.creatives[1].scheduleTime='2026-09-10T15:00:00-06:00';expect(validateHarnessBatch(input).plan.creatives).toHaveLength(2);
  });
  it('checks bytes before writing and exports actual uploader rendition plus private identity map', async () => {
    const root=await mkdtemp(join(tmpdir(),'tc-harness-'));
    try {
      const bytes=await sharp({create:{width:400,height:500,channels:3,background:'#123456'}}).png().toBuffer();await writeFile(join(root,'tip.png'),bytes);
      await expect(buildHarnessBatch(fixture(),root,join(root,'bad'))).rejects.toThrow(/changed/);
      await expect(stat(join(root,'bad'))).rejects.toThrow();
      await writeFile(join(root,'tip.png'),Buffer.alloc(30*1024*1024+1));
      await expect(buildHarnessBatch(fixture(),root,join(root,'oversize'))).rejects.toThrow(/30 MB/);
      await expect(stat(join(root,'oversize'))).rejects.toThrow();
      await writeFile(join(root,'tip.png'),bytes);
      const input=fixture();input.plan.creatives[0].imageSha256=createHash('sha256').update(bytes).digest('hex');
      const sidecar=await buildHarnessBatch(input,root,join(root,'out'));
      const plan=JSON.parse(await readFile(join(root,'out/month-plan.json'),'utf8'));
      expect(plan.creatives[0].id).toBe(id);expect(sidecar.schedulerEnrollment).toBe('not_enrolled');
      expect(sidecar.creatives[0].expectedUploadSha256).toBe(createHash('sha256').update(await readFile(join(root,`out/upload-preview/${id}.jpg`))).digest('hex'));
      await expect(buildHarnessBatch(input,root,join(root,'out'))).rejects.toThrow();
    } finally { await rm(root,{recursive:true,force:true}); }
  });
});
