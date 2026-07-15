import { describe, expect, it } from "vitest";
import { isPublicOrganicPath } from "../ga4-client";

describe("isPublicOrganicPath", () => {
  it.each([
    "/",
    "/sticker-printing-saskatoon",
    "/coroplast-signs-saskatoon",
    "/products",
    "/quote",
    "/staffing",
    "/apiary",
    "/cartoon-printing",
    "/accounting-forms",
  ])("keeps public indexable path %s", (path) => {
    expect(isPublicOrganicPath(path)).toBe(true);
  });

  it.each([
    "",
    "staff/orders",
    "/staff",
    "/staff/orders",
    "/api/estimate",
    "/pay/token",
    "/pay",
    "/cart",
    "/checkout",
    "/order-confirmed",
    "/account",
    "/account/callback",
    "/payment/success",
    "/quote/private-id",
    "/products/stickers",
  ])("removes private or noindex path %s", (path) => {
    expect(isPublicOrganicPath(path)).toBe(false);
  });
});
