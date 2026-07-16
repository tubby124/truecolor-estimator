import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("root Google tag ordering", () => {
  it("bootstraps the queue before hydration and loads the external library afterward", () => {
    const source = readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");
    expect(source).toMatch(/id="google-tag-bootstrap"\s+strategy="beforeInteractive"/);
    expect(source).toContain("buildGoogleTagBootstrapScript");
    expect(source).toMatch(/googletagmanager\.com\/gtag\/js\?id=G-6HMQT7MNLL[\s\S]*strategy="afterInteractive"/);
    expect(source).not.toContain('id="ga4-init" strategy="lazyOnload"');
  });
});
