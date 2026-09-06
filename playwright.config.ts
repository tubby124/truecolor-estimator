import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const useAuthFixture = process.env.SOCIAL_E2E_AUTH_FIXTURE === "true";
const fixturePort = Number(process.env.SOCIAL_E2E_AUTH_PORT || 3198);
const fixtureOrigin = `http://127.0.0.1:${fixturePort}`;
if (useAuthFixture && (
  !Number.isInteger(fixturePort) || fixturePort < 1024 || fixturePort > 65535 ||
  !["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname) ||
  process.env.NEXT_PUBLIC_SUPABASE_URL !== fixtureOrigin
)) throw new Error("Social auth fixtures require a local app and matching loopback Supabase origin");

const webServers = [
  ...(useAuthFixture ? [{
    command: "node scripts/social/e2e-auth-fixture.mjs",
    url: `${fixtureOrigin}/health`,
    reuseExistingServer: false,
    timeout: 30_000,
  }] : []),
  ...(!process.env.PLAYWRIGHT_BASE_URL ? [{
    command: process.env.PLAYWRIGHT_USE_BUILD === "true" ? "npm run start" : "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI && !useAuthFixture,
    timeout: 120_000,
    ...(useAuthFixture ? { env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: fixtureOrigin,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "ci-placeholder-publishable-key",
      SUPABASE_SECRET_KEY: "ci-placeholder-secret-key",
      STAFF_EMAIL: "info@true-color.ca",
      SOCIAL_BUSINESS_SCOPING_ENABLED: "false",
      SOCIAL_PUBLISHING_ENABLED: "false",
      OPENROUTER_API_KEY: "",
    } } : {}),
  }] : []),
];

export default defineConfig({
  testDir: "./e2e-playwright",
  testIgnore: ["**/tutorials/**"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: webServers.length ? webServers : undefined,
});
