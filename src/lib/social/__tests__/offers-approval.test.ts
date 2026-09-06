import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import sharp from 'sharp';
import {createHmac} from 'node:crypto';
import {factsBlocker,isBusinessMediaPath,reviewPost,verifiedReviewPost} from '../approval';
import {decryptSocialCredentials,encryptSocialCredentials} from '../credentials';
import {offerFacts,offerTemplateSvg,renderOffer,type SharedOffer} from '../offers';
import {DEFAULT_SOCIAL_BUSINESS_ID as A} from '../business';
import {priceDisclosure} from '../generation/validation';
import type {SocialPost} from '@/lib/types/social';
const B='00000000-0000-4000-8000-000000000002';
const media='https://dczbgraekmzirxknjvwe.supabase.co/storage/v1/object/public/social-images/social/2026/abcd-1234.jpg';
function post():SocialPost{return {id:'synthetic',business_id:A,approval_version:2,status:'draft',caption_raw:'Print ideas for Saskatoon.',caption_instagram:null,caption_facebook:null,hashtags:null,image_url:media,image_urls:[],platforms:['facebook'],schedule_time:'2030-01-01T12:00:00Z',use_next_free_slot:false,approval_hash:null,approved_media_sha256:'a'.repeat(64)} as unknown as SocialPost;}
const noDb={from:vi.fn(()=>{throw new Error('No DB call expected');})};
beforeEach(()=>{vi.stubEnv('SOCIAL_BUSINESS_SCOPING_ENABLED','true');vi.stubEnv('SUPABASE_SECRET_KEY','synthetic-key');vi.stubEnv('META_PAGE_ID','page');vi.stubEnv('META_IG_USER_ID','ig');vi.stubEnv('META_PAGE_ACCESS_TOKEN','synthetic-token');vi.stubEnv('SOCIAL_CREDENTIAL_ENCRYPTION_KEY','c'.repeat(64));});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('source-bound offers and approval',()=>{
 it('preserves the legacy fingerprint byte contract after constant business backfill',()=>{
  const p={...post(),approval_version:null};const r=reviewPost(p,Date.parse(p.schedule_time!)-1);
  const oldPayload={id:p.id,content:r.content,caption_raw:p.caption_raw,caption_instagram:p.caption_instagram,caption_facebook:p.caption_facebook,hashtags:p.hashtags,image_url:p.image_url,image_urls:p.image_urls,alt_text:p.alt_text,platforms:p.platforms,schedule_time:new Date(p.schedule_time!).toJSON(),use_next_free_slot:p.use_next_free_slot,target:r.target,mediaSha256:p.approved_media_sha256??null};
  expect(r.fingerprint).toBe(createHmac('sha256','synthetic-key').update(JSON.stringify(oldPayload)).digest('hex'));
 });
 it('applies current source checks to untouched legacy drafts seeking new approval',async()=>{
  const bytes=await sharp({create:{width:1080,height:1080,channels:3,background:'#fff'}}).jpeg().toBuffer();
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(bytes)));
  const review=await verifiedReviewPost({...post(),approval_version:null,caption_raw:'Buy now $110'},noDb as never);
  expect(review.post.approval_version).toBe(2);expect(review.blockers.join(' ')).toMatch(/Price text/);
 });
 it('binds every v2 business/source/Google payload edit',()=>{
  const p=post();const at=Date.parse(p.schedule_time!)-1;const before=reviewPost(p,at).fingerprint;
  for(const delta of [{business_id:B},{fact_fingerprint:'f'.repeat(64)},{product_slug:'banners'},{product_configuration:{qty:2}},{caption_gbp:'Changed'},{gbp_payload:{topicType:'STANDARD' as const}},{offer_id:'other'},{batch_id:'other'},{generation_job_id:'other'}])expect(reviewPost({...p,...delta},at).fingerprint).not.toBe(before);
 });
 it('rejects edited stale dollar text even with a fresh catalogue fingerprint',async()=>{
  const f=offerFacts('retractable-banners');
  const p={...post(),product_slug:f.productSlug,product_configuration:{...f.configuration},fact_fingerprint:f.sourceFingerprint,caption_raw:'Retractable banners for $110.'};
  expect(await factsBlocker(p,noDb as never)).toMatch(/Price text/);
  expect(await factsBlocker({...p,caption_raw:`Print ideas for Saskatoon.\n\n${priceDisclosure(f)}`},noDb as never)).toBeNull();
  expect(await factsBlocker({...p,fact_fingerprint:'old'},noDb as never)).toMatch(/changed/);
 });
 it('does not treat an unbound manually typed price as a verified offer',async()=>{
  expect(await factsBlocker({...post(),caption_raw:'Buy now $110'},noDb as never)).toMatch(/Price text/);
 });
 it('isolates provider credentials and image paths between businesses',()=>{
  const encrypted=encryptSocialCredentials(A,{pageId:'page',igUserId:'ig',accessToken:'synthetic',graphVersion:'v22.0'});
  expect(decryptSocialCredentials(A,encrypted).pageId).toBe('page');expect(()=>decryptSocialCredentials(B,encrypted)).toThrow();
  expect(isBusinessMediaPath(new URL(media).pathname,A)).toBe(true);expect(isBusinessMediaPath(new URL(media).pathname,B)).toBe(false);
  const other=`/storage/v1/object/public/social-images/businesses/${B}/social/2026/abcd.jpg`;
  expect(isBusinessMediaPath(other,B)).toBe(true);expect(isBusinessMediaPath(other,A)).toBe(false);
 });
 it('uses a standard post without dates and real offer fields with dates',()=>{
  const facts=offerFacts('retractable-banners');const offer={id:'offer',business_id:A,product_slug:facts.productSlug,product_configuration:facts.configuration,fact_fingerprint:facts.sourceFingerprint,facts,title:facts.productName,image_url:media,image_sha256:'a'.repeat(64),terms:'Artwork approval required.',starts_on:null,ends_on:null,destination_url:facts.productUrl} satisfies SharedOffer;
  expect(renderOffer(offer).gbp_payload.topicType).toBe('STANDARD');
  const dated=renderOffer({...offer,starts_on:'2030-01-01',ends_on:'2030-01-07'});expect(dated.gbp_payload.topicType).toBe('OFFER');expect(dated.gbp_payload.callToAction).toBeUndefined();expect(dated.gbp_payload.offer?.redeemOnlineUrl).toBe(facts.productUrl);
  expect(()=>renderOffer({...offer,starts_on:'2030-02-31',ends_on:'2030-03-07'})).toThrow();
  expect(()=>renderOffer({...offer,terms:'Save $110'})).toThrow();
  expect(offerTemplateSvg(facts)).toContain(`CAD $${facts.standalonePreTaxOrderTotal.toFixed(2)}`);
  expect(offerTemplateSvg({...facts,productName:'<script> & "'})).not.toContain('<script>');
 });
 it('rejects a generation job owned by another business or missing channel',async()=>{
  const chain={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),maybeSingle:vi.fn().mockResolvedValue({data:null,error:null})};
  expect(await factsBlocker({...post(),generation_job_id:'foreign-job'},{from:()=>chain} as never)).toMatch(/generation source/);
  expect(chain.eq).toHaveBeenCalledWith('business_id',A);
 });
});
