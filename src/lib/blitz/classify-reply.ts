/**
 * Classify an inbound cold-outreach reply into one of three tiers.
 *
 *   "optout"  — unambiguous hard opt-out ("unsubscribe", "stop contacting").
 *               → unsubscribe in tc_leads + Brevo blacklist.
 *   "decline" — soft decline ("not interested", "already have a printer") with
 *               NO sign of interest. → stop the cold drip, but NO blacklist
 *               (recoverable — a human can still reach them later).
 *   "reply"   — any other human reply, OR a decline that also shows interest
 *               (a question, "but do you…", etc). → pause drip + alert a human.
 *
 * Principle: only blacklist on an unambiguous opt-out. A soft decline merely
 * stops the drip. Anything that smells like interest goes to a human — we never
 * auto-suppress a possible sale (e.g. "not interested in flyers, but do you do
 * banners?" must NOT be treated as a decline).
 */

export type ReplyClass = "optout" | "decline" | "reply";

const HARD_OPTOUT: RegExp[] = [
  /\bunsubscribe\b/,
  /\bstop (contacting|emailing|messaging)\b/,
  /\b(please )?(remove|take) (me|us) off\b/,
  /\bremove (me|us)\b/,
  /\bdo ?n['o]?t (contact|email|message) (me|us)\b/,
  /\bleave (me|us) alone\b/,
  /\bcease( and desist)?\b/,
];

const SOFT_DECLINE: RegExp[] = [
  /\bnot interested\b/,
  /\bno thanks\b/,
  /\bno need\b/,
  /\bnot (at this time|right now)\b/,
  /\balready (partnered|sorted|set)\b/,
  /\balready have a (vendor|supplier|printer|print shop|guy)\b/,
  /\bwe have a (vendor|supplier|printer|guy)\b/,
];

// Signals that a "decline" actually contains a sales opening — route to a human.
const INTEREST_SIGNALS: RegExp[] = [
  /\?/,
  /\b(do|can|could|would) you\b/,
  /\bhow much\b/,
  /\binterested in\b/,
  /\bwhat about\b/,
  /\blooking for\b/,
  /\b(price|pricing|quote|cost)\b/,
  /\bbut\b/,
  /\bhowever\b/,
];

export function classifyReply(bodyText: string, subject: string): ReplyClass {
  const haystack = `${subject}\n${bodyText}`.toLowerCase();

  if (HARD_OPTOUT.some((re) => re.test(haystack))) return "optout";

  if (SOFT_DECLINE.some((re) => re.test(haystack))) {
    // A decline that also shows interest is not a decline — let a human judge.
    if (INTEREST_SIGNALS.some((re) => re.test(haystack))) return "reply";
    return "decline";
  }

  return "reply";
}
