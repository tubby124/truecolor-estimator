import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync,writeFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
test('bounded prepared batch reaches draft save through exact simulated approval with stable IDs and no live dispatch', async ({ context,page,baseURL }) => {
  if (!baseURL?.startsWith('http://localhost:')) throw new Error('Harness rehearsal requires localhost');
  const session={access_token:'fixture.header.signature',refresh_token:'fixture',token_type:'bearer',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'fixture-owner',email:'info@true-color.ca'}};
  await context.addCookies([{name:`sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://example.supabase.co').hostname.split('.')[0]}-auth-token`,value:'base64-'+Buffer.from(JSON.stringify(session)).toString('base64url'),url:baseURL}]);
  const writes: string[]=[];const saves: Record<string,unknown>[]=[];
  const destinations: {id:string;creative_id:unknown;platform:string;caption:string;image_url:string;schedule_time:unknown;fingerprint:string;status:string}[]=[];
  const approvals:unknown[]=[];
  await page.route('**/api/staff/**',route=>{if(route.request().method()!=='GET')writes.push(route.request().url());return route.fulfill({json:[]});});
  await page.route('**/api/staff/social/batch/monthly*',route=>{
    if(route.request().method()==='GET'){
      const params=new URL(route.request().url()).searchParams;
      if(params.has('batchId'))return route.fulfill({json:{batchId:params.get('batchId'),posts:destinations.map(d=>({...d,platforms:[d.platform],error_message:null,results:[]})),total:destinations.length,hasMore:false,checkedAt:new Date().toISOString()}});
      return route.fulfill({json:{businessId:'truecolor-fixture',batches:[],hasMore:false}});
    }
    const body=route.request().postDataJSON();saves.push(body);
    for(const [i,p] of body.posts.entries())for(const [j,platform] of p.platforms.entries()){
      const id=`00000000-0000-4000-8000-${String(i*2+j+1).padStart(12,'0')}`;
      destinations.push({id,creative_id:p.creative_id,platform,caption:p[`caption_${platform}`],image_url:p.image_url,schedule_time:p.schedule_time,fingerprint:createHash('sha256').update(JSON.stringify({id,p,platform})).digest('hex'),status:'draft'});
    }
    return route.fulfill({json:{created:6,logicalPosts:3,posts:destinations}});
  });
  await page.route('**/api/staff/social/posts/*/approval',route=>{
    const id=route.request().url().split('/').at(-2);const d=destinations.find(d=>d.id===id)!;
    if(route.request().method()==='POST'){const body=route.request().postDataJSON();expect(body).toEqual({fingerprint:d.fingerprint,rightsConfirmed:true});approvals.push(body);d.status='ready';return route.fulfill({json:{post:{id:d.id,status:'ready'}}});}
    return route.fulfill({json:{post:{id:d.id,status:d.status,approval_hash:d.status==='ready'?d.fingerprint:null,caption_instagram:d.caption,caption_facebook:d.caption,schedule_time:d.schedule_time,image_urls:[],alt_text:'Local rehearsal'},fingerprint:d.fingerprint,target:{platform:d.platform,accountId:`synthetic-${d.platform}`,pageId:'synthetic-page'},blockers:[],publishingEnabled:false,content:{caption:d.caption,imageUrls:[d.image_url]}}});
  });
  let uploads=0;
  await page.route('**/api/staff/social/upload',route=>{uploads++;return route.fulfill({json:{url:`https://example.com/image-${uploads}.jpg`}});});
  await page.route('https://example.com/**',route=>{
    const n=Number(route.request().url().match(/image-(\d+)/)?.[1]??1)-1;
    const body=privatePlan ? readFileSync(join(dirname(process.env.HARNESS_REHEARSAL_PLAN!),'upload-preview',privatePlan.creatives[n].id+'.jpg')) : Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZioAAAAASUVORK5CYII=','base64');
    return route.fulfill({status:200,contentType:privatePlan?'image/jpeg':'image/png',body});
  });
  const privatePlan=process.env.HARNESS_REHEARSAL_PLAN ? JSON.parse(readFileSync(process.env.HARNESS_REHEARSAL_PLAN,'utf8')) : null;
  const files=privatePlan ? privatePlan.creatives.map((c: {imageFilename:string})=>({name:c.imageFilename,mimeType:c.imageFilename.endsWith('.jpg')?'image/jpeg':'image/png',buffer:readFileSync(join(dirname(process.env.HARNESS_REHEARSAL_PLAN!),'images',c.imageFilename))})) : [1,2,3].map(n=>({name:`sample-${n}.png`,mimeType:'image/png',buffer:Buffer.from(`synthetic-file-${n}`)}));
  const creatives=privatePlan?.creatives ?? files.map((f: {name:string;buffer:Buffer},i:number)=>({id:`${i+1}`.repeat(8)+'-1111-4111-8111-111111111111',title:`Sample ${i+1}`,scheduleTime:`2026-09-${10+i}T14:00:00-06:00`,channels:['facebook','instagram'],captionFacebook:`Sample ${i+1}. #TrueColorPrinting #SaskatoonPrintShop`,captionInstagram:`Sample ${i+1}. #TrueColorPrinting #SaskatoonPrintShop`,imageFilename:f.name,imageSha256:createHash('sha256').update(f.buffer).digest('hex')}));
  await page.goto('/staff/social/monthly');
  await page.getByLabel('Prepared plan JSON').setInputFiles({name:'month-plan.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({schemaVersion:1,kind:'truecolor-month-plan',title:'Harness rehearsal',creatives}))});
  await page.getByLabel('Matching original image files').setInputFiles(files);
  expect(uploads).toBe(0);expect(saves).toHaveLength(0);
  await page.getByRole('button',{name:'Upload photos into preparation',exact:true}).click();
  await expect(page.getByText('Prepared month loaded.',{exact:false})).toBeVisible();
  expect(uploads).toBe(3);expect(saves).toHaveLength(0);
  await page.getByRole('button',{name:'Save drafts in chunks',exact:true}).click();
  await expect(page.getByRole('link',{name:/Review saved batch/})).toBeVisible();
  expect(saves).toHaveLength(1);
  const posts=saves[0].posts as Record<string,unknown>[];
  expect(posts.map(p=>p.creative_id)).toEqual(creatives.map((c:{id:string})=>c.id));
  expect(posts.map(p=>p.caption_facebook)).toEqual(creatives.map((c:{captionFacebook:string})=>c.captionFacebook));
  expect(posts[0].schedule_time).toBe(new Date(creatives[0].scheduleTime).toISOString());
  expect(posts.every(p=>!('approval_hash' in p))).toBe(true);
  await page.reload();
  await page.getByRole('button',{name:'Resume chunk save',exact:true}).click();
  expect(saves).toHaveLength(1);expect(writes).toEqual([]);
  await page.getByRole('link',{name:/Review saved batch/}).click();
  await expect(page.getByRole('button',{name:'Approve 6 destinations on this page',exact:true})).toBeDisabled();
  await page.getByRole('checkbox').nth(0).check();await page.getByRole('checkbox').nth(1).check();
  await page.getByRole('button',{name:'Approve 6 destinations on this page',exact:true}).click();
  await expect(page.getByRole('button',{name:'Page approval saved',exact:true})).toBeDisabled();
  expect(approvals).toHaveLength(6);expect(destinations.every(d=>d.status==='ready')).toBe(true);expect(writes).toEqual([]);
  if(process.env.HARNESS_REHEARSAL_RECEIPT)writeFileSync(process.env.HARNESS_REHEARSAL_RECEIPT,JSON.stringify({schema:'social-harness-browser-dry-run-v1',mode:'local_mocked_staff_endpoints',planSha256:createHash('sha256').update(readFileSync(process.env.HARNESS_REHEARSAL_PLAN!)).digest('hex'),logicalCreatives:3,destinationCount:destinations.length,destinations,uploadsMocked:uploads,chunkSaves:saves.length,approvalsMocked:approvals.length,unexpectedStaffWrites:writes,liveEnrollment:false,livePublishing:false},null,2)+'\n');
  if(process.env.HARNESS_REHEARSAL_SCREENSHOT) await page.screenshot({path:process.env.HARNESS_REHEARSAL_SCREENSHOT,fullPage:true});
});
