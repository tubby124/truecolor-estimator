import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Real Estate Signs Saskatoon | Yard Signs, Cards & Magnets | True Color",
  description:
    "Coroplast yard signs for Saskatoon REALTORS from $30. Feature sheets, business cards, vehicle magnets, postcards. Same-day rush available. Local pickup 216 33rd St W.",
  alternates: { canonical: "/real-estate-signs-saskatoon" },
  openGraph: {
    title: "Real Estate Signs Saskatoon | True Color Display Printing",
    description:
      "Yard signs from $30. Feature sheets, cards, vehicle magnets. Same-day rush available. Local Saskatoon pickup at 216 33rd St W.",
    url: "https://truecolorprinting.ca/real-estate-signs-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function RealEstatePage() {
  return (
    <IndustryPage
      canonicalSlug="real-estate-signs-saskatoon"
      primaryProductSlug="coroplast-signs"
      title="Real Estate Signs Saskatoon"
      subtitle="Your listing goes live Tuesday. Your sign should too."
      heroImage="/images/products/heroes/realestate-exp-hero-1200x500.webp"
      heroAlt="Real estate yard signs Saskatoon"
      description={"Spring listing season means signs go up fast and open house weekends stack up. Saskatoon REALTORS and brokerages count on True Color for coroplast yard signs, feature sheets, business cards, postcards, and vehicle magnets — everything you need to market a listing and brand yourself on the drive. Standard turnaround is 1–3 business days. Same-day rush is available for $40 flat on orders placed before 10 AM — listing photos came back late, no problem. Our in-house designer handles low-res headshots, brokerage templates, and last-minute copy changes so your files are print-ready without hiring an outside designer. H-stakes are $2.50 each and ship with your signs — just press them into the ground and you're done. Need to brand your truck? 12×18\" vehicle magnets from $36 — your face and number visible at every showing, every open house. We're at 216 33rd St W, Saskatoon — most agents pick up on their way to a showing."}
      products={[
        { name: "Coroplast Signs", from: "from $30", slug: "coroplast-signs" },
        { name: "Business Cards", from: "from $40", slug: "business-cards" },
        { name: "Flyers & Feature Sheets", from: "from $45", slug: "flyers" },
        { name: "Postcards", from: "from $35", slug: "postcards" },
        { name: "Vehicle Magnets", from: "from $36", slug: "vehicle-magnets" },
      ]}
      whyPoints={[
        "18×24\" coroplast yard sign from $30 — standard REALTOR listing size, H-stakes included for $2.50 ea",
        "Double-sided signs available — face traffic from both directions on corner lots",
        "Same-day rush for $40 flat — listing photos came back late? Still doable",
        "Feature sheets (flyers) from $45 / 100 — gloss stock, double-sided, open house ready",
        "Vehicle magnets from $36 — brand your truck at showings, remove on personal time",
        "Postcards from $35 / 50 — just-listed mailers and open house invitations for the neighbourhood",
        "In-house designer handles brokerage templates, low-res headshots, last-minute edits",
        "Local pickup at 216 33rd St W — grab your order on the way to a showing",
      ]}
      faqs={[
        {
          q: "What size yard sign do most Saskatoon REALTORS order?",
          a: "18×24\" is the standard and most popular — visible from the street, fits standard H-stakes, and priced from $30. 24×36\" is common for higher-visibility listings, corner lots, and rural acreages. Both are available in single or double-sided.",
        },
        {
          q: "How fast can you print yard signs in Saskatoon?",
          a: "Standard turnaround is 1–3 business days from artwork approval. Same-day rush is available for $40 flat on most orders placed before 10 AM — call (306) 954-8688 to confirm availability for your quantity.",
        },
        {
          q: "Can you match my brokerage template?",
          a: "Yes — bring your brokerage brand guidelines, an existing sign, or a business card as reference and our in-house designer will match the layout. We work with RE/MAX, Century 21, eXp, Coldwell Banker, Royal LePage, and independent brokerages.",
        },
        {
          q: "What do REALTORS use vehicle magnets for?",
          a: "Most agents put a 12×18\" magnet on each door of their vehicle — face, name, brokerage, and phone number visible at every showing. Remove them on personal trips. No paint damage. From $36 each, $66 for a pair.",
        },
        {
          q: "Can I get just-listed postcards to mail to the neighbourhood?",
          a: "Yes — 4×6\" and 5×7\" postcards on 14pt gloss stock are mailable without an envelope. Perfect for just-listed and just-sold drops to surrounding households. From $35 for 50 postcards. Meet Canada Post admail specs.",
        },
        {
          q: "Do you print open house feature sheets?",
          a: "Yes — letter-size (8.5×11\") flyers on 80lb or 100lb gloss stock, double-sided, from $45 for 100 sheets. Bring your MLS listing photos and we'll lay out a professional feature sheet in-house.",
        },
      ]}
    />
  );
}
