import { NextResponse } from "next/server";
import { renderMerchantLocalInventoryXml } from "@/lib/merchant/merchant-catalog";

export const revalidate = 3600;
export const dynamic = "force-static";

const SITE_URL = "https://truecolorprinting.ca";

export async function GET(): Promise<Response> {
  return new NextResponse(renderMerchantLocalInventoryXml(SITE_URL), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
