import sharp from 'sharp';

/** Opt-in monthly upload: retain the complete photograph and add white margins only. */
export async function prepareMonthlyMedia(input: Buffer) {
  const oriented = await sharp(input, { limitInputPixels: 80_000_000 }).rotate().flatten({ background: '#ffffff' }).png().toBuffer({ resolveWithObject: true });
  const { width, height } = oriented.info;
  const canvasWidth = Math.max(width, Math.ceil(height * 0.8));
  const canvasHeight = Math.max(height, Math.ceil(width / 1.91));
  const horizontal = canvasWidth - width;
  const vertical = canvasHeight - height;
  const padded = await sharp(oriented.data).extend({ left: Math.floor(horizontal / 2), right: Math.ceil(horizontal / 2), top: Math.floor(vertical / 2), bottom: Math.ceil(vertical / 2), background: '#ffffff' }).png().toBuffer();
  const resized = await sharp(padded).resize({ width: 1080, height: 1350, fit: 'inside', withoutEnlargement: true }).png().toBuffer({ resolveWithObject: true });
  // Integer resize rounding can otherwise turn 1.91 into 1.9115. Add only the missing pixel(s).
  const right = Math.max(0, Math.ceil(resized.info.height * 0.8) - resized.info.width);
  const bottom = Math.max(0, Math.ceil(resized.info.width / 1.91) - resized.info.height);
  const output = await sharp(resized.data).extend({ left: 0, top: 0, right, bottom, background: '#ffffff' }).jpeg({ quality: 90 }).toBuffer({ resolveWithObject: true });
  if (output.info.width < 320 || output.info.width / output.info.height < 0.8 || output.info.width / output.info.height > 1.91 || output.data.length > 8 * 1024 * 1024) throw new Error('Photo does not meet publishing dimensions');
  return { buffer: output.data, width: output.info.width, height: output.info.height, padded: horizontal > 0 || vertical > 0 || right > 0 || bottom > 0 };
}
