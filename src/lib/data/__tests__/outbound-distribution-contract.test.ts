import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("stale outbound distribution quarantine", () => {
  it("keeps the legacy GBP and social sources explicitly quarantined", () => {
    for (const file of ["src/lib/data/gbp-products.json", "src/lib/data/social-schedule.json"]) {
      expect(JSON.parse(source(file))._distribution.status).toBe("quarantined");
    }
  });

  it("refuses generation while a source remains quarantined", () => {
    expect(source("scripts/build-gbp-upload.py")).toContain('get("_distribution", {}).get("status") != "approved"');
    expect(source("scripts/build-social-schedule.py")).toContain('get("_distribution", {}).get("status") != "approved"');
  });
});
