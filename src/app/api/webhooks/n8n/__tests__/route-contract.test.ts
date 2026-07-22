import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("n8n webhook route contract", () => {
  it("keeps the mutating machine handler outside the staff API namespace", () => {
    expect(existsSync(join(
      process.cwd(),
      "src/app/api/staff/social/webhooks/n8n/route.ts",
    ))).toBe(false);
    expect(source("src/app/api/webhooks/n8n/route.ts")).toContain("constantTimeSecretEqual");
  });

  it("method-preservingly rewrites the legacy URL to the secured endpoint", () => {
    const config = source("next.config.ts");
    expect(config).toContain('source: "/api/staff/social/webhooks/n8n"');
    expect(config).toContain('destination: "/api/webhooks/n8n"');
  });

  it("shows the canonical webhook URL in staff settings", () => {
    const settings = source("src/app/staff/social/settings/page.tsx");
    expect(settings).toContain('/api/webhooks/n8n`');
    expect(settings).not.toContain('/api/staff/social/webhooks/n8n`');
  });
});
