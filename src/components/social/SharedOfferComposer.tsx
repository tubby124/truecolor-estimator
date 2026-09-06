'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ImagePicker } from './ImagePicker';
interface OfferSummary {id:string;title:string;destination_url:string;created_at?:string}
export function SharedOfferComposer(){
 const [productSlug,setProductSlug]=useState('');const [images,setImages]=useState<string[]>([]);
 const [terms,setTerms]=useState('');const [startsOn,setStartsOn]=useState('');const [endsOn,setEndsOn]=useState('');
 const [rights,setRights]=useState(false);const [template,setTemplate]=useState(true);const [busy,setBusy]=useState(false);
 const [offers,setOffers]=useState<OfferSummary[]>([]);const [page,setPage]=useState(0);const [hasMore,setHasMore]=useState(false);const [error,setError]=useState('');
 useEffect(()=>{let canceled=false;void fetch(`/api/staff/social/offers?page=${page}`,{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'Offers unavailable');if(!canceled){setOffers(d.offers);setHasMore(d.hasMore);}}).catch(e=>{if(!canceled)setError(e.message);});return()=>{canceled=true;};},[page]);
 async function create(){setBusy(true);setError('');try{const r=await fetch('/api/staff/social/offers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productSlug,imageUrl:images[0],terms,startsOn:startsOn||null,endsOn:endsOn||null,rightsConfirmed:rights,renderTemplate:template})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Offer creation failed');setOffers(v=>[d.offer,...v]);}catch(e){setError(e instanceof Error?e.message:'Offer creation failed');}finally{setBusy(false);}}
 return <main className="max-w-3xl mx-auto p-6 space-y-5"><h1 className="text-2xl font-bold">Shared offers</h1><p>Choose a purchasable product and a cleared photo. The catalogue supplies the configuration and price. Each destination still needs exact copy, account and schedule approval.</p><Link className="underline" href="/staff/social/settings">Review actual Google history and connection</Link>{error&&<p role="alert" className="text-red-700">{error}</p>}
 <label className="block">Product URL slug<input className="block border rounded p-2 w-full" value={productSlug} onChange={e=>setProductSlug(e.target.value)} placeholder="e.g. retractable-banners"/></label>
 <ImagePicker value={images} onChange={setImages} maxImages={1}/>
 <label className="block"><input type="checkbox" checked={rights} onChange={e=>setRights(e.target.checked)}/> I confirm this image is cleared for this business’s social use.</label>
 <label className="block"><input type="checkbox" checked={template} onChange={e=>setTemplate(e.target.checked)}/> Create a branded image with catalogue price text</label>
 <label className="block">Real offer terms<textarea className="block border rounded p-2 w-full" value={terms} maxLength={500} onChange={e=>setTerms(e.target.value)}/></label>
 <p>Leave both dates empty for an ordinary Google post. Set both only for a real offer period.</p><div className="flex gap-4"><label>Start<input type="date" className="block border p-2" value={startsOn} onChange={e=>setStartsOn(e.target.value)}/></label><label>End<input type="date" className="block border p-2" value={endsOn} onChange={e=>setEndsOn(e.target.value)}/></label></div>
 <button className="rounded bg-black text-white px-4 py-2 disabled:opacity-50" disabled={busy||!rights||!productSlug||!images.length} onClick={()=>void create()}>{busy?'Preparing…':'Prepare shared offer'}</button>
 <ul className="space-y-3">{offers.map(offer=><li key={offer.id} className="border rounded p-4 flex justify-between gap-4"><span>{offer.title}</span><Link className="underline" href={`/staff/social/compose?offer=${offer.id}`}>Review channel drafts</Link></li>)}</ul><div className="flex gap-3"><button disabled={!page} onClick={()=>setPage(v=>v-1)}>Previous</button><span>Page {page+1}</span><button disabled={!hasMore} onClick={()=>setPage(v=>v+1)}>Next</button></div></main>;
}
