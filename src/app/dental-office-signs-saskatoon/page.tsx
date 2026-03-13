import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Dental Office Signs Saskatoon | ACP & Cards | True Color" },
  description:
    "Business cards, ACP suite signs, and retractable banners for Saskatoon dental offices. New associate? Cards ready in 24–48 hrs. Local pickup at 216 33rd St W.",
  keywords: [
    "dental office signs saskatoon",
    "dental business cards saskatoon",
    "dental clinic signage saskatoon",
    "dentist office signs saskatoon",
    "ACP suite signs dental saskatoon",
    "dental waiting room displays saskatoon",
  ],
  alternates: { canonical: "/dental-office-signs-saskatoon" },
  openGraph: {
    title: "Dental Office Signs Saskatoon | True Color Display Printing",
    description:
      "Business cards for new associates in 24–48 hrs. ACP suite signs, retractable banners, and foamboard displays for Saskatoon dental clinics. Local pickup.",
    url: "https://truecolorprinting.ca/dental-office-signs-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

const descriptionNode = (
  <>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      Saskatoon dental clinics rely on True Color for{" "}
      <Link href="/business-cards-saskatoon" className="text-[#16C2F3] underline font-medium">
        business cards
      </Link>
      ,{" "}
      <Link href="/aluminum-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        ACP suite signs
      </Link>
      , and patient-facing displays. Multi-dentist practice? Order all your providers in one batch —
      one proof per associate, one pickup, one invoice. New associate starting this week? We
      print 250 cards in 24–48 hrs. Staples quotes 5 business days.
    </p>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">
      For clinics in newer suburban strips (Stonebridge, Evergreen, Brighton, McKercher), we size
      ACP signs to fit your specific fascia slot — bring the measurements and we handle the rest.{" "}
      <Link href="/retractable-banners-saskatoon" className="text-[#16C2F3] underline font-medium">
        Retractable banner stands
      </Link>{" "}
      from $219 complete work for new-patient promos at reception and community health fairs.{" "}
      <Link href="/window-decals-saskatoon" className="text-[#16C2F3] underline font-medium">
        Window decals
      </Link>{" "}
      for clinic hours and branding start at $11/sqft. In-house designer matches your existing brand
      colours exactly. Local pickup at 216 33rd St W.
    </p>
    <p className="text-gray-600 text-lg leading-relaxed">
      See all{" "}
      <Link href="/healthcare-signs-saskatoon" className="text-[#16C2F3] underline font-medium">
        healthcare signage options
      </Link>
      {" "}or go straight to{" "}
      <Link href="/flyer-printing-saskatoon" className="text-[#16C2F3] underline font-medium">
        flyer printing
      </Link>{" "}
      for patient welcome kits and dental health campaigns.
    </p>
  </>
);

export default function DentalOfficeSignsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="dental-office-signs-saskatoon"
      primaryProductSlug="business-cards"
      title="Dental Office Signs Saskatoon"
      subtitle="New associate starting Monday? Cards done by Friday. Local Saskatoon pickup."
      heroImage="/images/products/heroes/healthcare-hero-1200x500.webp"
      heroAlt="Business cards and signs for Saskatoon dental offices printed by True Color Display Printing"
      description="Business cards for Saskatoon dental offices start at 250 for $45 on 14pt gloss at True Color Display Printing — new associate starting this week? We print cards in 24–48 hours while Staples quotes 5 business days. Multi-dentist practice ordering for 4 providers? One batch, one proof per associate, one pickup at 216 33rd St W, one invoice. ACP aluminum suite signs from $13/sqft are the standard for dental clinic exteriors in Saskatoon strip malls — Stonebridge, Evergreen, Brighton, McKercher — and last 10+ years without fading or warping. A 24×18 inch exterior fascia sign is $60 ($60 minimum applies), a 24×36 inch building directory panel is $66. For waiting room displays and patient education signage, foam board prints start at $10/sqft with a $45 minimum — a 24×36 inch panel is $65, lightweight enough to hang or stand in a frame. Retractable banner stands from $219 complete work for new-patient promotions at reception, community health fairs, and dental association events. Window decals for clinic hours, branding, and seasonal promotions start at $11/sqft. Our in-house Roland UV printer produces consistent, accurate colour — bring your brand guide or a Pantone reference and we match it exactly. In-house designer handles layouts from your existing branding for $35 flat with same-day proof — no outside designer, no back-and-forth delays. Same-day rush printing is available for +$40 flat on orders placed before 10 AM — call (306) 954-8688 to confirm. Standard turnaround is 1–3 business days after artwork approval. We keep your artwork on file so reorders for new associates are fast — call with the quantity and we pull your file. Flyers for dental health campaigns and new patient welcome kits are available from $45 for 100 copies on 80lb gloss. Postcards for appointment reminders and direct mail start at 50 for $40 on 14pt stock. Local Saskatoon pickup at 216 33rd St W, Saskatchewan."
      descriptionNode={descriptionNode}
      products={[
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Retractable Banners", from: "from $219", slug: "retractable-banners" },
        { name: "Foamboard Displays", from: "from $10/sqft", slug: "foamboard-displays" },
        { name: "Window Decals", from: "from $11/sqft", slug: "window-decals" },
        { name: "Flyers", from: "100 for $45", slug: "flyers" },
      ]}
      whyPoints={[
        "New associate? 250 business cards printed and ready in 24–48 hrs — Staples quotes 5 business days",
        "Multi-dentist clinic? Order all providers in one batch — one proof, one pickup, one price",
        "ACP suite signs sized to your specific strip mall fascia slot — permanent, professional, 10+ year lifespan",
        "Retractable banner stands from $219 — new-patient promos at reception, health fairs, community events",
        "In-house designer matches your existing brand colours exactly — no outside designer needed",
        "Same-day rush available — $40 flat, order before noon, pick up next morning at 216 33rd St W",
      ]}
      faqs={[
        {
          q: "What card stock do most dental offices choose?",
          a: "Most dental clinics choose 14pt gloss or matte — it feels premium in a patient's hand and holds up to being carried in a wallet or pocket. Both are available in single or double-sided. 250 cards from $45, 1000 cards from $110.",
        },
        {
          q: "We have 4 dentists — can we order all their cards at once?",
          a: "Yes — batch orders are our most common dental order. You get one proof per provider, one pickup appointment, and one invoice. We keep each associate's file on record so reorders are fast when the next hire joins.",
        },
        {
          q: "How fast can you turn around cards for a new hire starting Monday?",
          a: "Order Friday before noon and cards are ready Saturday morning or first thing Monday. Standard turnaround is 1–3 business days from artwork approval. Same-day rush is +$40 flat if ordered before 10 AM. Call (306) 954-8688 to confirm.",
        },
        {
          q: "What size is an ACP suite sign for a strip mall exterior?",
          a: "The most common sizes for exterior suite fascia are 24×18\" and 24×36\". We recommend measuring your specific slot — bring the dimensions and we cut to size. 3mm aluminum composite (ACP) is the standard for exterior signs: rigid, weather-resistant, 10+ year lifespan.",
        },
        {
          q: "Can you match our existing brand guide and logo colours?",
          a: "Yes — send us your brand guide, a Pantone reference, or an existing printed piece. Our Roland UV printer produces consistent, accurate colour. If you have existing cards from another printer, bring a sample and we'll match it.",
        },
        {
          q: "How do we reorder without re-uploading everything?",
          a: "We keep your artwork on file. Call or email with your order number and quantity — we pull your file and print. No re-uploading, no re-proofing unless something has changed (new associate, new phone number, new address).",
        },
        {
          q: "How much do window decals for dental clinic hours cost in Saskatoon?",
          a: "Window decals start at $11/sqft at True Color Display Printing with a $45 minimum. A typical clinic hours and logo decal (2×3 ft) runs about $66. Frosted privacy film and one-way window graphics are also available. Decals are removable without residue — easy to update when clinic hours change or a new associate joins.",
        },
        {
          q: "Can you print patient flyers and appointment reminder postcards?",
          a: "Yes — 80lb gloss flyers for dental health campaigns and new patient welcome kits start at 100 for $45 (2-sided). Postcards for appointment reminders and direct mail to surrounding neighbourhoods start at 50 for $40 on 14pt gloss (4×6 inch, always double-sided). Our in-house designer can create the layout from your branding for $35 flat.",
        },
      ]}
    />
  );
}
