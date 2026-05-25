/**
 * Classify an inbound cold-outreach reply.
 *
 * Two outcomes only — kept deliberately conservative:
 *   "optout" — a clear opt-out / hard decline. Triggers full suppression
 *              (unsubscribe in tc_leads + Brevo blacklist).
 *   "reply"  — any other human reply. Pauses the cold drip and pings a human;
 *              we never auto-blacklist on an ambiguous reply.
 *
 * The principle: ANY reply stops the cold sequence. Only an unambiguous
 * opt-out also blacklists. When unsure, a human decides.
 */

export type ReplyClass = "optout" | "reply";

const OPTOUT_PATTERNS: RegExp[] = [
  /\bunsubscribe\b/,
  /\bstop (contacting|emailing|messaging)\b/,
  /\b(please )?(remove|take) me off\b/,
  /\bremove (me|us)\b/,
  /\bnot interested\b/,
  /\bno thanks\b/,
  /\bdo not (contact|email|reach)\b/,
  /\bdon'?t (contact|email) (me|us)\b/,
  /\balready (partnered|have a (vendor|supplier|printer|print shop))\b/,
  /\bwe have a (vendor|supplier|printer|guy)\b/,
  /\bleave (me|us) alone\b/,
  /\bcease( and desist)?\b/,
];

export function classifyReply(bodyText: string, subject: string): ReplyClass {
  const haystack = `${subject}\n${bodyText}`.toLowerCase();
  if (OPTOUT_PATTERNS.some((re) => re.test(haystack))) return "optout";
  return "reply";
}
