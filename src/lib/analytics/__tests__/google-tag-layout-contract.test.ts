import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("root Google tag ordering", () => {
  it("bootstraps public pages before hydration while keeping payment links tag-free", () => {
    const source = readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");
    expect(source).toMatch(/id="google-tag-bootstrap"\s+strategy="beforeInteractive"/);
    expect(source).toContain("buildGoogleTagBootstrapScript");
    // The Ads tag must be passed from the layout, or the account-level tag silently
    // never loads — the exact gap that left the site GA4-only until 2026-08-07.
    expect(source).toContain("NEXT_PUBLIC_GOOGLE_ADS_TAG_ID");
    expect(source).toContain("buildGoogleTagDocumentScript");
    expect(source).not.toMatch(/googletagmanager\.com\/gtag\/js\?id=G-6HMQT7MNLL[\s\S]*strategy="afterInteractive"/);
    expect(source).not.toContain('id="ga4-init" strategy="lazyOnload"');
    expect(source).toMatch(/const geistMono = localFont\([\s\S]*?preload: false/);
  });
});
