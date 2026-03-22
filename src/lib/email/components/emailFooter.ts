/**
 * Shared email footer component — dark #1c1712 block with contact info.
 * Used by all customer-facing email templates.
 *
 * @param extra - Optional extra line (e.g. "This is a one-time courtesy email...")
 */

export function emailFooter(extra?: string): string {
  const extraLine = extra
    ? `
            <p style="margin:0;font-size:11px;color:#7a6560;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              ${extra}
            </p>`
    : "";

  return `<!-- FOOTER -->
        <tr>
          <td style="background:#1c1712;border-radius:0 0 12px 12px;padding:24px 32px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#f5f0eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              True Color Display Printing
            </p>
            <p style="margin:0 0 4px;font-size:12px;color:#9c928a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              216 33rd St W &middot; Saskatoon, SK &middot; Canada
            </p>
            <p style="margin:0${extra ? " 0 8px" : ""};font-size:12px;color:#9c928a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <a href="tel:+13069548688" style="color:#f08080;text-decoration:none;">(306) 954-8688</a>
              &nbsp;&middot;&nbsp;
              <a href="mailto:info@true-color.ca" style="color:#f08080;text-decoration:none;">info@true-color.ca</a>
            </p>${extraLine}
          </td>
        </tr>`;
}
