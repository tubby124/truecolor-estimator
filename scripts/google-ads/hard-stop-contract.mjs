export const HARD_STOP_TIME_ZONE = "America/Regina";
export const HARD_STOP_CUSTOMER_ID = "1072816342";
export const HARD_STOP_LOGIN_CUSTOMER_ID = "1125402990";
export const HARD_STOP_CAMPAIGNS = Object.freeze([
  Object.freeze({ id: "24048123058", name: "GOOG_Search_TC_CoreProducts_2026" }),
  Object.freeze({ id: "24048123061", name: "GOOG_Search_TC_CompetitorConquest_2026" }),
  Object.freeze({ id: "24048123064", name: "GOOG_Search_TC_BrandDefense_2026" }),
]);

export const HARD_STOP_PROFILES = Object.freeze({
  "controlled-test": Object.freeze({
    spendScope: "EXACT_ACCOUNT_TOTAL",
    warningCad: 25,
    thresholdCad: 25,
    approvedCapCad: 30,
    requiresExplicitWindow: true,
    maximumWindowHours: 72,
  }),
  "public-pilot": Object.freeze({
    spendScope: "EXACT_ACCOUNT_TOTAL",
    warningCad: 500,
    thresholdCad: 625,
    approvedCapCad: 650,
    requiresExplicitWindow: false,
    windowStart: "2026-07-20T00:00",
    windowEnd: "2026-09-18T00:00",
  }),
});

const LOCAL_HOUR = /^\d{4}-\d{2}-\d{2}T\d{2}:00$/;

export function parseHardStopOptions(argv) {
  const options = { execute: false, profile: null, windowStart: null, windowEnd: null };
  for (const arg of argv) {
    if (arg === "--execute") options.execute = true;
    else if (arg === "--dry-run") options.execute = false;
    else if (arg.startsWith("--profile=")) options.profile = arg.slice("--profile=".length);
    else if (arg.startsWith("--window-start=")) options.windowStart = arg.slice("--window-start=".length);
    else if (arg.startsWith("--window-end=")) options.windowEnd = arg.slice("--window-end=".length);
    else throw new Error(`Unsupported argument: ${arg}`);
  }

  if (!HARD_STOP_PROFILES[options.profile]) {
    throw new Error("--profile must be controlled-test or public-pilot");
  }
  const profile = HARD_STOP_PROFILES[options.profile];
  if (profile.requiresExplicitWindow && (!options.windowStart || !options.windowEnd)) {
    throw new Error("controlled-test requires --window-start and --window-end in America/Regina local time");
  }
  if (!profile.requiresExplicitWindow && (options.windowStart || options.windowEnd)) {
    throw new Error("public-pilot uses the approved fixed window and does not accept window overrides");
  }

  options.windowStart ??= profile.windowStart;
  options.windowEnd ??= profile.windowEnd;
  if (!LOCAL_HOUR.test(options.windowStart) || !LOCAL_HOUR.test(options.windowEnd)) {
    throw new Error("Hard-stop windows must use whole hours as YYYY-MM-DDTHH:00 without an offset; America/Regina is applied explicitly");
  }
  if (options.windowStart >= options.windowEnd) throw new Error("Hard-stop window end must be after its start");

  if (profile.maximumWindowHours) {
    const durationHours = (localToEpoch(options.windowEnd) - localToEpoch(options.windowStart)) / 3_600_000;
    if (durationHours > profile.maximumWindowHours) {
      throw new Error(`controlled-test window cannot exceed ${profile.maximumWindowHours} hours`);
    }
  }
  return options;
}

export function localNow(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: HARD_STOP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}:${value.second}`;
}

export function gaqlDateRange(windowStart, windowEnd) {
  const startDate = windowStart.slice(0, 10);
  const endExclusive = windowEnd.slice(0, 10);
  const endDate = windowEnd.endsWith("T00:00") ? previousDate(endExclusive) : endExclusive;
  return { startDate, endDate };
}

export function validateAccount(account) {
  if (String(account?.id ?? "") !== HARD_STOP_CUSTOMER_ID) throw new Error("Google Ads customer ID is not the True Color allowlisted advertiser");
  if (account?.currencyCode !== "CAD") throw new Error("Google Ads customer currency is not CAD");
  if (account?.timeZone !== HARD_STOP_TIME_ZONE) throw new Error(`Google Ads customer timezone is not ${HARD_STOP_TIME_ZONE}`);
}

export function validateCampaigns(campaigns) {
  if (!Array.isArray(campaigns)) {
    throw new Error("The True Color account campaign inventory was not returned");
  }
  for (const expected of HARD_STOP_CAMPAIGNS) {
    const actual = campaigns.find((campaign) => String(campaign.id) === expected.id);
    if (!actual || actual.name !== expected.name) throw new Error(`Allowlisted campaign identity mismatch for ${expected.id}`);
  }
  const returnedIds = new Set(campaigns.map((campaign) => String(campaign.id)));
  if (returnedIds.size !== campaigns.length) throw new Error("Duplicate campaign identities returned");
  const allowedIds = new Set(HARD_STOP_CAMPAIGNS.map((campaign) => campaign.id));
  const unexpectedEnabled = campaigns.filter((campaign) => campaign.status === "ENABLED" && !allowedIds.has(String(campaign.id)));
  if (unexpectedEnabled.length > 0) {
    throw new Error(`Unexpected enabled campaign(s): ${unexpectedEnabled.map((campaign) => `${campaign.id}:${campaign.name}`).join(",")}`);
  }
}

export function sumSpendMicros(rows, { windowStart, windowEnd }) {
  let micros = 0n;
  for (const row of rows ?? []) {
    const customerId = String(row.customerId ?? "");
    if (customerId !== HARD_STOP_CUSTOMER_ID) throw new Error(`Spend response is not for the True Color account: ${customerId || "missing"}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date ?? "") || !Number.isInteger(row.hour) || row.hour < 0 || row.hour > 23) {
      throw new Error("Account spend response omitted a valid Regina-local date/hour");
    }
    const rowHour = `${row.date}T${String(row.hour).padStart(2, "0")}:00`;
    if (rowHour < windowStart || rowHour >= windowEnd) continue;
    const value = String(row.costMicros ?? "0");
    if (!/^\d+$/.test(value)) throw new Error("Invalid account cost value");
    micros += BigInt(value);
  }
  return { micros, cad: Number(micros) / 1_000_000 };
}

export function stopDecision({ profileName, spendCad, nowLocal, windowStart, windowEnd }) {
  const profile = HARD_STOP_PROFILES[profileName];
  if (nowLocal < `${windowStart}:00`) {
    return { shouldPause: false, reason: "WINDOW_NOT_STARTED" };
  }
  if (nowLocal >= `${windowEnd}:00`) {
    return { shouldPause: true, reason: "WINDOW_ENDED" };
  }
  if (spendCad >= profile.approvedCapCad) {
    return { shouldPause: true, absoluteCapReached: true, reason: "ABSOLUTE_CAP_REACHED" };
  }
  if (spendCad >= profile.thresholdCad) {
    return { shouldPause: true, absoluteCapReached: false, reason: "PROTECTIVE_PAUSE_THRESHOLD_REACHED" };
  }
  if (spendCad >= profile.warningCad) {
    return { shouldPause: false, warning: true, reason: "SPEND_WARNING_REACHED" };
  }
  return { shouldPause: false, reason: "BELOW_THRESHOLD" };
}

function previousDate(value) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function localToEpoch(value) {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  let candidate = Date.UTC(year, month - 1, day, hour, minute);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const rendered = localNow(new Date(candidate)).slice(0, 16);
    const renderedAsUtc = Date.parse(`${rendered}:00Z`);
    const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute);
    candidate += targetAsUtc - renderedAsUtc;
  }
  if (localNow(new Date(candidate)).slice(0, 16) !== value) throw new Error(`Invalid ${HARD_STOP_TIME_ZONE} local time: ${value}`);
  return candidate;
}
