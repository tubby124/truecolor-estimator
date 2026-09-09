import { describe, expect, it } from "vitest";
import { parseGa4ClientContext } from "../ga4-client-context";

describe("GA4 browser context validation", () => {
  it("keeps only real GA client and numeric session identifiers", () => {
    expect(parseGa4ClientContext({
      ga_client_id: " 1234567890.1234567890 ",
      ga_session_id: 1234567890,
      ga_session_number: "2",
    })).toEqual({
      ga_client_id: "1234567890.1234567890",
      ga_session_id: "1234567890",
      ga_session_number: "2",
    });
  });

  it("rejects fabricated or malformed client identifiers", () => {
    expect(parseGa4ClientContext({ ga_client_id: "customer-123" })).toBeNull();
    expect(parseGa4ClientContext({ ga_client_id: "123.abc" })).toBeNull();
  });
});

import { afterEach, beforeEach, vi } from "vitest";
import { appendGa4ClientContextToFormData, captureGa4ClientContext, primeGa4ClientContext, clearGa4ClientContext, GA4_CONTEXT_CACHE_KEY } from "../ga4-client-context";

describe("GA4 supported browser continuity", () => {
  let data: Map<string, string>;
  let values: Record<string, unknown>;
  let callbacks: Record<string, (value: unknown) => void>;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv("NEXT_PUBLIC_MARKETING_CONSENT_BANNER", "false");
    data = new Map(); values = { client_id: "123.456", session_id: "789", session_number: "2" }; callbacks = {};
    vi.stubGlobal("document", { cookie: "" });
    vi.stubGlobal("window", {
      location: { pathname: "/checkout" }, setTimeout, clearTimeout,
      sessionStorage: { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v), removeItem: (k: string) => data.delete(k) },
      gtag: vi.fn((_command, _destination, field: string, callback: (v: unknown) => void) => {
        callbacks[field] = callback;
        if (field in values) callback(values[field]);
      }),
    });
    clearGa4ClientContext();
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
  async function capture() { const promise = captureGa4ClientContext(); await vi.advanceTimersByTimeAsync(500); return promise; }
  it("primes delayed tag callbacks within 3 seconds", async () => {
    values = {}; const promise = primeGa4ClientContext();
    await vi.advanceTimersByTimeAsync(1200);
    callbacks.client_id("123.456"); callbacks.session_id("789"); callbacks.session_number("2");
    expect(await promise).toEqual({ ga_client_id: "123.456", ga_session_id: "789", ga_session_number: "2" });
  });
  it("fills only a missing session for the freshly matching client without extending TTL", async () => {
    await primeGa4ClientContext(); const original = data.get(GA4_CONTEXT_CACHE_KEY);
    values = { client_id: "123.456" };
    expect((await capture())?.ga_session_id).toBe("789");
    expect(data.get(GA4_CONTEXT_CACHE_KEY)).toBe(original);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(await capture()).toEqual({ ga_client_id: "123.456" });
  });
  it("never recovers an absent live client", async () => {
    await primeGa4ClientContext(); values = {};
    expect(await capture()).toBeNull(); expect(data.size).toBe(0);
    callbacks.client_id("123.456"); expect(data.size).toBe(0);
  });
  it.each([{ client_id: "999.888" }, { client_id: "123.456", session_number: "3" }, { client_id: "123.456", session_id: "900" }])("does not mix old sessions or numbers into %j", async (next) => {
    await primeGa4ClientContext(); values = next;
    const result = await capture();
    expect(result?.ga_session_id).toBe(next.session_id);
    expect(result?.ga_session_number).toBe(next.session_number);
  });
  it.each(["{", "null", JSON.stringify({ capturedAt: Date.now() + 999999, context: { ga_client_id: "123.456", ga_session_id: "789" } })])("ignores malformed or future cache %s", async raw => {
    data.set(GA4_CONTEXT_CACHE_KEY, raw); values = { client_id: "123.456" };
    expect(await capture()).toEqual({ ga_client_id: "123.456" });
  });
  it("survives storage exceptions", async () => {
    Object.defineProperty(window, "sessionStorage", { get() { throw new Error("blocked"); } });
    expect((await capture())?.ga_session_id).toBe("789");
  });
  it.each(["/pay/token", "/pay", "/staff/orders"])("purges and does no reads on %s", async path => {
    await primeGa4ClientContext(); vi.mocked(window.gtag!).mockClear(); window.location.pathname = path;
    expect(await capture()).toBeNull(); expect(data.size).toBe(0); expect(window.gtag).not.toHaveBeenCalled();
  });
  it("requires grant with banner enabled and blocks explicit denial with banner off", async () => {
    vi.stubEnv("NEXT_PUBLIC_MARKETING_CONSENT_BANNER", "true"); expect(await capture()).toBeNull();
    document.cookie = "tc_marketing_consent=granted"; expect(await capture()).not.toBeNull();
    vi.stubEnv("NEXT_PUBLIC_MARKETING_CONSENT_BANNER", "false"); document.cookie = "tc_marketing_consent=denied";
    expect(await capture()).toBeNull(); expect(data.size).toBe(0);
  });
  it("rechecks consent after asynchronous reads", async () => {
    values = {}; const pending = captureGa4ClientContext(); document.cookie = "tc_marketing_consent=denied";
    callbacks.client_id("123.456"); callbacks.session_id("789"); callbacks.session_number("2");
    expect(await pending).toBeNull(); expect(data.size).toBe(0);
  });
  it("clears reused form identifiers on denied or partial reads", async () => {
    const form = new FormData();
    await appendGa4ClientContextToFormData(form);
    expect(form.get("ga_session_id")).toBe("789");
    document.cookie = "tc_marketing_consent=denied";
    await appendGa4ClientContextToFormData(form);
    expect([...form.keys()]).toEqual([]);
    document.cookie = "";
    form.set("ga_session_id", "old"); form.set("ga_session_number", "old");
    values = { client_id: "999.888" };
    const pending = appendGa4ClientContextToFormData(form);
    await vi.advanceTimersByTimeAsync(500); await pending;
    expect([...form.entries()]).toEqual([["ga_client_id", "999.888"]]);
  });
  it("background priming cannot invalidate a pending checkout read", async () => {
    values = {}; const pending = captureGa4ClientContext();
    expect(await primeGa4ClientContext()).toBeNull();
    callbacks.client_id("123.456"); callbacks.session_id("789"); callbacks.session_number("2");
    expect((await pending)?.ga_session_id).toBe("789");
  });
  it("privacy invalidation prevents pending reads after consent is restored", async () => {
    values = {}; const pending = captureGa4ClientContext(); clearGa4ClientContext();
    callbacks.client_id("123.456"); callbacks.session_id("789"); callbacks.session_number("2");
    expect(await pending).toBeNull(); expect(data.size).toBe(0);
  });
  it("a newer read prevents old callbacks overwriting the current client", async () => {
    values = {}; const old = primeGa4ClientContext(); const previous = { ...callbacks };
    values = { client_id: "999.888", session_id: "900", session_number: "1" };
    await capture(); previous.client_id("123.456"); previous.session_id("789"); previous.session_number("2");
    expect(await old).toBeNull(); expect(JSON.parse(data.get(GA4_CONTEXT_CACHE_KEY)!).context.ga_client_id).toBe("999.888");
  });
});
