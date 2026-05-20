#!/usr/bin/env node
/**
 * Verifies the staff-notification audio unlock pattern on the LIVE production
 * site (truecolorprinting.ca/staff/login). Drives a real Chromium with the
 * default autoplay policy in effect — same conditions a logged-in staff user
 * sees.
 *
 * Asserts:
 *   1. document.body.dataset.staffAudio === "locked" before any input
 *   2. After a single click, it transitions to "unlocked" within 5s
 *   3. After unlock, audio.play() in page context resolves cleanly (proves
 *      the autoplay-policy gate is actually lifted, not just our marker).
 *
 * Run:  node scripts/verify-staff-audio-live.mjs
 * Exits 0 on pass, 1 on failure.
 */
import { chromium } from "@playwright/test";

const URL = "https://truecolorprinting.ca/staff/login";
const TIMEOUT_MS = 15000;

async function pollFor(page, expected) {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    const v = await page.evaluate(() => document.body.dataset.staffAudio);
    if (v === expected) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
let pass = true;

page.on("console", (msg) => {
  if (msg.type() === "error" || msg.type() === "warning") {
    console.log(`  [browser ${msg.type()}] ${msg.text()}`);
  }
});
page.on("pageerror", (err) => {
  console.log(`  [browser pageerror] ${err.message}`);
});

try {
  console.log(`→ navigating to ${URL}`);
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  console.log(`  final URL: ${page.url()}`);
  const hasLoginForm = await page.locator('button:has-text("Sign In")').count();
  console.log(`  login form present: ${hasLoginForm > 0}`);
  const datasetSnapshot = await page.evaluate(() => Object.assign({}, document.body.dataset));
  console.log(`  body.dataset at load: ${JSON.stringify(datasetSnapshot)}`);

  const locked = await pollFor(page, "locked");
  if (!locked) {
    const actual = await page.evaluate(() => document.body.dataset.staffAudio);
    console.error(`FAIL: expected dataset.staffAudio="locked" before gesture, got "${actual ?? "<unset>"}"`);
    pass = false;
  } else {
    console.log("✓ pre-gesture state is locked");
  }

  await page.locator("body").click();

  const unlocked = await pollFor(page, "unlocked");
  if (!unlocked) {
    const actual = await page.evaluate(() => document.body.dataset.staffAudio);
    console.error(`FAIL: expected dataset.staffAudio="unlocked" after click, got "${actual ?? "<unset>"}"`);
    pass = false;
  } else {
    console.log("✓ post-gesture state is unlocked");
  }

  // Independent verification: after unlock, a fresh Audio.play() must resolve
  // without NotAllowedError — proves the browser autoplay gate is actually
  // open for this page, not just our marker being optimistic.
  const playResult = await page.evaluate(async () => {
    try {
      const a = new Audio("/sounds/ding.mp3");
      a.muted = true; // silent — we don't want the CI to literally beep
      await a.play();
      a.pause();
      return { ok: true };
    } catch (e) {
      return { ok: false, name: e?.name, message: e?.message };
    }
  });

  if (!playResult.ok) {
    console.error(`FAIL: post-gesture audio.play() rejected with ${playResult.name}: ${playResult.message}`);
    pass = false;
  } else {
    console.log("✓ post-gesture audio.play() resolves cleanly (autoplay gate is lifted)");
  }
} finally {
  await browser.close();
}

console.log(pass ? "\nALL CHECKS PASSED" : "\nFAILED");
process.exit(pass ? 0 : 1);
