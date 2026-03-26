/**
 * GET /api/cron/stale-quotes
 *
 * Finds quote requests that have not been replied to in over 24 hours
 * and sends a summary alert to staff.
 *
 * Schedule: run every hour via Railway cron or external scheduler.
 * Auth: Authorization: Bearer ${CRON_SECRET}
 *
 * Set CRON_SECRET in Railway → Variables.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/smtp";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (req.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: stale, error } = await supabase
      .from("quote_requests")
      .select("id, name, email, created_at, items")
      .is("replied_at", null)
      .lt("created_at", cutoff)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[stale-quotes] query failed:", error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const count = stale?.length ?? 0;
    if (count === 0) {
      return NextResponse.json({ ok: true, stale: 0 });
    }

    // Build email
    const staffEmail = process.env.STAFF_EMAIL ?? "info@true-color.ca";
    const from =
      process.env.QUOTE_FROM_EMAIL ??
      "True Color Display Printing <hello@outreach.true-color.ca>";

    const rows = (stale ?? [])
      .map((q) => {
        const hoursAgo = Math.round(
          (Date.now() - new Date(q.created_at).getTime()) / 3_600_000
        );
        const firstItem = Array.isArray(q.items) && q.items.length > 0
          ? (q.items[0] as { product?: string })?.product ?? "Custom quote"
          : "Custom quote";
        return `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">${esc(q.name)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;"><a href="mailto:${esc(q.email)}" style="color:#16C2F3;">${esc(q.email)}</a></td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">${esc(firstItem)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#e52222;font-weight:600;">${hoursAgo}h ago</td>
          </tr>`;
      })
      .join("");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
        <div style="background:#1c1712;padding:20px 30px;">
          <h1 style="color:#16C2F3;font-size:18px;margin:0;">
            ⚠️ ${count} Quote${count !== 1 ? "s" : ""} Waiting for Reply
          </h1>
        </div>
        <div style="padding:24px 30px;background:#fff;">
          <p style="color:#444;font-size:14px;">
            The following quote request${count !== 1 ? "s have" : " has"} not been replied to in over 24 hours.
            <a href="https://truecolorprinting.ca/staff/quotes" style="color:#16C2F3;font-weight:600;">Open quote dashboard →</a>
          </p>
          <table style="width:100%;border-collapse:collapse;margin-top:12px;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Name</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Email</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Product</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Age</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div style="background:#f4efe9;padding:14px 30px;font-size:12px;color:#888;">
          This alert fires when quotes go unreplied for 24+ hours. To stop it, reply in the
          <a href="https://truecolorprinting.ca/staff/quotes" style="color:#16C2F3;">staff dashboard</a>.
        </div>
      </div>`;

    await sendEmail({
      from,
      to: staffEmail,
      subject: `⚠️ ${count} quote${count !== 1 ? "s" : ""} waiting 24h+ — True Color`,
      html,
      text: `${count} quote(s) have not been replied to in over 24 hours.\n\n` +
        (stale ?? []).map((q) => `- ${q.name} <${q.email}>`).join("\n") +
        `\n\nOpen dashboard: https://truecolorprinting.ca/staff/quotes`,
    });

    console.log(`[stale-quotes] alert sent — ${count} stale quote(s)`);
    return NextResponse.json({ ok: true, stale: count });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stale-quotes cron failed";
    console.error("[stale-quotes]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
