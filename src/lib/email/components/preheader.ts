/**
 * Inbox preview-text (preheader) snippet.
 *
 * Renders an invisible div at the top of the email body. Gmail / Apple Mail /
 * Outlook all pull the first ~85 chars of body text into the inbox preview
 * next to the subject. Without an explicit preheader, clients pull whatever
 * happens to come first — usually logo alt-text or "View in browser" links.
 *
 * The padding characters force the preheader to be the only content shown
 * (otherwise the next visible text leaks into the preview).
 *
 * Recommended: 60–90 chars. Stay under 100 to avoid mobile truncation.
 *
 * Usage: insert `${preheader("Your text here")}` right after <body> opens.
 */

export function preheader(text: string): string {
  const safe = text.replace(/[<>&"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]!)
  );
  // Zero-width / non-breaking padding pushes subsequent body text out of the
  // inbox-preview crop. Standard email-marketing trick (Litmus, Mailchimp).
  const padding = "&#847; &zwnj; &nbsp; &#8199; &#8203; ".repeat(20);
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;color:transparent;visibility:hidden;opacity:0;font-size:1px;line-height:1px;">${safe}${padding}</div>`;
}
