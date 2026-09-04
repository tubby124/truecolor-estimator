import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { COMMERCE_POLICY } from "@/lib/commerce/policies";

export const metadata: Metadata = {
  title: "Pickup & Shipping | True Color Display Printing",
  description: "Pickup and shipping information for True Color Display Printing.",
  alternates: { canonical: "/shipping" },
};

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <main id="main-content" className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-[#1c1712] mb-4">Pickup &amp; Shipping</h1>
        <p className="text-gray-500 mb-12">Clear fulfillment details before you order.</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#1c1712] mb-3">Free pickup</h2>
            <p>{COMMERCE_POLICY.pickup.summary}</p>
            <p>{COMMERCE_POLICY.pickup.address}</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#1c1712] mb-3">Production timing</h2>
            <p>{COMMERCE_POLICY.production.summary}</p>
            <p>{COMMERCE_POLICY.rush.summary}</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#1c1712] mb-3">Shipping quotes</h2>
            <p>{COMMERCE_POLICY.shipping.summary}</p>
            <p>
              To request a shipping quote, contact us with your final job and destination details.
              We will provide the shipping quote before you accept it.
            </p>
            <Link href="/quote" className="text-[#16C2F3] hover:underline font-semibold">
              {COMMERCE_POLICY.shipping.requestLabel}
            </Link>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
