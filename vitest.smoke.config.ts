import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["e2e/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/e2e-playwright/**"],
  },
});
