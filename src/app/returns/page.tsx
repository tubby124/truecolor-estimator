import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { COMMERCE_POLICY } from "@/lib/commerce/policies";

export const metadata: Metadata = {
  title: "Returns & Reprints | True Color Display Printing",
  description: "Returns and reprint information for True Color Display Printing.",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <main id="main-content" className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-[#1c1712] mb-4">Returns &amp; Reprints</h1>
        <p className="text-gray-500 mb-12">Our policy for custom print work.</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#1c1712] mb-3">Custom print policy</h2>
            <p>{COMMERCE_POLICY.returns.summary}</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#1c1712] mb-3">Report a problem</h2>
            <p>
              Contact us within {COMMERCE_POLICY.returns.reportWindow} of receiving your order so
              we can review the issue. Please keep the printed item available while we verify the
              defect or True Color error.
            </p>
            <p>
              We cannot reprint work for errors in customer-provided artwork, including typos,
              incorrect dimensions, or incorrect files.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#1c1712] mb-3">Privacy</h2>
            <p>{COMMERCE_POLICY.privacy.summary}</p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
