// Google Merchant Center / Meta Catalog product feed.
//
// XML format = Google Shopping (g: namespace). Meta Commerce Manager
// accepts the same feed via the "Use a data feed" option.
//
// Public feed URL: https://truecolorprinting.ca/feed/products.xml
// Legacy API URL remains available for existing external catalog configs.
//
// Generates the canonical, checkout-safe offer for each active product family.
// Cached at the edge for 1 hour to avoid hammering pricing data reads.

import { NextResponse } from "next/server";
import { renderMerchantFeedXml } from "@/lib/merchant/merchant-catalog";

export const revalidate = 3600;
export const dynamic = "force-static";

// Merchant Center verifies the submitted domain. This endpoint must never emit
// a preview or deployment URL from an environment variable.
const SITE_URL = "https://truecolorprinting.ca";

export async function GET(): Promise<Response> {
  const xml = renderMerchantFeedXml(SITE_URL);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
