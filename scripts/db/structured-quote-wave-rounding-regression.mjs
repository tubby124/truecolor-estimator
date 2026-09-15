// Emits a transactional regression for a disposable PostgreSQL database.
// It extracts the shipped per-line helper rather than copying its body.
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/20260915220000_structured_quote_wave_line_tax_rounding.sql");
const marker = "CREATE OR REPLACE FUNCTION public.structured_quote_tax_components_v3(\n";
const start = migration.indexOf(marker);
if (start < 0) throw new Error("Wave per-line tax helper source missing");
const helper = migration.slice(start, migration.indexOf("$$;", start) + 3);
const regression = read("scripts/db/sql/structured-quote-wave-rounding-regression.sql")
  .replace(/^BEGIN;$/m, "")
  .replace(/^ROLLBACK;$/m, "");

process.stdout.write(`\\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA IF NOT EXISTS public;
CREATE OR REPLACE FUNCTION public.structured_quote_pst_base_cents(jsonb)
RETURNS integer LANGUAGE sql IMMUTABLE AS 'SELECT 0';
${helper}
${regression}
ROLLBACK;
`);
