// Restore the approved conversion-goal graph and create the two missing browser-side
// PHONE_CALL_LEAD actions.
//
// WHY THIS EXISTS AS ITS OWN FILE
// -------------------------------
// Mutation authority in this repo is split one verb per named file (see gaql-read.mjs):
//   ENABLE a campaign        -> enable-stage-one.mjs
//   PAUSE a campaign         -> hard-stop-monitor.mjs
//   CREATE contract children -> apply-sync.mjs
//   SYNC extension assets    -> apply-assets.mjs
//   REMOVE a migrated keyword-> remove-migrated-keywords.mjs
// None of them may touch conversion measurement, and none of them should: a conversion action
// is the only object in the account that can change what the bidder optimises for. This file is
// the sixth authority and its power is exactly one noun — CONVERSION MEASUREMENT (actions and
// the customer goals derived from them). It cannot touch campaigns, budgets, bids, ads,
// keywords, or assets.
//
// WHAT WENT WRONG, AND WHY THE ALLOWLIST IS SHAPED LIKE THIS
// ----------------------------------------------------------
// 2026-08-16: the owner created quote_submit_qualified (7723019984) in the redesigned Google Ads
// UI, which forced primary_for_goal=true. Because all three campaigns inherit goals at CUSTOMER
// level, one primary SUBMIT_LEAD_FORM action made the customer-level "Submit lead form" goal
// biddable on the customer AND on every campaign. The live verifier went UNSAFE on three
// separate checks at once. The config was then edited to MATCH the accident instead of to
// correct it (commit 1836242) — recording the accident as the intent.
//
// So every operation below is written as {id, field, from, to}: the value it EXPECTS to find,
// and the value it will write. If the account does not currently hold `from`, the op is SKIPPED,
// not forced. That makes this script safe to re-run and impossible to use as a general-purpose
// conversion editor.
//
// Run: railway run node scripts/google-ads/apply-conversion-actions.mjs            (dry run)
//      railway run node scripts/google-ads/apply-conversion-actions.mjs --execute  (apply)

import { HARD_STOP_CUSTOMER_ID, HARD_STOP_LOGIN_CUSTOMER_ID } from "./hard-stop-contract.mjs";

const V = "v24";
const CUSTOMER = HARD_STOP_CUSTOMER_ID;

// ── the allowlist ────────────────────────────────────────────────────────────
// Hand-written, one entry per known drift. Deriving "what the contract says minus what is live"
// would let a config typo silently re-point revenue measurement.
const ACTION_OPS = [
  {
    id: "7723019984",
    name: "quote_submit_qualified",
    field: "primaryForGoal",
    from: true,
    to: false,
    // include_in_conversions_metric is deliberately NOT set. Google deprecated it in favour of
    // primary_for_goal and drops the action out of the Conversions column on its own when the
    // action stops being primary. Writing both would be writing the same intent twice, and the
    // deprecated field is the one that loses.
    note: "secondary until the documented promotionGate; a quote submission is a lead, not revenue",
  },
  {
    id: "7721413630",
    name: "generate_lead (GA4 import)",
    field: "status",
    from: "HIDDEN",
    to: "ENABLED",
    note: "make the GA4 lead import visible in reporting",
  },
  {
    id: "7721413630",
    name: "generate_lead (GA4 import)",
    field: "primaryForGoal",
    from: true,
    to: false,
    // 2026-08-16 dry run: this action already reads primary_for_goal=false live, so this op
    // SKIPS. It is kept as a standing guard — un-hiding a GA4 import is exactly the moment
    // Google's UI is most likely to offer to make it primary, and the skip line is free.
    // docs/paid-search/ADS-CONVERSION-GAP-MEMO.md forbids a GA4 import from ever being primary:
    // GA4 attribution and Google Ads attribution disagree, so a primary import double-counts
    // against the UPLOAD_CLICKS revenue actions this account actually bids on.
    note: "GA4 imports are never primary — the memo forbids it",
  },
];

// CustomerConversionGoalService supports UPDATE only (no create, no remove) and the resource
// name is {category}~{origin}. Campaigns sit at CUSTOMER goal config level, so flipping the
// customer goal is the ONLY write needed — the three campaign goals follow, and the readback
// below proves it rather than assuming it.
const GOAL_OPS = [
  {
    category: "SUBMIT_LEAD_FORM",
    origin: "WEBSITE",
    from: true,
    to: false,
    required: true,
    note: "only purchase_online and quote_won may influence bidding",
  },
  {
    category: "PHONE_CALL_LEAD",
    origin: "WEBSITE",
    from: true,
    to: false,
    // Conditional. This goal does not exist until the two WEBSITE-origin call actions below are
    // created; Google materialises the category~origin goal on first use and it can arrive
    // biddable. If it is absent or already false this op is skipped.
    required: false,
    note: "browser-side call actions must not create a biddable goal",
  },
];

// Idempotent by NAME. If an action with this name already exists the create is skipped and the
// live one is read back instead, so a re-run after a partial failure cannot double-create.
const ACTIONS_TO_CREATE = [
  {
    name: "qualified_call_website_60s",
    payload: {
      name: "qualified_call_website_60s",
      type: "WEBSITE_CALL",
      category: "PHONE_CALL_LEAD",
      status: "ENABLED",
      countingType: "ONE_PER_CLICK",
      phoneCallDurationSeconds: "60",
      clickThroughLookbackWindowDays: "30",
      // viewThroughLookbackWindowDays deliberately ABSENT — Google returns VALUE_MUST_BE_UNSET for
      // WEBSITE_CALL (verified against the live API 2026-08-16).
      primaryForGoal: false,
      valueSettings: { defaultValue: 0, defaultCurrencyCode: "CAD", alwaysUseDefaultValue: true },
    },
    envVar: "GOOGLE_ADS_WEBSITE_CALL_CONVERSION_ACTION_ID",
    labelEnvVar: "NEXT_PUBLIC_GOOGLE_ADS_WEBSITE_CALL_LABEL",
  },
  {
    name: "click_to_call_intent",
    payload: {
      name: "click_to_call_intent",
      type: "WEBPAGE",
      category: "PHONE_CALL_LEAD",
      status: "ENABLED",
      countingType: "ONE_PER_CLICK",
      // phoneCallDurationSeconds is deliberately ABSENT. It is a call-tracker concept; the v24
      // reference documents no behaviour for it on a WEBPAGE action, and a tel: tap has no
      // duration to qualify. Sending it would be inventing a field's meaning.
      clickThroughLookbackWindowDays: "30",
      primaryForGoal: false,
      valueSettings: { defaultValue: 0, defaultCurrencyCode: "CAD", alwaysUseDefaultValue: true },
    },
    envVar: null,
    labelEnvVar: "NEXT_PUBLIC_GOOGLE_ADS_CLICK_TO_CALL_LABEL",
  },
];

const args = process.argv.slice(2);
for (const arg of args) if (arg !== "--execute") throw new Error(`Unknown argument: ${arg}`);
const execute = args.includes("--execute");

for (const name of ["GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_DEVELOPER_TOKEN"]) {
  if (!process.env[name]) throw new Error(`${name} is required — run through "railway run"`);
}

const token = await (async () => {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  if (!r.ok) throw new Error(`token refresh failed: HTTP ${r.status}`);
  return (await r.json()).access_token;
})();

const headers = {
  authorization: `Bearer ${token}`,
  "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  "login-customer-id": HARD_STOP_LOGIN_CUSTOMER_ID,
  "content-type": "application/json",
};

const search = async (query, label) => {
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUSTOMER}/googleAds:search`, {
    method: "POST", headers, body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error(`${label} failed: HTTP ${r.status} ${(await r.text()).slice(0, 400)}`);
  return (await r.json()).results ?? [];
};
const mutate = async (path, body, label) => {
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUSTOMER}/${path}`, {
    method: "POST", headers, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${label} failed: HTTP ${r.status} ${(await r.text()).slice(0, 4000)}`);
  return r.json();
};

const ACTION_QUERY =
  "SELECT conversion_action.id, conversion_action.name, conversion_action.status, "
  + "conversion_action.type, conversion_action.category, conversion_action.origin, "
  + "conversion_action.primary_for_goal, conversion_action.include_in_conversions_metric, "
  + "conversion_action.counting_type, conversion_action.phone_call_duration_seconds, "
  + "conversion_action.click_through_lookback_window_days, "
  + "conversion_action.view_through_lookback_window_days, "
  + "conversion_action.value_settings.default_value, "
  + "conversion_action.value_settings.default_currency_code, "
  + "conversion_action.value_settings.always_use_default_value, "
  + "conversion_action.tag_snippets FROM conversion_action";
const CUSTOMER_GOAL_QUERY =
  "SELECT customer_conversion_goal.resource_name, customer_conversion_goal.category, "
  + "customer_conversion_goal.origin, customer_conversion_goal.biddable FROM customer_conversion_goal";
const CAMPAIGN_GOAL_QUERY =
  "SELECT campaign.name, campaign_conversion_goal.category, campaign_conversion_goal.origin, "
  + "campaign_conversion_goal.biddable FROM campaign_conversion_goal";

const readState = async () => {
  const [actionRows, customerGoalRows, campaignGoalRows] = await Promise.all([
    search(ACTION_QUERY, "conversion actions"),
    search(CUSTOMER_GOAL_QUERY, "customer conversion goals"),
    search(CAMPAIGN_GOAL_QUERY, "campaign conversion goals"),
  ]);
  return {
    actions: actionRows.map((row) => row.conversionAction),
    customerGoals: customerGoalRows.map((row) => row.customerConversionGoal),
    campaignGoals: campaignGoalRows.map((row) => ({
      campaign: row.campaign?.name,
      ...row.campaignConversionGoal,
    })),
  };
};

// ── preconditions, fail closed ───────────────────────────────────────────────
const account = (await search("SELECT customer.id, customer.currency_code, customer.time_zone FROM customer LIMIT 1", "account"))[0]?.customer ?? {};
if (account.id !== CUSTOMER || account.currencyCode !== "CAD" || account.timeZone !== "America/Regina") {
  throw new Error(`ABORT — wrong account: ${account.id} ${account.currencyCode} ${account.timeZone}`);
}
console.log(`account: ${account.id} ${account.currencyCode} ${account.timeZone}\n`);

const before = await readState();
const actionById = new Map(before.actions.map((action) => [String(action.id), action]));
const actionByName = new Map(before.actions.map((action) => [action.name, action]));
const customerGoalKey = (goal) => `${goal.category}~${goal.origin}`;
const customerGoalMap = new Map(before.customerGoals.map((goal) => [customerGoalKey(goal), goal]));

// ── plan ─────────────────────────────────────────────────────────────────────
const plannedActionUpdates = [];
const skipped = [];
skipped.push("action 7688596965 About Us (WEBPAGE_CODELESS) — Google returns MUTATE_NOT_ALLOWED for auto-created actions; remove it in the Ads UI (Goals → Conversions → About Us → Remove) or disable auto-created conversions");
for (const op of ACTION_OPS) {
  const live = actionById.get(op.id);
  if (!live) { skipped.push(`action ${op.id} (${op.name}) — not present in the account`); continue; }
  const current = live[op.field];
  if (current === op.to) { skipped.push(`action ${op.id}.${op.field} — already ${JSON.stringify(op.to)}`); continue; }
  if (current !== op.from) {
    skipped.push(`action ${op.id}.${op.field} — REFUSED, expected ${JSON.stringify(op.from)} but found ${JSON.stringify(current)}`);
    continue;
  }
  plannedActionUpdates.push({ ...op, current });
}

const plannedGoalUpdates = [];
for (const op of GOAL_OPS) {
  const key = `${op.category}~${op.origin}`;
  const live = customerGoalMap.get(key);
  if (!live) {
    (op.required ? skipped : skipped).push(`goal ${key} — not present${op.required ? " (REQUIRED, investigate)" : " (conditional, fine)"}`);
    continue;
  }
  const current = live.biddable === true;
  if (current === op.to) { skipped.push(`goal ${key}.biddable — already ${op.to}`); continue; }
  if (current !== op.from) { skipped.push(`goal ${key}.biddable — REFUSED, expected ${op.from} but found ${current}`); continue; }
  plannedGoalUpdates.push({ ...op, key, resourceName: live.resourceName });
}

const plannedCreates = ACTIONS_TO_CREATE.filter((item) => {
  if (!actionByName.has(item.name)) return true;
  skipped.push(`create ${item.name} — already exists as ${actionByName.get(item.name).id}`);
  return false;
});

console.log("PLAN");
for (const op of plannedActionUpdates) console.log(`  ~ action ${op.id} ${op.name}: ${op.field} ${JSON.stringify(op.current)} -> ${JSON.stringify(op.to)}  (${op.note})`);
for (const op of plannedGoalUpdates) console.log(`  ~ customer goal ${op.key}: biddable ${op.from} -> ${op.to}  (${op.note})`);
for (const item of plannedCreates) console.log(`  + create conversion action ${item.name} (${item.payload.type}/${item.payload.category})`);
for (const reason of skipped) console.log(`  · skip ${reason}`);

const totalOps = plannedActionUpdates.length + plannedGoalUpdates.length + plannedCreates.length;
if (!execute) {
  console.log(`\nDRY RUN — ${totalOps} operation(s) planned, nothing was changed. Re-run with --execute to apply.`);
  console.log(JSON.stringify({
    mode: "DRY_RUN",
    customerId: CUSTOMER,
    plannedActionUpdates: plannedActionUpdates.map(({ id, name, field, current, to }) => ({ id, name, field, from: current, to })),
    plannedGoalUpdates: plannedGoalUpdates.map(({ key, from, to }) => ({ goal: key, from, to })),
    plannedCreates: plannedCreates.map((item) => item.name),
    skipped,
  }, null, 2));
  process.exit(0);
}
if (!totalOps) { console.log("\nNothing to do."); process.exit(0); }

// ── apply ────────────────────────────────────────────────────────────────────
// Order matters. The action updates come first so the goal graph settles before the goal write,
// and the creates come last so a new WEBSITE-origin call goal is visible to the readback.
if (plannedActionUpdates.length) {
  await mutate("conversionActions:mutate", {
    // status=REMOVED is not settable via update — Google requires a `remove` operation.
    operations: plannedActionUpdates.map((op) =>
      op.field === "status" && op.to === "REMOVED"
        ? { remove: `customers/${CUSTOMER}/conversionActions/${op.id}` }
        : {
            updateMask: op.field === "primaryForGoal" ? "primary_for_goal" : "status",
            update: { resourceName: `customers/${CUSTOMER}/conversionActions/${op.id}`, [op.field]: op.to },
          }),
    partialFailure: false,
  }, "conversion action update");
  console.log(`\nupdated ${plannedActionUpdates.length} conversion action field(s)`);
}

if (plannedGoalUpdates.length) {
  await mutate("customerConversionGoals:mutate", {
    operations: plannedGoalUpdates.map((op) => ({
      updateMask: "biddable",
      update: { resourceName: op.resourceName, biddable: op.to },
    })),
  }, "customer conversion goal update");
  console.log(`updated ${plannedGoalUpdates.length} customer conversion goal(s)`);
}

const createdIds = [];
if (plannedCreates.length) {
  const result = await mutate("conversionActions:mutate", {
    operations: plannedCreates.map((item) => ({ create: item.payload })),
    partialFailure: false,
  }, "conversion action create");
  (result.results ?? []).forEach((row, index) => {
    createdIds.push({ name: plannedCreates[index].name, resourceName: row.resourceName, id: String(row.resourceName ?? "").split("/").pop() });
  });
  console.log(`created ${createdIds.length} conversion action(s)`);
}

// A newly created WEBSITE-origin PHONE_CALL_LEAD action can materialise a biddable
// PHONE_CALL_LEAD~WEBSITE customer goal. Re-check and flip it in the same run, or the live
// verifier goes UNSAFE on "purchase website must be the only biddable customer conversion goal"
// the moment the creates land.
const afterCreateGoals = (await search(CUSTOMER_GOAL_QUERY, "customer conversion goals (post-create)"))
  .map((row) => row.customerConversionGoal);
const strayBiddable = afterCreateGoals.filter(
  (goal) => goal.biddable === true && customerGoalKey(goal) !== "PURCHASE~WEBSITE",
);
if (strayBiddable.length) {
  await mutate("customerConversionGoals:mutate", {
    operations: strayBiddable.map((goal) => ({
      updateMask: "biddable",
      update: { resourceName: goal.resourceName, biddable: false },
    })),
  }, "stray biddable goal cleanup");
  console.log(`cleared ${strayBiddable.length} stray biddable customer goal(s): ${strayBiddable.map(customerGoalKey).join(", ")}`);
}

// ── readback ─────────────────────────────────────────────────────────────────
const after = await readState();
const afterById = new Map(after.actions.map((action) => [String(action.id), action]));
const afterByName = new Map(after.actions.map((action) => [action.name, action]));

const problems = [];
for (const op of plannedActionUpdates) {
  const live = afterById.get(op.id);
  // A REMOVED action still reads back from conversion_action (the resource is not deleted), so
  // an absent row is only acceptable for the removal op.
  if (!live) {
    if (op.to !== "REMOVED") problems.push(`action ${op.id} disappeared after the update`);
    continue;
  }
  if (live[op.field] !== op.to) problems.push(`action ${op.id}.${op.field} read back ${JSON.stringify(live[op.field])}, expected ${JSON.stringify(op.to)}`);
}
// Google drops a non-primary action out of the Conversions column on its own. Prove it rather
// than assume it — this is the exact claim the plan makes and it must be verified, not trusted.
const quoteLead = afterById.get("7723019984");
if (quoteLead && quoteLead.includeInConversionsMetric === true) {
  problems.push("quote_submit_qualified is still included in the Conversions metric after primary_for_goal=false — set include_in_conversions_metric explicitly and re-run");
}

const biddableCustomerGoals = after.customerGoals.filter((goal) => goal.biddable === true);
if (biddableCustomerGoals.length !== 1 || customerGoalKey(biddableCustomerGoals[0]) !== "PURCHASE~WEBSITE") {
  problems.push(`biddable customer goals are ${biddableCustomerGoals.map(customerGoalKey).join(",") || "none"}, expected PURCHASE~WEBSITE only`);
}
// Campaigns inherit at CUSTOMER goal level, so this must follow the customer write with no
// separate campaign mutation. Verifying it is the whole point of reading campaign goals.
const biddableCampaignGoals = after.campaignGoals.filter((goal) => goal.biddable === true);
const badCampaignGoals = biddableCampaignGoals.filter((goal) => customerGoalKey(goal) !== "PURCHASE~WEBSITE");
if (badCampaignGoals.length) {
  problems.push(`campaign goals did not follow the customer write: ${badCampaignGoals.map((goal) => `${goal.campaign}:${customerGoalKey(goal)}`).join(", ")}`);
}

// ── tag snippets: print the AW-.../LABEL pair for each created action ────────
// WEBPAGE snippets carry the label as `'send_to': 'AW-.../LABEL'`; the WEBSITE_CALL snippet
// carries it as the first argument of a `gtag('config', 'AW-.../LABEL', {...})` call. Match
// either — the label is the same shape in both.
const SEND_TO = /(?:'send_to'\s*:\s*|gtag\(\s*'config'\s*,\s*)'(AW-\d+)\/([\w-]+)'/;
const destinations = [];
for (const item of ACTIONS_TO_CREATE) {
  const live = afterByName.get(item.name);
  if (!live) { problems.push(`created action ${item.name} is missing from the readback`); continue; }
  const snippets = live.tagSnippets ?? [];
  const parsed = snippets
    .map((snippet) => {
      const match = SEND_TO.exec(`${snippet.eventSnippet ?? ""}\n${snippet.globalSiteTag ?? ""}`);
      return match ? { snippetType: snippet.type, conversionId: match[1], label: match[2], sendTo: `${match[1]}/${match[2]}` } : null;
    })
    .filter(Boolean);
  if (!parsed.length) problems.push(`no send_to destination could be parsed from ${item.name} tag_snippets`);
  for (const entry of parsed) {
    console.log(`\n${item.name}  [${entry.snippetType}]  send_to = ${entry.sendTo}`);
    if (item.labelEnvVar) console.log(`  ${item.labelEnvVar}=${entry.sendTo}`);
  }
  if (item.envVar) console.log(`  ${item.envVar}=${live.id}`);
  destinations.push({
    name: item.name,
    actionId: String(live.id),
    envVar: item.envVar,
    labelEnvVar: item.labelEnvVar,
    tagSnippets: parsed,
  });
}

const summary = {
  mode: "EXECUTED",
  customerId: CUSTOMER,
  appliedActionUpdates: plannedActionUpdates.map(({ id, name, field, current, to }) => ({ id, name, field, from: current, to })),
  appliedGoalUpdates: plannedGoalUpdates.map(({ key, from, to }) => ({ goal: key, from, to })),
  strayBiddableGoalsCleared: strayBiddable.map(customerGoalKey),
  created: destinations,
  biddableCustomerGoals: biddableCustomerGoals.map(customerGoalKey),
  biddableCampaignGoals: biddableCampaignGoals.map((goal) => `${goal.campaign}:${customerGoalKey(goal)}`),
  skipped,
  readbackProblems: problems,
  readback: problems.length ? "FAILED" : "CLEAN",
};
console.log(`\n${JSON.stringify(summary, null, 2)}`);
if (problems.length) {
  console.error("\nreadback FAILED — live conversion state does not match the plan");
  process.exitCode = 1;
} else {
  console.log("\nreadback clean: revenue-only bidding restored and both call actions exist.");
  console.log("NEXT: paste the env values above into Railway, then set actionId + status VERIFIED_LIVE");
  console.log("      for websiteCallAction / clickToCallIntentAction in docs/paid-search/campaign-config.mjs.");
}
