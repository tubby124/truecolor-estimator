import { NextResponse } from "next/server";

/**
 * Debug endpoint — fires a real $1.00 test checkout at Clover and returns
 * the raw HTTP status + response body so we can see exactly what error
 * Clover returns.
 *
 * Usage: GET /api/debug/clover-test?secret=tc2026
 *
 * Remove this file once payments are confirmed working.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== "tc2026") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const privateKey = process.env.CLOVER_ECOMM_PRIVATE_KEY;
  const merchantId = process.env.CLOVER_MERCHANT_ID;
  const env = process.env.CLOVER_ENVIRONMENT ?? "production";

  const BASE_URL =
    env === "sandbox"
      ? "https://apisandbox.dev.clover.com/invoicingcheckoutservice"
      : "https://www.clover.com/invoicingcheckoutservice";

  const endpoint = `${BASE_URL}/v1/checkouts`;

  const body = {
    shoppingCart: {
      lineItems: [{ name: "Test Payment — True Color", unitQty: 1, price: 100 }],
    },
  };

  let status: number;
  let responseBody: unknown;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${privateKey}`,
        "X-Clover-Merchant-Id": merchantId ?? "",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    status = res.status;
    const text = await res.text();
    try {
      responseBody = JSON.parse(text);
    } catch {
      responseBody = text;
    }
  } catch (err) {
    return NextResponse.json({
      error: "fetch_threw",
      message: err instanceof Error ? err.message : String(err),
      endpoint,
      env,
      merchantId: merchantId ? `${merchantId.slice(0, 4)}…` : "MISSING",
      privateKey: privateKey ? `${privateKey.slice(0, 8)}…` : "MISSING",
    });
  }

  return NextResponse.json({
    endpoint,
    env,
    merchantId: merchantId ? `${merchantId.slice(0, 4)}…` : "MISSING",
    privateKey: privateKey ? `${privateKey.slice(0, 8)}…` : "MISSING",
    httpStatus: status,
    cloverResponse: responseBody,
  });
}
