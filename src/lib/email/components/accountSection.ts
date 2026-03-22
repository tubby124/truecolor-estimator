/**
 * Smart account CTA section for customer emails.
 * Adapts rendering based on new vs returning customer.
 *
 * New accounts: green box with magic link CTA
 * Returning accounts: subtle text link to /account
 */

import { escHtml } from "./escHtml";

export interface AccountSectionParams {
  isNewAccount: boolean;
  accountLink: string;
  customerName: string;
}

/**
 * HTML version of the account section.
 */
export function accountSection(params: AccountSectionParams): string {
  const { isNewAccount, accountLink } = params;

  if (isNewAccount) {
    return `
              <!-- New account section -->
              <div style="margin-top:24px;background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:20px 24px;text-align:center;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:.08em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                  Your Account
                </p>
                <p style="margin:0 0 14px;font-size:13px;color:#15803d;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                  We've created a free account for you at <strong>truecolorprinting.ca</strong>.<br>
                  Click below to log in instantly and view your order status, proof, and payment history.
                </p>
                <a href="${escHtml(accountLink)}"
                  style="display:inline-block;background:#16a34a;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:10px 24px;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                  View Your Order Online &rarr;
                </a>
                <p style="margin:10px 0 0;font-size:11px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                  Link valid for 1 hour. Set a permanent password anytime from your account page.
                </p>
              </div>`;
  }

  // Returning customer — subtle link
  return `
              <!-- Returning customer account link -->
              <p style="margin-top:20px;margin-bottom:0;font-size:13px;color:#6b7280;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                View this and all past orders at
                <a href="${escHtml(accountLink)}" style="color:#0369a1;text-decoration:none;font-weight:600;">truecolorprinting.ca/account</a>.
              </p>`;
}

/**
 * Plain-text version of the account section.
 */
export function accountSectionText(params: AccountSectionParams): string {
  const { isNewAccount, accountLink } = params;

  if (isNewAccount) {
    return [
      "",
      "--- YOUR ACCOUNT ---",
      "We've created a free account for you at truecolorprinting.ca.",
      `Log in instantly (link valid 1 hour): ${accountLink}`,
      "You can set a permanent password from your account page.",
      "",
    ].join("\n");
  }

  return `\nView this and all past orders: ${accountLink}\n`;
}
