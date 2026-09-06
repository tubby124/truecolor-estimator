// Prints the exact authorized-change package; never connects to a database.
// Review emitted SQL and obtain True Color production DB approval before applying.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const csv = readFileSync(new URL('../../data/tables/config.v1.csv', import.meta.url), 'utf8');
const rate = (key) => {
  const row = csv.split(/\r?\n/).find((line) => line.startsWith(`${key},`));
  const value = Number(row?.split(',')[1]);
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`Invalid canonical ${key}`);
  return value.toFixed(6);
};
process.stdout.write(`-- PREPARED ONLY. Explicit True Color production DB approval required.\n-- config.v1.csv sha256 ${createHash('sha256').update(csv).digest('hex')}\nBEGIN;\nINSERT INTO public.truecolor_tax_config (id, gst_rate, pst_rate, updated_at)\nVALUES (true, ${rate('gst_rate')}, ${rate('pst_rate')}, now())\nON CONFLICT (id) DO UPDATE SET gst_rate = EXCLUDED.gst_rate, pst_rate = EXCLUDED.pst_rate, updated_at = now();\nSELECT id, gst_rate, pst_rate FROM public.truecolor_tax_config WHERE id = true;\nCOMMIT;\n`);
