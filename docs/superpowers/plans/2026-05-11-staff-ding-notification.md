# Staff Ding Notification System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Play an audible ding + visual toast in the `/staff` dashboard AND send a Telegram message to Hasan whenever a new quote request lands or a Clover-paid order completes.

**Architecture:** Server-side handlers (`/api/quote-request`, `/api/webhooks/clover`) emit two non-blocking side effects after their existing DB operation succeeds: (1) `broadcastStaffNotification()` to a Supabase Broadcast channel `tc-staff-notifs`, and (2) `sendTelegramNotification()` to `@truecolorprintingbot`. A client-side `<NotificationListener />` mounted in the staff layout subscribes to the Broadcast channel and plays `/sounds/ding.mp3`. Broadcast bypasses RLS entirely — no Postgres replication or policy changes required.

**Tech Stack:** Next.js 16.1.6 · TypeScript strict · `@supabase/ssr` v0.8 · `@supabase/supabase-js` v2.97 · Vitest · existing `createServiceClient()` + `createClient()` in `src/lib/supabase/`

**Spec:** `docs/superpowers/specs/2026-05-11-staff-ding-notification-design.md`

**Mandatory gates before push:** `/web-design-ux` (toast component), `/ecommerce-ux` (touches order flow), `/e2e-test` (Railway push gate). Per `.claude/rules/truecolor-domain.md`.

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `src/lib/notifications/telegram.ts` | NEW | `sendTelegramNotification(message)` — POST to Telegram Bot API |
| `src/lib/notifications/broadcast.ts` | NEW | `broadcastStaffNotification(event, payload)` — server-side Supabase Broadcast emit |
| `src/lib/notifications/__tests__/telegram.test.ts` | NEW | Unit tests for telegram helper |
| `src/lib/notifications/__tests__/broadcast.test.ts` | NEW | Unit tests for broadcast helper |
| `src/components/staff/NotificationListener.tsx` | NEW | Client component — Broadcast subscriber, ding + toast + badge |
| `public/sounds/ding.mp3` | NEW | Royalty-free notification audio (~20KB) |
| `src/app/staff/layout.tsx` | EDIT | Mount `<NotificationListener />` |
| `src/app/api/quote-request/route.ts` | EDIT | Emit broadcast + Telegram after `quote_requests` insert |
| `src/app/api/webhooks/clover/route.ts` | EDIT | Emit broadcast + Telegram after `updatedOrders.length > 0` |

Total: 3 new source files, 2 new test files, 1 audio asset, 3 edits.

---

## Task 0: Verify environment + dependencies

**Files:**
- Read: `.env.local` (if exists locally) and Railway prod env

- [ ] **Step 1: Verify the two Telegram env vars exist in Railway**

Run:
```bash
cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && railway variables --json 2>/dev/null | grep -E "TRUE_COLOR_TELEGRAM"
```

Expected output: two lines, one for `TRUE_COLOR_TELEGRAM_BOT_TOKEN` and one for `TRUE_COLOR_TELEGRAM_CHAT_ID`.

If either is missing, set them:
```bash
cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && \
  railway variables set TRUE_COLOR_TELEGRAM_BOT_TOKEN=$TRUE_COLOR_TELEGRAM_BOT_TOKEN
cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && \
  railway variables set TRUE_COLOR_TELEGRAM_CHAT_ID=$TRUE_COLOR_TELEGRAM_CHAT_ID
```
(Values come from `~/.secrets` which is sourced by zshrc.)

- [ ] **Step 2: Verify dev env loads them too**

Run:
```bash
cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && \
  grep -E "TRUE_COLOR_TELEGRAM" .env.local 2>/dev/null || echo "missing — add them"
```

If missing, append to `.env.local`:
```
TRUE_COLOR_TELEGRAM_BOT_TOKEN=...
TRUE_COLOR_TELEGRAM_CHAT_ID=...
```
(Copy values from `~/.secrets`.)

- [ ] **Step 3: Confirm no commit needed yet**

Setup task only — no source files changed.

---

## Task 1: Telegram helper (TDD)

**Files:**
- Create: `src/lib/notifications/telegram.ts`
- Test: `src/lib/notifications/__tests__/telegram.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/notifications/__tests__/telegram.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendTelegramNotification } from "../telegram";

describe("sendTelegramNotification", () => {
  const ORIGINAL_ENV = process.env;
  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      TRUE_COLOR_TELEGRAM_BOT_TOKEN: "fake-token",
      TRUE_COLOR_TELEGRAM_CHAT_ID: "12345",
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
  });
  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  it("posts to the Telegram API with the chat_id and message", async () => {
    await sendTelegramNotification("hello");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://api.telegram.org/botfake-token/sendMessage");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.chat_id).toBe("12345");
    expect(body.text).toBe("hello");
    expect(body.parse_mode).toBe("HTML");
  });

  it("does nothing if env vars are missing", async () => {
    process.env.TRUE_COLOR_TELEGRAM_BOT_TOKEN = "";
    await sendTelegramNotification("hello");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("swallows network errors silently", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network down"));
    await expect(sendTelegramNotification("hello")).resolves.toBeUndefined();
  });

  it("swallows Telegram API 5xx errors silently", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response("server error", { status: 500 })
    );
    await expect(sendTelegramNotification("hello")).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && npx vitest run src/lib/notifications/__tests__/telegram.test.ts`

Expected: FAIL — `Cannot find module '../telegram'`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/notifications/telegram.ts`:

```ts
/**
 * Send a Telegram message to Hasan via @truecolorprintingbot.
 *
 * Fail-quiet by design — Telegram is a notification side-channel.
 * It must never break the route that called it.
 *
 * Env vars (Railway):
 *   TRUE_COLOR_TELEGRAM_BOT_TOKEN — bot token from BotFather
 *   TRUE_COLOR_TELEGRAM_CHAT_ID   — Hasan's chat_id
 */
export async function sendTelegramNotification(message: string): Promise<void> {
  const token = process.env.TRUE_COLOR_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TRUE_COLOR_TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[telegram] env vars missing — skipping notification");
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.error(`[telegram] API ${res.status}`);
    }
  } catch (err) {
    console.error("[telegram] send failed:", err instanceof Error ? err.message : err);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && npx vitest run src/lib/notifications/__tests__/telegram.test.ts`

Expected: PASS — 4 tests pass.

- [ ] **Step 5: Commit**

```bash
cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && \
  git add src/lib/notifications/telegram.ts src/lib/notifications/__tests__/telegram.test.ts && \
  git commit -m "feat(notifications): add Telegram helper for staff alerts"
```

---

## Task 2: Broadcast helper (TDD)

**Files:**
- Create: `src/lib/notifications/broadcast.ts`
- Test: `src/lib/notifications/__tests__/broadcast.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/notifications/__tests__/broadcast.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { broadcastStaffNotification } from "../broadcast";

const sendMock = vi.fn();
const removeChannelMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    channel: () => ({
      send: sendMock,
    }),
    removeChannel: removeChannelMock,
  }),
}));

describe("broadcastStaffNotification", () => {
  beforeEach(() => {
    sendMock.mockReset();
    removeChannelMock.mockReset();
    sendMock.mockResolvedValue("ok");
  });

  it("sends a broadcast event with the given type and payload", async () => {
    await broadcastStaffNotification("quote.created", { id: "q1", name: "Acme" });
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith({
      type: "broadcast",
      event: "quote.created",
      payload: { id: "q1", name: "Acme" },
    });
  });

  it("cleans up the channel after send", async () => {
    await broadcastStaffNotification("order.paid", { id: "o1" });
    expect(removeChannelMock).toHaveBeenCalledTimes(1);
  });

  it("swallows errors silently", async () => {
    sendMock.mockRejectedValue(new Error("broadcast down"));
    await expect(
      broadcastStaffNotification("quote.created", { id: "q1" })
    ).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && npx vitest run src/lib/notifications/__tests__/broadcast.test.ts`

Expected: FAIL — `Cannot find module '../broadcast'`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/notifications/broadcast.ts`:

```ts
import { createServiceClient } from "@/lib/supabase/server";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

const CHANNEL_NAME = "tc-staff-notifs";

export type StaffNotificationEvent = "quote.created" | "order.paid";

/**
 * Emit a server-side Supabase Broadcast event to all subscribed staff clients.
 *
 * Fail-quiet by design — Broadcast is a notification side-channel.
 * It must never break the route that called it.
 */
export async function broadcastStaffNotification(
  event: StaffNotificationEvent,
  payload: Record<string, unknown>
): Promise<void> {
  let supabase: SupabaseClient | null = null;
  let channel: RealtimeChannel | null = null;
  try {
    supabase = createServiceClient();
    channel = supabase.channel(CHANNEL_NAME);
    await channel.send({
      type: "broadcast",
      event,
      payload,
    });
  } catch (err) {
    console.error("[broadcast] send failed:", err instanceof Error ? err.message : err);
  } finally {
    if (supabase && channel) {
      try {
        await supabase.removeChannel(channel);
      } catch {
        // ignore cleanup errors
      }
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && npx vitest run src/lib/notifications/__tests__/broadcast.test.ts`

Expected: PASS — 3 tests pass.

- [ ] **Step 5: Commit**

```bash
cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && \
  git add src/lib/notifications/broadcast.ts src/lib/notifications/__tests__/broadcast.test.ts && \
  git commit -m "feat(notifications): add Supabase Broadcast helper for staff alerts"
```

---

## Task 3: Add the ding sound asset

**Files:**
- Create: `public/sounds/ding.mp3`

- [ ] **Step 1: Source a royalty-free ding**

Download a pleasant notification ding from pixabay.com or freesound.org (CC0 license). Target: < 30KB, 0.5–1.0s duration, mid-frequency tone (not jarring).

Recommended search: `site:pixabay.com notification ding`, pick one under 30KB.

Save as: `public/sounds/ding.mp3`.

- [ ] **Step 2: Verify file size + duration**

Run:
```bash
cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && \
  ls -lh public/sounds/ding.mp3 && \
  afinfo public/sounds/ding.mp3 2>/dev/null | head -5 || file public/sounds/ding.mp3
```

Expected: size < 30KB, audio MPEG, duration roughly 0.5–1.5 seconds.

- [ ] **Step 3: Commit**

```bash
cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && \
  git add public/sounds/ding.mp3 && \
  git commit -m "chore(notifications): add ding.mp3 staff notification sound"
```

---

## Task 4: NotificationListener client component

**Files:**
- Create: `src/components/staff/NotificationListener.tsx`

This is a "use client" browser component. No Vitest test — the test surface is `HTMLAudioElement` + Supabase channel mocking which provides minimal value vs. a manual smoke test. Smoke test happens in Task 7.

- [ ] **Step 1: Write the component**

Create `src/components/staff/NotificationListener.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CHANNEL_NAME = "tc-staff-notifs";
const DING_PATH = "/sounds/ding.mp3";
const TOAST_DURATION_MS = 4000;

type ToastEntry = {
  id: string;
  title: string;
  body: string;
};

type QuotePayload = { id?: string; name?: string; email?: string; summary?: string };
type OrderPayload = { id?: string; order_number?: string; total?: number };

export default function NotificationListener() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Lazy-init the audio element once on mount.
    audioRef.current = new Audio(DING_PATH);
    audioRef.current.preload = "auto";

    const supabase = createClient();
    const channel = supabase
      .channel(CHANNEL_NAME)
      .on("broadcast", { event: "quote.created" }, ({ payload }) => {
        const p = payload as QuotePayload;
        handleNotification({
          title: "New quote request",
          body: p.name ? `${p.name} — ${p.summary ?? "view in /staff/quotes"}` : "View in /staff/quotes",
        });
      })
      .on("broadcast", { event: "order.paid" }, ({ payload }) => {
        const p = payload as OrderPayload;
        const total = typeof p.total === "number" ? `$${p.total.toFixed(2)}` : "";
        handleNotification({
          title: "Order paid",
          body: `${p.order_number ?? "Order"} ${total}`.trim(),
        });
      })
      .subscribe();

    function handleNotification(entry: { title: string; body: string }) {
      // Play ding — may reject if tab is backgrounded or user hasn't interacted yet.
      audioRef.current?.play().catch(() => {});

      // Increment localStorage badge.
      try {
        const current = parseInt(localStorage.getItem("tc.notifBadge") ?? "0", 10);
        localStorage.setItem("tc.notifBadge", String(current + 1));
        window.dispatchEvent(new CustomEvent("tc:notification"));
      } catch {
        // localStorage may be disabled — non-fatal
      }

      // Show toast.
      const toastId = crypto.randomUUID();
      setToasts((prev) => [...prev, { id: toastId, ...entry }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, TOAST_DURATION_MS);
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          style={{
            background: "#111",
            color: "#fff",
            padding: "12px 16px",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            maxWidth: 320,
            pointerEvents: "auto",
            borderLeft: "4px solid #e63020",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.title}</div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>{t.body}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Type-check the file**

Run: `cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && npx tsc --noEmit`

Expected: PASS — no type errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && \
  git add src/components/staff/NotificationListener.tsx && \
  git commit -m "feat(staff): add NotificationListener client component"
```

---

## Task 5: Mount NotificationListener in staff layout

**Files:**
- Modify: `src/app/staff/layout.tsx`

- [ ] **Step 1: Read current layout**

Read `src/app/staff/layout.tsx` — confirm the current shape is:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "True Color — Staff Estimator",
  robots: { index: false, follow: false },
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Add the import and mount**

Replace the contents of `src/app/staff/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import NotificationListener from "@/components/staff/NotificationListener";

// Staff routes are internal tools — keep them out of search engine indexes
export const metadata: Metadata = {
  title: "True Color — Staff Estimator",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NotificationListener />
      {children}
    </>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && \
  git add src/app/staff/layout.tsx && \
  git commit -m "feat(staff): mount NotificationListener in /staff layout"
```

---

## Task 6: Wire quote-request route — emit broadcast + Telegram

**Files:**
- Modify: `src/app/api/quote-request/route.ts`

- [ ] **Step 1: Read the existing insert region**

Read `src/app/api/quote-request/route.ts`, lines 255–295. Confirm the current shape has:
- A `try { const { data: insertedRow } = await supabase.from("quote_requests").insert({...}).select("id").single(); insertedId = ... } catch (...) {}` block.
- After that block, an `upsert customers` block.

- [ ] **Step 2: Add imports at the top of the file**

Add two import lines immediately after the existing `import { getBrokerage } ...` line:

```ts
import { sendTelegramNotification } from "@/lib/notifications/telegram";
import { broadcastStaffNotification } from "@/lib/notifications/broadcast";
```

- [ ] **Step 3: Add the side-effect calls after `insertedId` is captured**

After the existing block that captures `insertedId` (search for `insertedId = (insertedRow?.id as string | undefined) ?? null;`), and BEFORE the customers `upsert`, insert this block:

```ts
    // Side-channel notifications — fire-and-forget. Failures never break the response.
    if (insertedId) {
      const summary = Array.isArray(items) && items.length > 0
        ? `${items.length} item${items.length === 1 ? "" : "s"}`
        : "quote";
      const refShort = insertedId.slice(0, 8).toUpperCase();
      void broadcastStaffNotification("quote.created", {
        id: insertedId,
        name,
        email,
        summary,
      }).catch(() => {});
      void sendTelegramNotification(
        `📋 <b>New quote request</b> (${refShort})\n` +
        `<b>${name}</b> · ${email}\n` +
        `${summary}`
      ).catch(() => {});
    }
```

- [ ] **Step 4: Type-check**

Run: `cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && \
  git add src/app/api/quote-request/route.ts && \
  git commit -m "feat(quote-request): notify staff on new quote (broadcast + Telegram)"
```

---

## Task 7: Wire Clover webhook — emit broadcast + Telegram

**Files:**
- Modify: `src/app/api/webhooks/clover/route.ts`

- [ ] **Step 1: Read the paid-branch region**

Read `src/app/api/webhooks/clover/route.ts`, lines 55–110. Confirm:
- Inside `if (event.type === "PAYMENT") { ... if (obj?.status === "captured" || obj?.status === "paid") { ... if (matchRef) { ... const { data: updatedOrders, error } = await supabase.from("orders").update({ status: "payment_received", paid_at: ... }).eq("payment_reference", matchRef).eq("status", "pending_payment").select("id, order_number, customer_id, total, is_rush, wave_invoice_id"); ... `
- And then an `if (error) { ... } else { const count = updatedOrders?.length ?? 0; ... }` block.

- [ ] **Step 2: Add imports at the top of the file**

Add two import lines after the existing `import { syncCustomerToBrevo } ...` line:

```ts
import { sendTelegramNotification } from "@/lib/notifications/telegram";
import { broadcastStaffNotification } from "@/lib/notifications/broadcast";
```

- [ ] **Step 3: Add side-effect calls inside the `count > 0` branch**

Inside the `else { const count = updatedOrders?.length ?? 0; ... }` block, find the place where the first updated order is processed (likely uses `updatedOrders[0]` or iterates). For each order whose status was just transitioned, fire the notifications. If the existing code already iterates, add inside that loop; if it processes only `updatedOrders[0]`, add after that.

Pattern to insert (adapt to existing iteration shape):

```ts
            // Side-channel notifications — fire-and-forget.
            for (const updated of updatedOrders ?? []) {
              const totalNum = typeof updated.total === "number" ? updated.total : Number(updated.total ?? 0);
              void broadcastStaffNotification("order.paid", {
                id: updated.id,
                order_number: updated.order_number,
                total: totalNum,
              }).catch(() => {});
              void sendTelegramNotification(
                `💰 <b>Order paid</b>\n` +
                `<b>${updated.order_number ?? updated.id}</b> · $${totalNum.toFixed(2)}` +
                (updated.is_rush ? "\n⚡ RUSH" : "")
              ).catch(() => {});
            }
```

Place this **before** any existing email send or Wave sync so the staff get the ding fastest.

- [ ] **Step 4: Type-check**

Run: `cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && \
  git add src/app/api/webhooks/clover/route.ts && \
  git commit -m "feat(webhooks): notify staff on Clover-paid orders (broadcast + Telegram)"
```

---

## Task 8: Manual smoke test (dev)

No code changes — this is a verification step.

- [ ] **Step 1: Start the dev server**

Run:
```bash
cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && npm run dev
```

Wait for `Ready - started server on 0.0.0.0:3000`.

- [ ] **Step 2: Open the staff dashboard in browser A**

Browser A: navigate to `http://localhost:3000/staff/login`, sign in as `STAFF_EMAIL`. After login, you should be at `/staff`. Click anywhere on the page (browser autoplay policy requires a user gesture before audio can play).

- [ ] **Step 3: Submit a quote request from browser B (or incognito tab)**

Browser B (incognito): navigate to `http://localhost:3000/quote-request`. Fill in:
- Name: `Smoke Test`
- Email: `smoke@example.com`
- Phone: `3065551234`
- Add one item with any product + quantity.

Submit.

- [ ] **Step 4: Verify ding + toast in browser A**

In browser A:
- Ding sound plays.
- Toast appears bottom-right: "New quote request · Smoke Test — 1 item".
- Toast disappears after ~4 seconds.

- [ ] **Step 5: Verify Telegram message arrived**

Check Telegram on Hasan's phone — a message from `@truecolorprintingbot` should have arrived:
```
📋 New quote request (XXXXXXXX)
Smoke Test · smoke@example.com
1 item
```

- [ ] **Step 6: If either signal failed, diagnose before continuing**

Common failures:
- No ding → check browser console for autoplay error. Ensure step 2 included a click on the page.
- No toast → check React DevTools that `<NotificationListener />` is mounted in `/staff`.
- No Telegram → check `console.error` output in the dev server terminal for `[telegram] ...` lines; verify `.env.local` has both vars.
- No broadcast → check Supabase dashboard → Realtime → Inspector → channel `tc-staff-notifs` should show recent events.

Do NOT proceed to Task 9 until smoke test passes.

- [ ] **Step 7: Tear down test data (optional)**

The smoke quote was inserted with `email=smoke@example.com`. If you want to remove it:

```sql
-- Run via mcp__supabase__execute_sql, project_id=dczbgraekmzirxknjvwe
DELETE FROM quote_requests WHERE email = 'smoke@example.com';
DELETE FROM customers WHERE email = 'smoke@example.com';
```

- [ ] **Step 8: No commit needed for this task** (smoke test only).

---

## Task 9: Order-paid smoke test (dev)

No code changes — verification step for the Clover branch.

The Clover branch fires from a signed webhook. Two options to verify:

**Option A — full Clover sandbox flow** (most realistic): Use Clover's sandbox merchant to run a real test payment through `/checkout` → Clover hosted checkout → confirm webhook fires. Requires `CLOVER_ENVIRONMENT=sandbox` toggle and a sandbox merchant ID. Out of scope for this task — skip if not already set up.

**Option B — direct DB UPDATE simulating the webhook effect** (faster, less realistic but tests the Broadcast wiring):

- [ ] **Step 1: Confirm an order exists in `pending_payment` state**

Run via `mcp__supabase__execute_sql` with `project_id=dczbgraekmzirxknjvwe`:

```sql
SELECT id, order_number, total, status FROM orders WHERE status = 'pending_payment' LIMIT 1;
```

If none exists, create one via the normal checkout flow on `/products/business-cards` → `/cart` → `/checkout` and stop at the Clover gateway (don't actually pay).

- [ ] **Step 2: Manually invoke the webhook code path**

Skip — Option B doesn't actually invoke the webhook route, so it can't test the new code. Use Option A or accept that the order-paid path will only be verified in production.

**Recommended path:** Skip Task 9 in dev. Verify in production after Task 10 by submitting a real $1 test order via Clover and watching for the Telegram ping + dashboard ding.

- [ ] **Step 3: No commit needed.**

---

## Task 10: Pre-push gates

- [ ] **Step 1: Run the full test suite**

Run: `cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && npm test`

Expected: PASS — all existing tests + the 7 new notification tests pass.

- [ ] **Step 2: Run a production build**

Run: `cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && npm run build`

Expected: PASS — `Compiled successfully`. Watch for type errors or new bundle warnings.

- [ ] **Step 3: Run pricing validation (auto-runs via Stop hook anyway)**

Run: `cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && npm run validate:pricing`

Expected: PASS — 60 pricing checks pass. (This feature doesn't touch pricing but the Stop hook runs it.)

- [ ] **Step 4: Run /web-design-ux skill check on the new toast component**

Manual gate per `CLAUDE.md`. Invoke `/web-design-ux` and have it review `src/components/staff/NotificationListener.tsx`. Address any flagged issues with a follow-up commit before pushing.

- [ ] **Step 5: Run /ecommerce-ux skill check on the order webhook changes**

Manual gate per `CLAUDE.md`. Invoke `/ecommerce-ux` and have it review the Clover webhook edit. Address any flagged issues before pushing.

- [ ] **Step 6: Run /e2e-test skill**

Manual gate per `CLAUDE.md`. Invoke `/e2e-test`. Address any flagged issues before pushing.

---

## Task 11: Push to Railway

- [ ] **Step 1: Final git status check**

Run: `cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && git status && git log --oneline -10`

Expected: working tree clean. The last ~7 commits should be the notification feature commits.

- [ ] **Step 2: Push to main**

Run: `cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && git push`

Expected: push succeeds. Railway detects push and begins build (~2 min).

- [ ] **Step 3: Watch Railway deploy**

Open Railway dashboard or run:
```bash
cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && railway logs --tail | head -40
```

Watch for `Compiled successfully` and the new build going live.

- [ ] **Step 4: Verify env vars are set in Railway**

Run: `cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator" && railway variables --json | grep TRUE_COLOR_TELEGRAM`

Expected: both `TRUE_COLOR_TELEGRAM_BOT_TOKEN` and `TRUE_COLOR_TELEGRAM_CHAT_ID` present. If missing, set them (see Task 0).

- [ ] **Step 5: Production smoke test**

In one browser tab: log in at `https://truecolorprinting.ca/staff/login`. Click somewhere on the page to satisfy autoplay.

In incognito: submit a real quote request at `https://truecolorprinting.ca/quote-request` with email `smoke-prod@example.com`. Confirm:
- Ding plays in staff tab.
- Toast shows.
- Telegram message arrives.

If all three confirmed: feature is live.

- [ ] **Step 6: Update SEO Sprint Log**

Per `CLAUDE.md` mandatory rule, even though this isn't an SEO change, log it in the project memory log so the change history stays current.

Append to `~/.claude/projects/-Users-owner-Downloads-TRUE-COLOR-PRICING-/memory/seo-sprints.md`:

```
## Non-SEO Phase — Staff Ding Notifications (2026-05-11)
- Files changed: src/lib/notifications/telegram.ts, src/lib/notifications/broadcast.ts, src/components/staff/NotificationListener.tsx, src/app/staff/layout.tsx, src/app/api/quote-request/route.ts, src/app/api/webhooks/clover/route.ts, public/sounds/ding.mp3
- What shipped: real-time ding + toast in /staff dashboard + Telegram alert to Hasan on new quote requests and Clover-paid orders.
- What was deferred: per-staff routing, quiet hours, mute toggle, web push.
- Next steps: after 1–2 weeks usage, decide on sound differentiation and mute toggle.
```

- [ ] **Step 7: Update vault note status**

Edit `~/Downloads/Obsidian Vault/Projects/true-color/2026-05-11-staff-notification-system-design.md` and change `status: design-locked` to `status: shipped`. Add a "Shipped" section at the top with the production commit SHA and verification timestamp.

---

## Open follow-ups (post-ship, not in this plan)

- Sound differentiation for quote vs order (quote = light ding, order = deeper chime).
- In-dashboard mute toggle.
- Optional shop Telegram group channel for staff scaling.
- Web push for closed-tab support.
- Persistent notifications log table.
