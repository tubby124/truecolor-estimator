/**
 * Shared email header component — dark #1c1712 block with TC branding.
 * Used by all customer-facing email templates.
 */

export function emailHeader(): string {
  return `<!-- HEADER -->
        <tr>
          <td style="background:#1c1712;border-radius:12px 12px 0 0;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:13px;font-weight:600;color:#d6cfc7;letter-spacing:.08em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              True Color Display Printing
            </p>
            <p style="margin:4px 0 0;font-size:11px;color:#7a6a60;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              Saskatoon, Saskatchewan &middot; Canada
            </p>
          </td>
        </tr>`;
}
