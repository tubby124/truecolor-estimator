/**
 * Supabase server-side client (service role — bypasses RLS).
 * Server-only — never import on client. Only use in API routes and server components.
 */
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = "https://dczbgraekmzirxknjvwe.supabase.co";

export function createServiceClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY not configured");
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false },
  });
}

/**
 * Returns the authenticated Supabase user from the current request's session cookies,
 * or null if not authenticated. Use this in API route handlers that require auth.
 */
export async function getSessionUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {}, // read-only in route handlers
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
