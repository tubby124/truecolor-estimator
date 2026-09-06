import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { prepareMonthlyMedia } from '../prepare-media';
const source = (width: number, height: number) => sharp({ create: { width, height, channels: 3, background: '#d00000' } }).png().toBuffer();
describe('monthly media framing', () => {
  it('pads a narrow portrait without losing the source edges', async () => {
    const result = await prepareMonthlyMedia(await source(900, 1200));
    expect(result).toMatchObject({ width: 960, height: 1200, padded: true });
    const { data, info } = await sharp(result.buffer).raw().toBuffer({ resolveWithObject: true });
    const pixel = (x: number, y: number) => [...data.subarray((y * info.width + x) * 3, (y * info.width + x) * 3 + 3)];
    expect(pixel(5, 600).every(v => v > 245)).toBe(true);
    for (const [x,y] of [[35,5],[925,5],[35,1195],[925,1195]]) expect(pixel(x,y)[0]).toBeGreaterThan(180);
    expect(pixel(480,600)[1]).toBeLessThan(20);
  });
  it('retains square photographs and bounds a very wide image', async () => {
    expect(await prepareMonthlyMedia(await source(600,600))).toMatchObject({ width:600,height:600,padded:false });
    const wide = await prepareMonthlyMedia(await source(2400,600));
    expect(wide.width).toBe(1080); expect(wide.width/wide.height).toBeLessThanOrEqual(1.91); expect(wide.padded).toBe(true);
  });
  it('keeps boundary landscape ratios valid after integer resize rounding', async () => {
    const result = await prepareMonthlyMedia(await source(1910, 1000));
    expect(result).toMatchObject({width:1080,height:566});
    expect(result.width/result.height).toBeLessThanOrEqual(1.91);
  });
  it('orients phone photos before padding and strips EXIF', async () => {
    const input = await sharp(await source(1200,900)).withMetadata({orientation:6}).jpeg().toBuffer();
    const result = await prepareMonthlyMedia(input);
    expect(result).toMatchObject({width:960,height:1200,padded:true});
    expect((await sharp(result.buffer).metadata()).exif).toBeUndefined();
  });
  it('rejects tiny or undecodable uploads', async () => {
    await expect(prepareMonthlyMedia(await source(100,100))).rejects.toThrow();
    await expect(prepareMonthlyMedia(Buffer.from('bad'))).rejects.toThrow();
  });
});
