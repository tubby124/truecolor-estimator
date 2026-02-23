/**
 * Supabase server-side client (service role — bypasses RLS).
 * Server-only — never import on client. Only use in API routes and server components.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dczbgraekmzirxknjvwe.supabase.co";

export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_KEY not configured");
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false },
  });
}
