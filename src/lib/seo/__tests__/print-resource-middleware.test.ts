import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { guardPrintResourcePath, middleware } from "@/middleware";

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
    const response = await middleware(
      new NextRequest(
        "https://truecolorprinting.ca/print-resources/trade-show-print-kit",
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
