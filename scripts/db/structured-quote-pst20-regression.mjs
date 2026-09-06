// Emits a transactional regression for a disposable PostgreSQL database.
// Usage: node scripts/db/structured-quote-pst20-regression.mjs | psql -X -v ON_ERROR_STOP=1 --dbname lane_p
// Source functions are extracted from committed migrations, never hand copied.
import { readFileSync } from 'node:fs';
const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const baseline = read('supabase/migrations/20260724130000_quote_send_delivery_state.sql');
const marker = 'CREATE OR REPLACE FUNCTION public.structured_quote_pst_base_cents(\n';
const start = baseline.indexOf(marker);
if (start < 0) throw new Error('PST dispatcher source missing');
const dispatcher = baseline.slice(start, baseline.indexOf('$$;', start) + 3);
const migration = read('supabase/migrations/20260906110000_structured_quote_pst20_policy.sql').replace(/^BEGIN;$/m, '').replace(/^COMMIT;$/m, '');
const regression = read('scripts/db/sql/structured-quote-pst20-regression.sql').replace(/^BEGIN;$/m, '').replace(/^ROLLBACK;$/m, '');
process.stdout.write(`\\set ON_ERROR_STOP on\nBEGIN;\nCREATE TABLE public.truecolor_tax_config (id boolean PRIMARY KEY, gst_rate numeric, pst_rate numeric);\nINSERT INTO public.truecolor_tax_config VALUES (true, .05, .06);\n${migration}\n${dispatcher}\n${regression}\nROLLBACK;\n`);
