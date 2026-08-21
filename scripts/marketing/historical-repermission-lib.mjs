import crypto from "node:crypto";

export const MAX_FIRST_BATCH = 10;

export function isHistoricalCandidate(customer, completedCustomerIds, localSuppressedCustomerIds) {
  return Boolean(
    customer?.id
    && completedCustomerIds.has(customer.id)
    && typeof customer.email === "string"
    && customer.marketing_consent === null
    && !customer.consent_source
    && !customer.consent_withdrawn_at
    && !localSuppressedCustomerIds.has(customer.id),
  );
}

export function makePreferenceToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function buildCampaignHtml(siteUrl) {
  const token = "{{params.PREFERENCE_TOKEN}}";
  const keepLink = `${siteUrl}/stay-in-touch?token=${token}&choice=accept`;
  const declineLink = `${siteUrl}/stay-in-touch?token=${token}&choice=decline`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>A quick True Color update</title></head><body style="margin:0;background:#f4efe9;font-family:Arial,sans-serif;color:#1c1712"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff"><tr><td style="padding:32px"><p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#16a7d3">True Color Display Printing</p><h1 style="margin:0 0 20px;font-size:30px;line-height:1.15">A quick hello from the print shop.</h1><p style="font-size:16px;line-height:1.6">You have worked with True Color before. We are refreshing how we stay in touch, and we only want to send useful things: reorder reminders, print tips, customer showcases, seasonal ideas, and occasional promotions.</p><p style="font-size:16px;line-height:1.6">If that is useful, choose below. If not, no problem—we will leave you alone.</p><p style="margin:28px 0 14px"><a href="${keepLink}" style="display:inline-block;background:#16a7d3;border-radius:6px;padding:14px 20px;color:#fff;font-size:15px;font-weight:700;text-decoration:none">Keep me in the loop</a></p><p style="margin:0"><a href="${declineLink}" style="font-size:14px;color:#4b5563">No thanks / unsubscribe</a></p><hr style="margin:28px 0;border:0;border-top:1px solid #e5e7eb"><p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280">True Color Display Printing Ltd. · 216 33rd St W, Saskatoon, SK · info@true-color.ca</p></td></tr></table></td></tr></table></body></html>`;
}

export function assertFirstBatchCap(cap) {
  if (!Number.isInteger(cap) || cap < 1 || cap > MAX_FIRST_BATCH) {
    throw new Error(`Refusing a historical send batch above ${MAX_FIRST_BATCH}.`);
  }
}
