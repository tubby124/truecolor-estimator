import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for True Color Display Printing Ltd.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-[#1c1712] mb-4">Privacy Policy</h1>
        <p className="text-gray-500 mb-12">
          Last updated: February 2026 · True Color Display Printing Ltd.
        </p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#1c1712] mb-3">1. Who We Are</h2>
            <p>
              True Color Display Printing Ltd. operates at 216 33rd Street West (upstairs), Saskatoon,
              SK S7L 0V5. We can be reached at{" "}
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

          <section>
            <h2 className="text-xl font-bold text-[#1c1712] mb-3">2. Information We Collect</h2>
            <p>When you use our online price estimator or contact us, we may collect:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Your name and email address (when you request a quote)</li>
              <li>Phone number (optional, if provided)</li>
              <li>Order details (product type, dimensions, quantity)</li>
              <li>Payment information (processed securely — we do not store card numbers)</li>
              <li>Files you upload for printing (stored securely, used only for your order)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1c1712] mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To process and fulfill your print order</li>
              <li>To send you your quote by email</li>
              <li>To contact you about your order status</li>
              <li>To send marketing emails (only if you opt in — unsubscribe at any time)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1c1712] mb-3">4. PIPEDA Compliance</h2>
            <p>
              We comply with Canada&apos;s Personal Information Protection and Electronic Documents Act
              (PIPEDA). You may request access to, correction of, or deletion of your personal
              information by emailing{" "}
              <a href="mailto:info@true-color.ca" className="text-[#16C2F3] hover:underline">
                info@true-color.ca
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1c1712] mb-3">5. Data Retention</h2>
            <p>
              We retain order records for 7 years as required by Canadian tax law. You may request
              deletion of marketing data at any time. Uploaded print files are deleted within 90 days
              of order completion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1c1712] mb-3">6. Third Parties</h2>
            <p>We use the following services that may process your data:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>Vercel</strong> — website hosting (servers in North America)
              </li>
              <li>
                <strong>Clover</strong> — payment processing (PCI DSS compliant)
              </li>
              <li>
                <strong>Supabase</strong> — secure order database
              </li>
            </ul>
            <p className="mt-2">
              We do not sell your personal information to any third party.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#1c1712] mb-3">7. Contact</h2>
            <p>
              Questions about this policy? Email us at{" "}
              <a href="mailto:info@true-color.ca" className="text-[#16C2F3] hover:underline">
                info@true-color.ca
              </a>{" "}
              or call{" "}
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
