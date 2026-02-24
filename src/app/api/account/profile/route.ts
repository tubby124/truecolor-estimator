/**
 * GET  /api/account/profile — return saved customer profile
 * PATCH /api/account/profile — update name/phone/address/company
 *                              and append company to saved companies[] list
 *
 * DB migration required (run once in Supabase SQL editor):
 *   ALTER TABLE customers ADD COLUMN IF NOT EXISTS companies TEXT[] DEFAULT '{}';
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dczbgraekmzirxknjvwe.supabase.co";

async function getAuthenticatedEmail(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const supabase = createClient(SUPABASE_URL, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user?.email) return null;
  return user.email.toLowerCase();
}

function getAdmin() {
  const serviceKey = process.env.SUPABASE_SECRET_KEY ?? "";
  return createClient(SUPABASE_URL, serviceKey);
}

export async function GET(req: NextRequest) {
  const email = await getAuthenticatedEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdmin();

  // Fetch base profile fields we know exist
  const { data: customer, error } = await admin
    .from("customers")
    .select("name, email, company, phone, address")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("[profile] GET error:", error.message);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }

  if (!customer) return NextResponse.json({ email });

  // Try to fetch companies[] separately (requires migration — gracefully handles missing column)
  let companies: string[] = [];
  try {
    const { data: compData } = await admin
      .from("customers")
      .select("companies")
      .eq("email", email)
      .maybeSingle();
    const raw = (compData as { companies?: unknown })?.companies;
    if (Array.isArray(raw)) companies = raw as string[];
  } catch {
    // Column not yet migrated — fall back to empty array
  }

  return NextResponse.json({
    name: customer.name ?? null,
    email: customer.email ?? email,
    company: customer.company ?? null,
    companies,
    phone: customer.phone ?? null,
    address: customer.address ?? null,
  });
}

export async function PATCH(req: NextRequest) {
  const email = await getAuthenticatedEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    name?: string;
    phone?: string;
    address?: string;
    company?: string;
  };

  const admin = getAdmin();

  // Fetch current record so we can merge the companies array
  const { data: existing } = await admin
    .from("customers")
    .select("id, company, companies")
    .eq("email", email)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name.trim() || null;
  if (body.phone !== undefined) updates.phone = body.phone.trim() || null;
  if (body.address !== undefined) updates.address = body.address.trim() || null;

  if (body.company !== undefined) {
    const newCompany = body.company.trim();
    updates.company = newCompany || null;

    if (newCompany) {
      // Append to saved companies list (deduplicated, best-effort)
      try {
        const current: string[] = Array.isArray(
          (existing as { companies?: unknown }).companies
        )
          ? ((existing as { companies: string[] }).companies)
          : [];
        if (!current.includes(newCompany)) {
          updates.companies = [...current, newCompany];
        }
      } catch {
        // companies column may not exist yet — skip
      }
    }
  }

  const { error: updateErr } = await admin
    .from("customers")
    .update(updates)
    .eq("id", existing.id);

  if (updateErr) {
    console.error("[profile] PATCH error:", updateErr.message);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
