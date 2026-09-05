import { afterEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import { inspectApprovedMedia } from '../approval';
const url='https://dczbgraekmzirxknjvwe.supabase.co/storage/v1/object/public/social-images/social/2026/abcd-1234.jpg';
afterEach(()=>vi.unstubAllGlobals());
describe('approved media validation',()=>{
 it('decodes actual JPEG and hashes bytes with bounded nonredirecting fetch',async()=>{
  const bytes=await sharp({create:{width:1080,height:1080,channels:3,background:'#fff'}}).jpeg().toBuffer();
  const fetcher=vi.fn().mockResolvedValue(new Response(bytes));vi.stubGlobal('fetch',fetcher);
  expect(await inspectApprovedMedia(url)).toMatchObject({width:1080,height:1080,sha256:expect.stringMatching(/^[a-f0-9]{64}$/)});
  expect(fetcher).toHaveBeenCalledWith(url,expect.objectContaining({redirect:'error',cache:'no-store',signal:expect.any(AbortSignal)}));
 });
 it('does not fetch a foreign origin or signed URL',async()=>{const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);await expect(inspectApprovedMedia(url.replace('.supabase.co','.example.org'))).rejects.toThrow();await expect(inspectApprovedMedia(url+'?token=anything')).rejects.toThrow();expect(fetcher).not.toHaveBeenCalled();});
 it('rejects arbitrary bytes hidden by jpg extension',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('not a JPEG')));await expect(inspectApprovedMedia(url)).rejects.toThrow();});
 it('rejects valid PNG disguised as jpg',async()=>{const bytes=await sharp({create:{width:1080,height:1080,channels:3,background:'#fff'}}).png().toBuffer();vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(bytes)));await expect(inspectApprovedMedia(url)).rejects.toThrow(/decoded JPEG/);});
 it('rejects inappropriate aspect ratio',async()=>{const bytes=await sharp({create:{width:1080,height:100,channels:3,background:'#fff'}}).jpeg().toBuffer();vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(bytes)));await expect(inspectApprovedMedia(url)).rejects.toThrow(/aspect ratio/);});
 it('rejects oversized response before decoding',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('x',{headers:{'content-length':String(8*1024*1024+1)}})));await expect(inspectApprovedMedia(url)).rejects.toThrow(/8 MiB/);});
});
