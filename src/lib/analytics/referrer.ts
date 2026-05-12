// Referrer source classification — detects AI search engines + standard sources.
// Maps `document.referrer` (client) or `req.headers.referer` (server) to a
// stable source slug we can persist on orders/leads and fire as MP params.

const AI_SOURCES: Array<[RegExp, string]> = [
  [/^https?:\/\/(www\.)?chatgpt\.com/i, "chatgpt"],
  [/^https?:\/\/(www\.)?chat\.openai\.com/i, "chatgpt"],
  [/^https?:\/\/(www\.)?perplexity\.ai/i, "perplexity"],
  [/^https?:\/\/(www\.)?claude\.ai/i, "claude"],
  [/^https?:\/\/(www\.)?gemini\.google\.com/i, "gemini"],
  [/^https?:\/\/(www\.)?bard\.google\.com/i, "gemini"],
  [/^https?:\/\/(www\.)?copilot\.microsoft\.com/i, "copilot"],
  [/^https?:\/\/(www\.)?bing\.com\/(chat|copilot)/i, "copilot"],
  [/^https?:\/\/(www\.)?you\.com/i, "you-com"],
  [/^https?:\/\/(www\.)?phind\.com/i, "phind"],
  [/^https?:\/\/(www\.)?duckduckgo\.com\/.*ai/i, "duckduckgo-ai"],
];

const SEARCH_SOURCES: Array<[RegExp, string]> = [
  [/^https?:\/\/(www\.)?google\./i, "google"],
  [/^https?:\/\/(www\.)?bing\.com/i, "bing"],
  [/^https?:\/\/(www\.)?duckduckgo\.com/i, "duckduckgo"],
  [/^https?:\/\/(www\.)?yahoo\.com/i, "yahoo"],
  [/^https?:\/\/(www\.)?ecosia\.org/i, "ecosia"],
  [/^https?:\/\/(www\.)?yandex\./i, "yandex"],
  [/^https?:\/\/(www\.)?baidu\.com/i, "baidu"],
];

const SOCIAL_SOURCES: Array<[RegExp, string]> = [
  [/^https?:\/\/(www\.)?(facebook|fb)\.com/i, "facebook"],
  [/^https?:\/\/(l\.)?facebook\.com/i, "facebook"],
  [/^https?:\/\/(www\.)?instagram\.com/i, "instagram"],
  [/^https?:\/\/(www\.)?l\.instagram\.com/i, "instagram"],
  [/^https?:\/\/(www\.)?linkedin\.com/i, "linkedin"],
  [/^https?:\/\/(www\.)?lnkd\.in/i, "linkedin"],
  [/^https?:\/\/(www\.)?(twitter|x)\.com/i, "twitter"],
  [/^https?:\/\/(www\.)?t\.co/i, "twitter"],
  [/^https?:\/\/(www\.)?reddit\.com/i, "reddit"],
  [/^https?:\/\/(www\.)?tiktok\.com/i, "tiktok"],
  [/^https?:\/\/(www\.)?pinterest\./i, "pinterest"],
  [/^https?:\/\/(www\.)?youtube\.com/i, "youtube"],
  [/^https?:\/\/(www\.)?youtu\.be/i, "youtube"],
];

const LOCAL_SOURCES: Array<[RegExp, string]> = [
  [/maps\.google\./i, "google-maps"],
  [/google\.com\/maps/i, "google-maps"],
  [/local\.google\./i, "google-maps"],
];

const SELF_HOSTS = /truecolorprinting\.ca|true-color\.ca/i;

export interface ReferrerClassification {
  source: string;          // chatgpt, google, facebook, direct, internal, etc.
  medium: string;          // ai-search, organic, social, referral, direct, internal
  raw_referrer: string | null;
}

export function classifyReferrer(referrerInput: string | null | undefined): ReferrerClassification {
  const ref = (referrerInput ?? "").trim();
  if (!ref) return { source: "direct", medium: "direct", raw_referrer: null };
  if (SELF_HOSTS.test(ref)) return { source: "internal", medium: "internal", raw_referrer: ref };

  for (const [re, slug] of AI_SOURCES) {
    if (re.test(ref)) return { source: slug, medium: "ai-search", raw_referrer: ref };
  }
  for (const [re, slug] of LOCAL_SOURCES) {
    if (re.test(ref)) return { source: slug, medium: "local", raw_referrer: ref };
  }
  for (const [re, slug] of SEARCH_SOURCES) {
    if (re.test(ref)) return { source: slug, medium: "organic", raw_referrer: ref };
  }
  for (const [re, slug] of SOCIAL_SOURCES) {
    if (re.test(ref)) return { source: slug, medium: "social", raw_referrer: ref };
  }

  // Unknown external referrer — preserve hostname only
  try {
    const host = new URL(ref).hostname;
    return { source: host, medium: "referral", raw_referrer: ref };
  } catch {
    return { source: "unknown", medium: "referral", raw_referrer: ref };
  }
}

export function classifyFromHeaders(headers: Headers): ReferrerClassification {
  return classifyReferrer(headers.get("referer") ?? headers.get("referrer"));
}
