import { ATTRIBUTION_KEYS } from "@/lib/analytics/utm";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface StoredSubmission {
  fingerprint: string;
  submissionKey: string;
}

const STORAGE_PREFIX = "tc:quote-submission:v1";
const VOLATILE_FIELDS = new Set<string>([
  "submission_key",
  "cf-turnstile-response",
  "landing_path",
  "landing_referrer",
  ...ATTRIBUTION_KEYS,
]);

function storageKey(scope: string): string {
  return `${STORAGE_PREFIX}:${encodeURIComponent(scope)}`;
}

function entryValue(value: FormDataEntryValue): string {
  if (typeof value === "string") return `text:${value}`;
  return `file:${value.name}:${value.size}:${value.type}:${value.lastModified}`;
}

function hash64(value: string): string {
  let left = 0x811c9dc5;
  let right = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    left = Math.imul(left ^ code, 0x01000193);
    right = Math.imul(right ^ code, 0x85ebca6b);
  }
  return `${(left >>> 0).toString(16).padStart(8, "0")}${(right >>> 0)
    .toString(16)
    .padStart(8, "0")}`;
}

export function fingerprintQuotePayload(payload: FormData): string {
  const entries: Array<[string, string]> = [];
  payload.forEach((value, key) => {
    if (!VOLATILE_FIELDS.has(key)) entries.push([key, entryValue(value)]);
  });
  entries.sort(
    ([leftKey, leftValue], [rightKey, rightValue]) =>
      leftKey.localeCompare(rightKey) || leftValue.localeCompare(rightValue),
  );
  return hash64(JSON.stringify(entries));
}

function safeStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function getOrCreateQuoteSubmission(
  scope: string,
  payload: FormData,
  options: {
    storage?: StorageLike;
    randomUUID?: () => string;
  } = {},
): StoredSubmission {
  const fingerprint = fingerprintQuotePayload(payload);
  const storage = safeStorage(options.storage);
  const key = storageKey(scope);

  if (storage) {
    try {
      const existing = JSON.parse(
        storage.getItem(key) ?? "null",
      ) as Partial<StoredSubmission> | null;
      if (
        existing?.fingerprint === fingerprint &&
        typeof existing.submissionKey === "string" &&
        existing.submissionKey.length > 0
      ) {
        return { fingerprint, submissionKey: existing.submissionKey };
      }
    } catch {
      // A corrupt or blocked session store must not prevent quote submission.
    }
  }

  const submissionKey = (options.randomUUID ?? (() => crypto.randomUUID()))();
  const next = { fingerprint, submissionKey };
  if (storage) {
    try {
      storage.setItem(key, JSON.stringify(next));
    } catch {
      // Submission still works without persistence; the database remains the
      // final duplicate guard for any key that reaches the API.
    }
  }
  return next;
}

export function clearQuoteSubmission(
  scope: string,
  submissionKey: string,
  storageOverride?: StorageLike,
): void {
  const storage = safeStorage(storageOverride);
  if (!storage) return;
  const key = storageKey(scope);
  try {
    const existing = JSON.parse(
      storage.getItem(key) ?? "null",
    ) as Partial<StoredSubmission> | null;
    if (existing?.submissionKey === submissionKey) storage.removeItem(key);
  } catch {
    storage.removeItem(key);
  }
}
