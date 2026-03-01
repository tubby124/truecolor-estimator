/**
 * Supabase server-side client (service role — bypasses RLS).
 * Server-only — never import on client. Only use in API routes and server components.
 */
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dczbgraekmzirxknjvwe.supabase.co";

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

/**
 * Verifies that the request comes from the authenticated staff user (owner).
 * Checks BOTH that a valid session exists AND that the user email matches STAFF_EMAIL.
 *
 * Use this in ALL /api/staff/* route handlers instead of getSessionUser().
 * Returns the user on success, or a 401/403 NextResponse on failure.
 *
 * Usage:
 *   const result = await requireStaffUser();
 *   if (result instanceof NextResponse) return result;
 *   const user = result; // confirmed staff user
 */
export async function requireStaffUser(): Promise<{ id: string; email: string } | NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const staffEmail = process.env.STAFF_EMAIL ?? "info@true-color.ca";
  if (user.email !== staffEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { id: user.id, email: user.email };
}
