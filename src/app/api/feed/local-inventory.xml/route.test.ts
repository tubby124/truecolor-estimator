import { describe, expect, it } from "vitest";
import { GET as getProducts } from "@/app/api/feed/products.xml/route";
import { GET as getInventory } from "./route";
import { MERCHANT_OFFER_COUNT, MERCHANT_STORE_CODE } from "@/lib/merchant/merchant-catalog";

function values(xml: string, tag: string): string[] {
  return [...xml.matchAll(new RegExp(`<g:${tag}>([^<]+)</g:${tag}>`, "g"))].map((match) => match[1]);
}

describe("Merchant Center local inventory feed", () => {
  it("matches every primary offer to the verified store as made-to-order pickup", async () => {
    const productXml = await (await getProducts()).text();
    const inventoryResponse = await getInventory();
    const inventoryXml = await inventoryResponse.text();

    const productIds = values(productXml, "id");
    const inventoryIds = values(inventoryXml, "id");
    expect(inventoryResponse.headers.get("content-type")).toContain("application/xml");
    expect(inventoryIds).toEqual(productIds);
    expect(values(inventoryXml, "store_code")).toEqual(Array(MERCHANT_OFFER_COUNT).fill(MERCHANT_STORE_CODE));
    expect(values(inventoryXml, "availability")).toEqual(Array(MERCHANT_OFFER_COUNT).fill("out_of_stock"));
    expect(values(inventoryXml, "pickup_sla")).toEqual(Array(MERCHANT_OFFER_COUNT).fill("multi-week"));
    expect(values(inventoryXml, "price")).toEqual(values(productXml, "price"));
  });
});
