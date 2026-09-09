import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { mkdtemp, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { brandMedia } from './brand-media.mjs';

async function fixture(dir, width = 800, height = 500) {
  const source = join(dir, 'source.png');
  const logo = join(dir, 'logo.png');
  const raw = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 3;
    raw[i] = x % 251; raw[i + 1] = y % 253; raw[i + 2] = (x + y) % 255;
  }
  await sharp(raw, { raw: { width, height, channels: 3 } }).png().toFile(source);
  await sharp(Buffer.from('<svg width="200" height="50"><rect x="20" y="10" width="160" height="30" fill="red"/></svg>')).png().toFile(logo);
  return { source, logo, output: join(dir, 'branded.jpg'), corner: 'bottom-right' };
}

for (const [width, height, corner] of [[800, 500, 'top-left'], [600, 1200, 'top-right'], [2100, 350, 'bottom-left'], [100, 2400, 'bottom-right']]) {
  test(`whole ${width}x${height} source with reviewed ${corner} overlay`, async () => {
    const dir = await mkdtemp(join(tmpdir(), 'brand-media-'));
    try {
      const args = { ...await fixture(dir, width, height), corner };
      const before = await readFile(args.source);
      const result = await brandMedia(args);
      const { width: w, height: h } = result.output;
      const l = result.layout.logo;
      assert.ok(w <= 1080 && h <= 1080 && w <= width && h <= height);
      assert.ok(Math.abs(w / h - width / height) <= 1 / h, 'aspect preserved within pixel rounding');
      assert.deepEqual(result.layout.artwork, { left: 0, top: 0, width: w, height: h });
      assert.equal(result.layout.footer, undefined);
      assert.equal(l.left, corner.endsWith('right') ? w - Math.round(w * .035) - l.width : Math.round(w * .035));
      assert.equal(l.top, corner.startsWith('bottom') ? h - Math.round(h * .035) - l.height : Math.round(h * .035));
      assert.ok(l.left >= 0 && l.top >= 0 && l.left + l.width <= w && l.top + l.height <= h);
      const expected = await sharp(args.source).resize({ width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true }).removeAlpha().raw().toBuffer();
      const actual = await sharp(result.files.lossless).removeAlpha().raw().toBuffer();
      let changed = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const offset = (y * w + x) * 3;
        const equal = actual.subarray(offset, offset + 3).equals(expected.subarray(offset, offset + 3));
        if (x < l.left || x >= l.left + l.width || y < l.top || y >= l.top + l.height) assert.ok(equal, 'outside overlay pixels unchanged');
        else if (!equal) changed++;
      }
      assert.ok(changed > 0, 'logo visible');
      assert.deepEqual(await readFile(args.source), before);
      await assert.rejects(brandMedia(args), /EEXIST/);
    } finally { await rm(dir, { recursive: true, force: true }); }
  });
}

for (const existingName of ['branded.jpg', 'branded.jpg.json']) {
  test(`collision preserves existing ${existingName} and cleans newly created files`, async () => {
    const dir = await mkdtemp(join(tmpdir(), 'brand-media-collision-'));
    try {
      const args = await fixture(dir);
      const sentinel = Buffer.from('existing output must survive byte-for-byte');
      await writeFile(join(dir, existingName), sentinel);
      await assert.rejects(brandMedia(args), /EEXIST/);
      assert.deepEqual((await readdir(dir)).sort(), [existingName, 'logo.png', 'source.png'].sort());
      assert.deepEqual(await readFile(join(dir, existingName)), sentinel);
    } finally { await rm(dir, { recursive: true, force: true }); }
  });
}

test('requires explicit logo/corner and bounded size; rejects opaque logos', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'brand-media-validation-'));
  try {
    const args = await fixture(dir);
    await assert.rejects(brandMedia({ ...args, logo: undefined }), /Explicit transparent logo/);
    await assert.rejects(brandMedia({ ...args, corner: undefined }), /Explicit corner/);
    for (const widthRatio of [0, 0.31, NaN]) await assert.rejects(brandMedia({ ...args, widthRatio }), /widthRatio/);
    await assert.rejects(brandMedia({ ...args, logo: args.source }), /transparent pixels/);
    assert.deepEqual((await readdir(dir)).sort(), ['logo.png', 'source.png']);
  } finally { await rm(dir, { recursive: true, force: true }); }
});


test('white badge preserves artwork outside its bounds and records the logo inset', async () => {
  const dir=await mkdtemp(join(tmpdir(),'brand-white-'));
  try {
    const args=await fixture(dir);const before=await readFile(args.source);
    const result=await brandMedia({...args,corner:'top-right',backing:'white'});
    assert.equal(result.method,'white-backed-corner-overlay');
    const badge=result.layout.badge, logo=result.layout.logo;
    assert.equal(logo.left,badge.left+badge.padding);assert.equal(logo.top,badge.top+badge.padding);
    const {data,info}=await sharp(result.files.lossless).removeAlpha().raw().toBuffer({resolveWithObject:true});
    const expected=await sharp(args.source).removeAlpha().raw().toBuffer();
    const x=badge.left+Math.floor(badge.width/2), y=badge.top+1;
    assert.deepEqual([...data.subarray((y*info.width+x)*3,(y*info.width+x)*3+3)],[255,255,255]);
    for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
      if(x>=badge.left&&x<badge.left+badge.width&&y>=badge.top&&y<badge.top+badge.height)continue;
      const i=(y*info.width+x)*3;assert.deepEqual(data.subarray(i,i+3),expected.subarray(i,i+3));
    }
    assert.deepEqual(await readFile(args.source),before);
    await assert.rejects(brandMedia({...args,backing:'black'}),/backing/);
  } finally {await rm(dir,{recursive:true,force:true});}
});
