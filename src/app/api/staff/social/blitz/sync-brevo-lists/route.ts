/**
 * POST /api/staff/social/blitz/sync-brevo-lists
 *
 * One-time (or re-runnable) sync: pulls contacts from each Brevo HTML track list,
 * matches by email to tc_leads, and appends the niche slug to brevo_html_niches[].
 *
 * Safe to run multiple times — never adds duplicates.
 * Requires the brevo_html_niches column to exist (run migrations/add_brevo_html_niches.sql first).
 *
 * Returns: { matched: { construction: 22, ... }, unmatched: { construction: 3, ... } }
 */

import { NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Brevo list IDs for each HTML-track niche
const NICHE_LIST_MAP: Record<string, number> = {
  construction: 12,
  healthcare: 14,
  "real-estate": 11,
  retail: 15,
  events: 16,
  "non-profits": 17,
  sports: 18,
};

async function getBrevoListEmails(listId: number, apiKey: string): Promise<string[]> {
  const emails: string[] = [];
  let offset = 0;
  const limit = 500;

  while (true) {
    const res = await fetch(
      `https://api.brevo.com/v3/contacts?listId=${listId}&limit=${limit}&offset=${offset}&sort=desc`,
      { headers: { "api-key": apiKey }, cache: "no-store" }
    );
    if (!res.ok) break;

    const json = await res.json();
    const contacts: { email?: string }[] = json.contacts ?? [];
    if (contacts.length === 0) break;

    for (const c of contacts) {
      if (c.email) emails.push(c.email.toLowerCase());
    }

    if (contacts.length < limit) break;
    offset += limit;
  }

  return emails;
}

// Chunk array into batches of N
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function POST() {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const brevoKey = process.env.BREVO_API_KEY ?? "";
  if (!brevoKey) {
    return NextResponse.json({ error: "BREVO_API_KEY not set" }, { status: 500 });
  }

  const supabase = createServiceClient();
  const matched: Record<string, number> = {};
  const unmatched: Record<string, number> = {};

  for (const [nicheSlug, listId] of Object.entries(NICHE_LIST_MAP)) {
    matched[nicheSlug] = 0;
    unmatched[nicheSlug] = 0;

    const emails = await getBrevoListEmails(listId, brevoKey);
    if (emails.length === 0) continue;

    // Process in batches of 200 (Supabase .in() practical limit)
    for (const batch of chunk(emails, 200)) {
      const { data: leads } = await supabase
        .from("tc_leads")
        .select("id, email, brevo_html_niches")
        .in("email", batch);

      if (!leads) continue;

      // Track unmatched count
      unmatched[nicheSlug] += batch.length - leads.length;

      for (const lead of leads) {
        const existing: string[] = lead.brevo_html_niches ?? [];
        if (existing.includes(nicheSlug)) {
          // Already tagged — count as matched, skip update
          matched[nicheSlug]++;
          continue;
        }
        const updated = [...existing, nicheSlug];
        const { error } = await supabase
          .from("tc_leads")
          .update({ brevo_html_niches: updated })
          .eq("id", lead.id);

        if (!error) matched[nicheSlug]++;
      }
    }
  }

  return NextResponse.json({ matched, unmatched });
}
