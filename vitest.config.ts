import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // e2e/ smoke tests hit the live Vercel URL — run separately with npm run test:smoke
    // e2e-playwright/ specs run under Playwright (npx playwright test) — not vitest
    exclude: ["**/node_modules/**", "**/e2e/**", "**/e2e-playwright/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
