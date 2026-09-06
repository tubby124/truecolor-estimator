import { NextResponse } from 'next/server';
import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { createServiceClient } from '@/lib/supabase/server';
import { DEFAULT_SOCIAL_BUSINESS_ID, requireSocialBusiness, socialAssetPrefix, socialBusinessScopingEnabled } from '@/lib/social/business';
import { inspectApprovedMedia } from '@/lib/social/approval';
import { offerFacts, offerTemplateSvg, renderOffer, type SharedOffer } from '@/lib/social/offers';
export const dynamic='force-dynamic';
export async function GET(req:Request) {
  const context=await requireSocialBusiness(req); if(context instanceof NextResponse)return context;
  if(!socialBusinessScopingEnabled())return NextResponse.json({error:'Shared offers migration is not enabled'},{status:503});
  const id=new URL(req.url).searchParams.get('id');
  if(id){
    if(!/^[a-f0-9-]{36}$/i.test(id))return NextResponse.json({error:'Invalid offer'},{status:400});
    const {data,error}=await createServiceClient().from('social_offers').select('*').eq('business_id',context.businessId).eq('id',id).maybeSingle();
    if(error||!data)return NextResponse.json({error:'Offer unavailable'},{status:404});
    return NextResponse.json({offer:data,draft:renderOffer(data as SharedOffer)},{headers:{'Cache-Control':'private, no-store'}});
  }
  const page=Number(new URL(req.url).searchParams.get('page')||'0');
  if(!Number.isInteger(page)||page<0||page>10000)return NextResponse.json({error:'Invalid page'},{status:400});
  const {data,error}=await createServiceClient().from('social_offers').select('*').eq('business_id',context.businessId).order('created_at',{ascending:false}).order('id').range(page*20,page*20+19);
  if(error)return NextResponse.json({error:'Offers unavailable'},{status:503});
  return NextResponse.json({offers:data??[],page,hasMore:data?.length===20},{headers:{'Cache-Control':'private, no-store'}});
}
export async function POST(req:Request) {
  const context=await requireSocialBusiness(req); if(context instanceof NextResponse)return context;
  if(!socialBusinessScopingEnabled())return NextResponse.json({error:'Shared offers migration is not enabled'},{status:503});
  if(context.businessId!==DEFAULT_SOCIAL_BUSINESS_ID)return NextResponse.json({error:'Configure this business catalogue before creating price offers'},{status:409});
  const body=await req.json().catch(()=>null);
  if(!body || typeof body.productSlug!=='string' || typeof body.imageUrl!=='string' || body.rightsConfirmed!==true || (body.terms!=null&&(typeof body.terms!=='string'||body.terms.length>500)) || (body.startsOn!=null&&typeof body.startsOn!=='string') || (body.endsOn!=null&&typeof body.endsOn!=='string')) return NextResponse.json({error:'Product, cleared JPEG and rights confirmation required'},{status:400});
  try {
    const facts=offerFacts(body.productSlug,body.configuration);
    const media=await inspectApprovedMedia(body.imageUrl,context.businessId);
    const offer:SharedOffer={id:randomUUID(),business_id:context.businessId,product_slug:facts.productSlug,product_configuration:facts.configuration,fact_fingerprint:facts.sourceFingerprint,facts,title:facts.productName,image_url:body.imageUrl,image_sha256:media.sha256,terms:body.terms||'',starts_on:body.startsOn||null,ends_on:body.endsOn||null,destination_url:facts.productUrl};
    renderOffer(offer); // Validate dates before creating media or persistence.
    const db=createServiceClient();
    if(body.renderTemplate===true){
      const response=await fetch(body.imageUrl,{redirect:'error',signal:AbortSignal.timeout(10000),cache:'no-store'});
      if(!response.ok||!response.body)throw new Error('Media unavailable');
      const reader=response.body.getReader();const parts:Uint8Array[]=[];let size=0;
      try{while(true){const item=await reader.read();if(item.done)break;size+=item.value.byteLength;if(size>8*1024*1024)throw new Error('Media too large');parts.push(item.value);}}finally{await reader.cancel();}
      const original=Buffer.concat(parts);
      if(createHash('sha256').update(original).digest('hex')!==media.sha256)throw new Error('Media changed');
      const photo=await sharp(original).resize(1080,650,{fit:'cover'}).toBuffer();
      const buffer=await sharp({create:{width:1080,height:1080,channels:3,background:'#f8f5ef'}}).composite([{input:photo,top:0,left:0},{input:Buffer.from(offerTemplateSvg(facts)),top:650,left:0}]).jpeg({quality:90}).toBuffer();
      const path=`${socialAssetPrefix(context.businessId)}/${new Date().getUTCFullYear()}/${randomUUID()}.jpg`;
      const {error}=await db.storage.from('social-images').upload(path,buffer,{contentType:'image/jpeg',upsert:false});
      if(error)throw new Error('Template storage unavailable');
      offer.image_url=db.storage.from('social-images').getPublicUrl(path).data.publicUrl;
      offer.image_sha256=createHash('sha256').update(buffer).digest('hex');
    }
    const {error}=await db.from('social_offers').insert({...offer,created_by:context.user.id});
    if(error)return NextResponse.json({error:'Offer could not be saved; no post scheduled'},{status:503});
    return NextResponse.json({offer,draft:renderOffer(offer)},{status:201});
  } catch {return NextResponse.json({error:'Offer validation failed. Check catalogue configuration, dates and cleared JPEG.'},{status:400});}
}
