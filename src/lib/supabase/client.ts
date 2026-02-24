import { createBrowserClient } from "@supabase/ssr";

// Supabase project: dczbgraekmzirxknjvwe
// URL is public — not a secret
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dczbgraekmzirxknjvwe.supabase.co";

export function createClient() {
  return createBrowserClient(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
