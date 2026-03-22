/**
 * src/lib/email/supabaseAuthTemplates.ts
 *
 * Branded HTML email templates for Supabase Auth emails.
 * These strings are pasted directly into the Supabase Dashboard.
 *
 * ─── HOW TO DEPLOY ────────────────────────────────────────────────────────────
 *
 * 1. Open: https://supabase.com/dashboard → Your Project → Authentication → Email Templates
 *
 * 2. For each template type, paste the corresponding exported string below:
 *
 *    CONFIRM SIGNUP   → use confirmationEmailHtml
 *    MAGIC LINK       → use magicLinkEmailHtml
 *    RESET PASSWORD   → use passwordResetEmailHtml
 *    INVITE USER      → use inviteEmailHtml
 *
 * 3. In the Supabase editor, set:
 *    - Subject line    (see SUBJECT_LINES export below)
 *    - Body (HTML)     → paste the template string
 *
 * 4. Supabase replaces {{ .ConfirmationURL }} with the real one-time link at send time.
 *    Do NOT change or escape that placeholder — leave it exactly as written.
 *
 * 5. To preview a template locally before pasting, call the matching previewHtml()
 *    helper function — it substitutes a dummy link so you can view the result.
 *
 * ─── NOTES ────────────────────────────────────────────────────────────────────
 *
 * - All templates use the same header/footer as transactional emails.
 * - No external dependencies or runtime variables — pure static strings.
 * - The Supabase Dashboard editor expects raw HTML — do NOT JSON-encode.
 *
 */

import { emailHeader } from "./components/emailHeader";
import { emailFooter } from "./components/emailFooter";

// ─── Shared layout wrapper ────────────────────────────────────────────────────

function wrapInLayout(title: string, bodyRows: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4efe9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background-color:#f4efe9;padding:32px 16px;">
    <tr>
      <td align="center">

        <table role="presentation" width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

          ${emailHeader()}

          ${bodyRows}

          ${emailFooter()}

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─── Shared CTA button ────────────────────────────────────────────────────────

function ctaButton(label: string, href: string, color = "#16C2F3"): string {
  return `<a href="${href}"
    style="display:inline-block;background:${color};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    ${label}
  </a>`;
}

// ─── Shared fallback link note ────────────────────────────────────────────────

function fallbackLinkNote(href: string): string {
  return `<p style="margin:16px 0 0;font-size:11px;color:#9ca3af;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    Button not working? Copy and paste this link into your browser:<br />
    <span style="word-break:break-all;color:#6b7280;">${href}</span>
  </p>`;
}

// ─── Shared hero block ────────────────────────────────────────────────────────

function heroBlock(opts: {
  accentColor: string;
  iconChar: string;
  heading: string;
  subtext: string;
}): string {
  const { accentColor, iconChar, heading, subtext } = opts;
  return `<!-- HERO -->
          <tr>
            <td style="background:#ffffff;padding:36px 32px 24px;text-align:center;border-top:3px solid ${accentColor};">
              <div style="display:inline-block;width:50px;height:50px;background:${accentColor};border-radius:50%;line-height:50px;text-align:center;margin-bottom:16px;">
                <span style="font-size:24px;color:#ffffff;line-height:50px;display:inline-block;">${iconChar}</span>
              </div>
              <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                ${heading}
              </h1>
              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                ${subtext}
              </p>
            </td>
          </tr>`;
}

// ─── 1. CONFIRM SIGNUP ────────────────────────────────────────────────────────

function buildConfirmationEmailHtml(confirmationUrl: string): string {
  const bodyRows = `
          ${heroBlock({
            accentColor: "#16C2F3",
            iconChar: "&#10003;",
            heading: "Confirm your email address",
            subtext: "Thanks for creating an account with True Color Display Printing. Click below to verify your email and activate your account.",
          })}

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:24px 32px 36px;text-align:center;">

              <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                Once confirmed, you can track orders, view proofs, and reorder — all from your account dashboard at
                <a href="https://truecolorprinting.ca/account" style="color:#16C2F3;text-decoration:none;font-weight:600;">truecolorprinting.ca</a>.
              </p>

              ${ctaButton("Confirm my email &rarr;", confirmationUrl)}

              ${fallbackLinkNote(confirmationUrl)}

              <hr style="border:none;border-top:1px solid #f0ebe4;margin:28px 0;" />

              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                If you did not create an account, you can safely ignore this email.
                This link expires in 24&nbsp;hours.
              </p>

            </td>
          </tr>`;

  return wrapInLayout("Confirm your email — True Color Display Printing", bodyRows);
}

// ─── 2. MAGIC LINK ────────────────────────────────────────────────────────────

function buildMagicLinkEmailHtml(confirmationUrl: string): string {
  const bodyRows = `
          ${heroBlock({
            accentColor: "#16C2F3",
            iconChar: "&#9889;",
            heading: "Your sign-in link",
            subtext: "Click below to sign in to your True Color Display Printing account — no password needed.",
          })}

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:24px 32px 36px;text-align:center;">

              <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                This is a one-time link. It will take you directly to your account at
                <a href="https://truecolorprinting.ca/account" style="color:#16C2F3;text-decoration:none;font-weight:600;">truecolorprinting.ca</a>
                where you can view your orders, proofs, and payment history.
              </p>

              ${ctaButton("Sign in to my account &rarr;", confirmationUrl)}

              ${fallbackLinkNote(confirmationUrl)}

              <hr style="border:none;border-top:1px solid #f0ebe4;margin:28px 0;" />

              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                If you did not request this link, you can safely ignore this email.
                This link expires in 1&nbsp;hour and can only be used once.
              </p>

            </td>
          </tr>`;

  return wrapInLayout("Sign-in link — True Color Display Printing", bodyRows);
}

// ─── 3. PASSWORD RESET ────────────────────────────────────────────────────────

function buildPasswordResetEmailHtml(confirmationUrl: string): string {
  const bodyRows = `
          ${heroBlock({
            accentColor: "#e52222",
            iconChar: "&#128274;",
            heading: "Reset your password",
            subtext: "We received a request to reset the password on your True Color Display Printing account.",
          })}

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:24px 32px 36px;text-align:center;">

              <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                Click the button below to choose a new password. This link is valid for
                <strong>1&nbsp;hour</strong> and can only be used once.
              </p>

              ${ctaButton("Reset my password &rarr;", confirmationUrl, "#e52222")}

              ${fallbackLinkNote(confirmationUrl)}

              <hr style="border:none;border-top:1px solid #f0ebe4;margin:28px 0;" />

              <div style="background:#fdf4f4;border:1px solid #f0bfbb;border-radius:8px;padding:14px 16px;text-align:left;">
                <p style="margin:0;font-size:13px;color:#7a1818;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                  Did not request a password reset? Your account is safe — no action is needed.
                  If you are concerned, contact us at
                  <a href="mailto:info@true-color.ca" style="color:#e52222;font-weight:600;text-decoration:none;">info@true-color.ca</a>.
                </p>
              </div>

            </td>
          </tr>`;

  return wrapInLayout("Reset your password — True Color Display Printing", bodyRows);
}

// ─── 4. INVITE ────────────────────────────────────────────────────────────────

function buildInviteEmailHtml(confirmationUrl: string): string {
  const bodyRows = `
          ${heroBlock({
            accentColor: "#16C2F3",
            iconChar: "&#9993;",
            heading: "You have been invited",
            subtext: "You have been invited to join the True Color Display Printing staff portal.",
          })}

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:24px 32px 36px;text-align:center;">

              <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                Click below to accept the invitation and set your password. You will have access to the
                staff portal at
                <a href="https://truecolorprinting.ca/staff" style="color:#16C2F3;text-decoration:none;font-weight:600;">truecolorprinting.ca/staff</a>
                where you can manage orders, proofs, and customer requests.
              </p>

              ${ctaButton("Accept invitation &rarr;", confirmationUrl)}

              ${fallbackLinkNote(confirmationUrl)}

              <hr style="border:none;border-top:1px solid #f0ebe4;margin:28px 0;" />

              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                This invitation link expires in 24&nbsp;hours. If you were not expecting this
                invitation, contact us at
                <a href="mailto:info@true-color.ca" style="color:#9ca3af;">info@true-color.ca</a>.
              </p>

            </td>
          </tr>`;

  return wrapInLayout("Staff invitation — True Color Display Printing", bodyRows);
}

// ─── Exported template strings (paste these into Supabase Dashboard) ──────────

/**
 * Supabase Auth → Email Templates → Confirm signup
 * Subject line: Confirm your email — True Color Display Printing
 */
export const confirmationEmailHtml: string =
  buildConfirmationEmailHtml("{{ .ConfirmationURL }}");

/**
 * Supabase Auth → Email Templates → Magic Link
 * Subject line: Your sign-in link — True Color Display Printing
 */
export const magicLinkEmailHtml: string =
  buildMagicLinkEmailHtml("{{ .ConfirmationURL }}");

/**
 * Supabase Auth → Email Templates → Reset Password
 * Subject line: Reset your password — True Color Display Printing
 */
export const passwordResetEmailHtml: string =
  buildPasswordResetEmailHtml("{{ .ConfirmationURL }}");

/**
 * Supabase Auth → Email Templates → Invite User
 * Subject line: You have been invited — True Color Display Printing
 */
export const inviteEmailHtml: string =
  buildInviteEmailHtml("{{ .ConfirmationURL }}");

// ─── Subject lines (paste into Supabase Dashboard "Subject" field) ────────────

export const SUBJECT_LINES = {
  confirmSignup: "Confirm your email — True Color Display Printing",
  magicLink: "Your sign-in link — True Color Display Printing",
  resetPassword: "Reset your password — True Color Display Printing",
  invite: "You have been invited — True Color Display Printing",
} as const;

// ─── Preview helpers (local development use only) ─────────────────────────────

const PREVIEW_URL = "https://truecolorprinting.ca/account?preview=1";

export const previewHtml = {
  confirmation: (): string => buildConfirmationEmailHtml(PREVIEW_URL),
  magicLink: (): string => buildMagicLinkEmailHtml(PREVIEW_URL),
  passwordReset: (): string => buildPasswordResetEmailHtml(PREVIEW_URL),
  invite: (): string => buildInviteEmailHtml(PREVIEW_URL),
} as const;
