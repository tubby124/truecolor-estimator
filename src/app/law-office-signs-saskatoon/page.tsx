import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Law Office Signs Saskatoon | ACP & Cards | True Color" },
  description:
    "ACP aluminum signs, business cards, and lobby displays for Saskatoon law firms, notaries, and accountants. From $13/sqft. In-house designer $35. Local pickup.",
  alternates: { canonical: "/law-office-signs-saskatoon" },
  openGraph: {
    title: "Law Office Signs Saskatoon | True Color Display Printing",
    description:
      "Signage for Saskatoon law firms and financial advisors. ACP directories from $13/sqft, business cards 500 for $65. Same-day rush available.",
    url: "https://truecolorprinting.ca/law-office-signs-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

const descriptionNode = (
  <>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      Your firm name on a crooked, faded exterior sign tells clients something before they walk in
      the door. ACP aluminum composite panels from $13/sqft are the standard for permanent suite
      signs, building directories, and reception wall plaques — rigid, UV-resistant, and built to
      last 10+ years on an exterior fascia or interior wall. Our in-house Roland UV printer locks
      colour panel to panel, so your firm name reads the same on the door sign as it does on the
      lobby directory. An 18×24&quot; panel is $60 (minimum applies). A 24×36&quot; panel is $66. Bring your slot
      dimensions and we cut to size.
    </p>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      New partner joining the firm? Business cards for a single associate print in 24–48 hours —
      500 two-sided cards for $65. Batch orders for entire firms get one proof round, one
      pickup, one invoice. Brochures summarizing practice areas run $70 for 100 tri-fold copies,
      useful for client intake areas and referral partners. Retractable banner stands from $219
      work well in waiting rooms, at firm events, or at networking conferences.
      Same-day rush is available for +$40 flat when ordered before 10 AM — call
      (306) 954-8688 to confirm availability.
    </p>
    <p className="text-gray-600 text-lg leading-relaxed">
      Our in-house designer handles layout for $35 flat with a same-day proof, so you don&apos;t
      need production-ready files. We match your existing brand guide, letterhead colours, and logo
      standards exactly. Pickup at 216 33rd St W, Saskatoon. Need aluminum composite for an
      exterior building sign?{" "}
      <Link
        href="/aluminum-signs-saskatoon"
        className="text-[#16C2F3] underline font-medium"
      >
        See our full ACP aluminum sign options
      </Link>
      . Ordering cards for the whole firm?{" "}
      <Link
        href="/business-cards-saskatoon"
        className="text-[#16C2F3] underline font-medium"
      >
        Visit our business card printing page
      </Link>{" "}
      for stock, size, and quantity pricing.
    </p>
  </>
);

export default function LawOfficeSignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="law-office-signs-saskatoon"
      primaryProductSlug="acp-signs"
      title="Law Office Signs Saskatoon"
      subtitle="ACP suite signs, lobby directories, and business cards for Saskatoon legal and financial professionals."
      heroImage="/images/products/heroes/healthcare-hero-1200x500.webp"
      heroAlt="Professional ACP aluminum signs and business cards for Saskatoon law offices printed by True Color Display Printing"
      description="Your firm name on a crooked, faded exterior sign tells clients something before they walk in. ACP aluminum composite panels from $13/sqft are the standard for permanent suite signs, building directories, and reception wall plaques — rigid, UV-resistant, 10+ years outdoor lifespan. Our in-house Roland UV printer locks colour panel to panel. New partner? Business cards print in 24–48 hours, 500 two-sided for $65. In-house designer $35 flat, same-day proof. Pickup at 216 33rd St W, Saskatoon."
      descriptionNode={descriptionNode}
      products={[
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Foamboard Displays", from: "from $10/sqft", slug: "foamboard-displays" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Business Cards", from: "500 for $65", slug: "business-cards" },
        { name: "Brochures", from: "100 for $70", slug: "brochures" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
      ]}
      whyPoints={[
        "ACP aluminum suite signs from $13/sqft — colour stays true for 10+ years on exterior fascia or interior wall",
        "Building directory panels custom-cut to your lobby dimensions — no guesswork on sizing",
        "500 two-sided business cards for $65 — batch orders for entire firms, one proof, one pickup",
        "Brochures for practice area summaries — 100 tri-fold copies for $70",
        "Retractable banner stands from $219 — waiting rooms, firm events, and networking conferences",
        "In-house designer $35 flat — matches your brand guide exactly, same-day proof",
        "Same-day rush +$40 flat — order before 10 AM for same-day pickup",
      ]}
      faqs={[
        {
          q: "What is the best sign material for a law office exterior suite sign?",
          a: "3mm aluminum composite (ACP) is the standard for exterior suite signs. It's rigid, UV-resistant, and lasts 10+ years on a strip mall fascia or building exterior without warping or fading. ACP signs start at $13/sqft — a standard 18×24\" panel is $60 (minimum applies), a 24×36\" panel is $66. Bring your slot dimensions and we cut to size.",
        },
        {
          q: "Can you print a lobby directory panel for a multi-tenant professional building?",
          a: "Yes — we produce custom lobby directory panels in ACP or foam board at any size. Common sizes are 18×24\" up to 24×48\". ACP is best for permanent wall-mount installations. Bring your tenant list and we handle the layout for $35 flat with a same-day proof.",
        },
        {
          q: "How fast can you print business cards for a new associate?",
          a: "Standard turnaround is 1–3 business days after artwork approval. Same-day rush is +$40 flat if ordered before 10 AM — call (306) 954-8688 to confirm. We keep your existing card file on record, so adding a new associate is a quick edit, not a full redesign. 250 cards from $45, 500 two-sided from $65.",
        },
        {
          q: "Do you print practice area brochures for law firm client intake areas?",
          a: "Yes — tri-fold brochures on gloss or matte stock are a common order for law offices. 100 copies for $70, 250 for $105. Our in-house designer can lay out your practice areas from a Word document or PDF for $35 flat. Standard turnaround 1–3 business days.",
        },
        {
          q: "Can you match our firm's existing brand colours and letterhead?",
          a: "Yes — bring your brand guide, Pantone references, or an existing printed piece. Our Roland UV printer produces consistent colour across every panel. If your letterhead uses a specific navy, burgundy, or gold, we match it panel to panel.",
        },
        {
          q: "What retractable banner options work for a law firm waiting room?",
          a: "The Economy 24×80\" stand from $219 is clean and understated for reception areas. The Deluxe ($299) has a wider base for higher-traffic areas. All stands include print and carry case. Common uses: new partner announcements, service overview displays, firm event backdrops.",
        },
        {
          q: "Do you offer rush turnaround for last-minute court or event deadlines?",
          a: "Same-day rush is +$40 flat — order before 10 AM and your job is prioritized for same-day completion. Call (306) 954-8688 to confirm availability before ordering. Standard 1–3 business days applies to all orders otherwise.",
        },
        {
          q: "Is there a minimum order for business cards or brochures?",
          a: "No artificial minimums. Business cards start at 250 copies for $45 (two-sided) or $65 (two-sided at 500). Brochures start at 100 copies for $70. We print single orders for sole practitioners and bulk runs for multi-partner firms at the same quality.",
        },
      ]}
    />
  );
}
