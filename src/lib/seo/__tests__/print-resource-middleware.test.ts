import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { guardPrintResourcePath, proxy } from "@/proxy";

describe("print resource middleware guard", () => {
  it("returns an actual noindex 404 response for an unknown resource slug", () => {
    const response = guardPrintResourcePath(
      "/print-resources/not-a-real-resource",
    );

    expect(response).not.toBeNull();
    expect(response?.status).toBe(404);
    expect(response?.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("passes known resources and unrelated paths through unchanged", () => {
    expect(
      guardPrintResourcePath(
        "/print-resources/coroplast-sign-template-18x24",
      ),
    ).toBeNull();
    expect(guardPrintResourcePath("/products/coroplast-signs")).toBeNull();
  });

  it("lets a known public resource through without requiring auth configuration", async () => {
    const response = await proxy(
      new NextRequest(
        "https://truecolorprinting.ca/print-resources/trade-show-print-kit",
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("keeps payment-link responses private and free of attribution cookies", async () => {
    const response = await proxy(
      new NextRequest("https://truecolorprinting.ca/pay/invalid-token?gclid=click-id"),
    );

    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
