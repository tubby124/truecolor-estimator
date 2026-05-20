import { test, expect } from "@playwright/test";

// Verifies the autoplay-policy workaround for staff notification sound.
//
// Background: NotificationListener creates an Audio element on mount, then
// calls .play() from a Supabase broadcast callback when a new quote or paid
// order arrives. Without a prior user gesture, Chrome rejects the call with
// NotAllowedError — and the original code silently swallowed it, so staff
// got toasts but no ding. The fix primes the element inside the first
// pointerdown/keydown/touchstart event, after which programmatic play()
// succeeds for the rest of the session.
//
// The component sets document.body.dataset.staffAudio to track state:
//   "locked"   = audio created, awaiting first gesture
//   "unlocked" = prime succeeded inside a gesture, future play() will work
//   "blocked"  = prime rejected even inside a gesture (should not happen)
//
// /staff/login mounts NotificationListener via src/app/staff/layout.tsx and
// is allowed by middleware without a session, so this test does not need
// staff auth.

test.describe("staff notification audio", () => {
  test("primes audio on first user gesture (autoplay-policy workaround)", async ({ page }) => {
    await page.goto("/staff/login");

    // Initial state: audio created but not primed by a gesture.
    await expect
      .poll(async () => page.evaluate(() => document.body.dataset.staffAudio), {
        message: "audio should be locked before any gesture",
        timeout: 5000,
      })
      .toBe("locked");

    // Playwright click produces OS-level user-activation, which satisfies the
    // browser autoplay policy.
    await page.locator("body").click();

    await expect
      .poll(async () => page.evaluate(() => document.body.dataset.staffAudio), {
        message: "audio should be unlocked after first click",
        timeout: 5000,
      })
      .toBe("unlocked");
  });
});
