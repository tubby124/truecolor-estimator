#!/usr/bin/env node
/** Explicit private archive sync. No posts, publishing, public buckets or deletion. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { createClient } from '@supabase/supabase-js';
const args = process.argv.slice(2), i = args.indexOf('--source');
if (i < 0 || !path.isAbsolute(args[i+1] || '')) throw new Error('--source requires absolute archive path');
const source = args[i+1], apply = args.includes('--apply');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const catalogBytes = await fs.readFile(path.join(source,'catalogs/website-v1.json'));
const catalog = JSON.parse(catalogBytes);
const parserSource=await fs.readFile(new URL('../../src/lib/social/asset-library.ts',import.meta.url),'utf8');
const parserJs=ts.transpileModule(parserSource,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {parseLibraryCatalog}=await import('data:text/javascript;base64,'+Buffer.from(parserJs).toString('base64'));
parseLibraryCatalog(catalog);
if (catalog.businessId !== 'truecolor' || catalog.schemaVersion !== 1 || !Array.isArray(catalog.assets) || !catalog.assets.length) throw new Error('Invalid catalog');
const unique = new Map();
for (const asset of catalog.assets) {
  if (!/^originals\/[a-f0-9]{64}\.(webp|png|jpe?g)$/.test(asset.storagePath) || !asset.storagePath.includes(asset.sha256)) throw new Error('Invalid original path');
  if (!['hold','review-required'].includes(asset.rightsStatus)) throw new Error('Archive cannot grant rights');
  const bytes = await fs.readFile(path.join(source,asset.storagePath));
  if (hash(bytes) !== asset.sha256 || bytes.length !== asset.bytes) throw new Error('Local bytes changed');
  unique.set(asset.storagePath,{bytes,sha256:asset.sha256});
}
if (!apply) { console.log(JSON.stringify({mode:'dry-run',assets:catalog.assets.length,objects:unique.size,catalogSha256:hash(catalogBytes)})); process.exit(0); }
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) throw new Error('Protected server configuration required');
if(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname!=='dczbgraekmzirxknjvwe.supabase.co')throw new Error('Wrong business storage destination');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
const bucket = 'social-library';
let {data:info,error} = await db.storage.getBucket(bucket);
if (error) {
  if (Number(error.status || error.statusCode) !== 404 && !/not found/i.test(error.message)) throw new Error('Cannot inspect archive bucket');
  const created = await db.storage.createBucket(bucket,{public:false,fileSizeLimit:30*1024*1024,allowedMimeTypes:['image/jpeg','image/png','image/webp','application/json']});
  if (created.error) throw new Error('Cannot create private archive bucket');
  ({data:info,error} = await db.storage.getBucket(bucket));
}
if (error || !info || info.public !== false) throw new Error('Archive bucket must be verified private');
let uploaded=0,existing=0,verified=0,cursor=0;
const entries=[...unique];
// Immutable independent keys can upload concurrently; the catalog remains one writer.
async function readOriginal(key,sha256){
  for(let attempt=0;attempt<3;attempt++){
    const read=await db.storage.from(bucket).download(key);
    if(!read.error&&read.data){
      if(hash(Buffer.from(await read.data.arrayBuffer()))!==sha256)throw new Error('Original byte mismatch; sync stopped');
      return;
    }
    if(attempt===2)throw new Error('Original readback unavailable after three attempts; sync stopped');
  }
}
await Promise.all(Array.from({length:4},async()=>{
  while(cursor<entries.length){
    const [key,{bytes,sha256}]=entries[cursor++];
    const contentType=/\.webp$/.test(key)?'image/webp':/\.png$/.test(key)?'image/png':'image/jpeg';
    const put=await db.storage.from(bucket).upload(key,bytes,{contentType,upsert:false});
    if(put.error&&!/already exists|duplicate/i.test(put.error.message)&&Number(put.error.statusCode)!==409)throw new Error('Archive upload failed');
    if(put.error)existing++;else uploaded++;
    await readOriginal(key,sha256);verified++;
    if(verified%100===0)console.log(JSON.stringify({phase:'originals',verified,total:entries.length}));
  }
}));
const snapshot = `catalogs/snapshots/${hash(catalogBytes)}.json`;
const saved = await db.storage.from(bucket).upload(snapshot,catalogBytes,{contentType:'application/json',upsert:false});
if (saved.error && !/already exists|duplicate/i.test(saved.error.message) && Number(saved.error.statusCode)!==409) throw new Error('Snapshot write failed');
// Preserve previous current catalog before updating this single-business pointer.
const previous = await db.storage.from(bucket).download('catalogs/website-v1.json');
if(previous.data){const bytes=Buffer.from(await previous.data.arrayBuffer());const oldCatalog=parseLibraryCatalog(JSON.parse(bytes)); const ids=new Set(catalog.assets.map(a=>a.id)); if(oldCatalog.assets.some(a=>!ids.has(a.id)))throw new Error('Sync would remove existing assets; merge catalogs first'); const backup=await db.storage.from(bucket).upload(`catalogs/snapshots/${hash(bytes)}.json`,bytes,{contentType:'application/json',upsert:false});if(backup.error&&!/already exists|duplicate/i.test(backup.error.message)&&Number(backup.error.statusCode)!==409)throw new Error('Previous snapshot preservation failed');}
else {
  // Storage may return an opaque error for a missing object. Confirm absence
  // independently; an unreadable existing catalog must never be overwritten.
  const listed=await db.storage.from(bucket).list('catalogs',{limit:100,search:'website-v1.json'});
  if(listed.error || !Array.isArray(listed.data) || listed.data.some(item=>item.name==='website-v1.json'))throw new Error('Cannot inspect previous catalog');
}
const current = await db.storage.from(bucket).upload('catalogs/website-v1.json',catalogBytes,{contentType:'application/json',upsert:true});
if(current.error)throw new Error('Catalog write failed');
const read = await db.storage.from(bucket).download('catalogs/website-v1.json');
if(read.error||!read.data||hash(Buffer.from(await read.data.arrayBuffer()))!==hash(catalogBytes))throw new Error('Catalog readback failed');
console.log(JSON.stringify({checkedAt:new Date().toISOString(),bucketPrivate:true,assets:catalog.assets.length,uploaded,existing,verified,catalogVerified:true,catalogSha256:hash(catalogBytes),publishingChanged:false}));
