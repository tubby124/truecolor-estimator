import { NextRequest, NextResponse } from "next/server";
import { createCloverCheckout } from "@/lib/payment/clover";

export interface CheckoutRequestBody {
  items: Array<{
    product_name: string;
    label: string;
    sell_price: number; // pre-tax
  }>;
  contact: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
  };
  is_rush: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutRequestBody;
    const { items, contact, is_rush } = body;

    if (!items?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (!contact?.email || !contact?.name) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const subtotal = items.reduce((sum, i) => sum + i.sell_price, 0);
    const rush = is_rush ? 40 : 0;
    const gst = (subtotal + rush) * 0.05;
    const totalDollars = subtotal + rush + gst;
    const totalCents = Math.round(totalDollars * 100);

    // Build a short description for Clover line item
    const description =
      items.length === 1
        ? `${items[0].product_name} — ${items[0].label}`
        : `True Color Order (${items.length} items)${is_rush ? " + Rush" : ""}`;

    const { checkoutUrl } = await createCloverCheckout(
      totalCents,
      description,
      contact.email
    );

    return NextResponse.json({ checkoutUrl, totalCents });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("[checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
