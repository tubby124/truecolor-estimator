import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

describe("retired historical GA4 entry point", () => {
  it.each([{ args: [] }, { args: ["--dry-run"] }, { args: ["--execute"] }, { args: ["--unknown", "--days=30"] }])("always refuses %j", ({ args }) => {
    const result = spawnSync(process.execPath, ["scripts/ga4-backfill.mjs", ...args], { encoding: "utf8", env: { NODE_ENV: "test" } });
    expect(result.status).toBe(1); expect(result.stderr).toContain("backfill is disabled");
  });
  it("has no imports, network, credential access or dynamic evaluation", () => {
    const source = readFileSync("scripts/ga4-backfill.mjs", "utf8");
    expect(source).not.toMatch(/\b(import|require|fetch|eval)\s*[({]|process\.env|https?:\/\//);
  });
});
