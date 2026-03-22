/**
 * Lightweight "Track your order" nudge for all customer emails.
 * Appears above the footer — drives customers to their account dashboard.
 */

export function orderTrackingNudge(): string {
  return `
              <!-- Order tracking nudge -->
              <div style="margin-top:24px;padding:14px 20px;background:#f0fbff;border:1px solid #bae6fd;border-radius:8px;text-align:center;">
                <p style="margin:0;font-size:13px;color:#0c4a6e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5;">
                  Track your order anytime at
                  <a href="https://truecolorprinting.ca/account" style="color:#0369a1;font-weight:600;text-decoration:none;">truecolorprinting.ca/account</a>
                </p>
              </div>`;
}

export function orderTrackingNudgeText(): string {
  return "\nTrack your order anytime at https://truecolorprinting.ca/account\n";
}
