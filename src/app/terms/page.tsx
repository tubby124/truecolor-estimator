import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for True Color Display Printing Ltd.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-[#1c1712] mb-4">Terms of Service</h1>
        <p className="text-gray-500 mb-12">
          Last updated: February 2026 · True Color Display Printing Ltd.
        </p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#1c1712] mb-3">1. Acceptance</h2>
            <p>
              By placing an order with True Color Display Printing Ltd., you agree to these Terms of
              Service. These terms govern all orders placed online, by phone, or in person at
              216 33rd St W, Saskatoon SK.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1c1712] mb-3">2. Orders and Artwork</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                All prices shown online are estimates. Final price is confirmed at order placement
                based on exact dimensions, materials, and quantities.
              </li>
              <li>
                You are responsible for the accuracy of all artwork and content submitted. We print
                what you provide.
              </li>
              <li>
                We reserve the right to refuse orders for content that is illegal, defamatory, or
                otherwise objectionable.
              </li>
              <li>
                File requirements: PDF (preferred), PNG, JPG, or AI. Minimum 150 DPI for large-format
                print. We offer in-house design services if you need help.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1c1712] mb-3">3. Payment</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All prices are in Canadian dollars (CAD) plus 5% GST.</li>
              <li>Payment is required before production begins.</li>
              <li>
                We accept credit/debit (Visa, Mastercard, Amex), Interac eTransfer to
                info@true-color.ca, and cash in-person.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1c1712] mb-3">4. Turnaround and Pickup</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Standard turnaround is 1–3 business days after artwork approval and payment. Rush
                service (same day or next morning) is available for an additional flat fee — confirm
                availability when ordering.
              </li>
              <li>
                Orders are available for pickup at 216 33rd St W (upstairs), Saskatoon, SK S7L 0N6.
                We will notify you when your order is ready.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1c1712] mb-3">5. Reprints and Refunds</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                If we make a production error (wrong size, wrong colour due to our equipment), we
                will reprint at no cost.
              </li>
              <li>
                Reprints are not available for errors in customer-submitted artwork, including
                typos, wrong dimensions, or incorrect files.
              </li>
              <li>
                Orders cancelled before production begins are eligible for a full refund. Orders
                already in production cannot be cancelled.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1c1712] mb-3">6. Limitation of Liability</h2>
            <p>
              Our liability is limited to the value of your order. We are not liable for any
              indirect, incidental, or consequential damages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1c1712] mb-3">7. Contact</h2>
            <p>
              Questions?{" "}
              <a href="mailto:info@true-color.ca" className="text-[#16C2F3] hover:underline">
                info@true-color.ca
              </a>{" "}
              or{" "}
              <a href="tel:+13069548688" className="text-[#16C2F3] hover:underline">
                (306) 954-8688
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
