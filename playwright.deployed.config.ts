import { defineConfig } from "@playwright/test";

// Deployed smoke only: default production, or pass PLAYWRIGHT_BASE_URL for a
// staging host. Deliberately no webServer so the runner never starts localhost.
export default defineConfig({
  testDir: "./e2e-playwright",
  testIgnore: ["**/tutorials/**"],
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "https://truecolorprinting.ca",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "deployed-mobile", use: { browserName: "chromium" } }],
});
