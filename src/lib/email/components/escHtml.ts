/**
 * Shared HTML escape helper — used by all email templates.
 * Extracted to avoid duplication across 6+ template files.
 */

export function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
