import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Graphic Design Saskatoon | Logos & Layouts | True Color" },
  description:
    "In-house Photoshop designer in Saskatoon. Custom logos, artwork modifications, print-ready layouts for banners, signs, business cards & flyers. Design + print in one shop. $35 flat for standard layouts.",
  alternates: { canonical: "/graphic-design-saskatoon" },
  openGraph: {
    title: "Graphic Design Saskatoon | Custom Artwork & Print Layouts | True Color",
    description:
      "In-house Photoshop designer. Custom logos, artwork mods, print layouts from $35. Design + print in one shop. Local pickup 216 33rd St W, Saskatoon.",
    url: "https://truecolorprinting.ca/graphic-design-saskatoon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function GraphicDesignSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="graphic-design-saskatoon"
      primaryProductSlug="vinyl-banners"
      title="Graphic Design — Saskatoon"
      subtitle="Design + print in one shop. In-house Photoshop wizard. From sketch to finished sign."
      heroImage="/images/products/heroes/construction-hero-1200x500.webp"
      heroAlt="Custom graphic design and printing in Saskatoon by True Color Display Printing"
      description={
        "Most print shops in Saskatoon make you show up with a print-ready file. True Color is different — our in-house designer handles everything from a rough idea to a finished, print-ready layout, and then prints it the same day. No outsourcing, no agency mark-ups, no back-and-forth with a freelancer who's never seen a commercial printer. Your designer and your printer are in the same building.\n\nOur designer specializes in Photoshop-level custom work: logos built from scratch, artwork modified to fit new dimensions, low-resolution files cleaned up for large-format printing, full layouts for banners, signs, flyers, business cards, vehicle magnets, and retractable stands. If you've got a vision but not the software, that's exactly what we're here for. Bring a napkin sketch, a reference photo, or just a description — we'll build it.\n\nStandard design layouts (business cards, flyers, basic banners) start at $35 flat — that covers your initial layout and two rounds of revisions. Complex projects like full logo creation, multi-panel trade show displays, or vehicle wrap layouts are quoted individually. Either way, you'll have a proof to approve before anything goes to print.\n\nEvery file we create is yours to keep. We send the print-ready PDF, and if you want the source file in PSD or AI format, just ask — no ransom fees. You paid for the design work, you own the artwork.\n\nTurnaround is fast because everything happens in-house. Submit your brief by 10 AM and most standard layouts come back as a proof the same day. Rush design is available on the same +$40 flat fee as our rush printing. If you need a banner designed and in your hands by 5 PM today, call (306) 954-8688 — it happens more often than you'd think.\n\nSaskatoon businesses, contractors, real estate agents, event organizers, and community groups rely on True Color because design and print in one shop means fewer emails, fewer handoffs, and no delays waiting for files to move between vendors. Come in, describe what you need, leave with a finished product."
      }
      products={[
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Business Cards", from: "from $45 / 250", slug: "business-cards" },
        { name: "Flyers", from: "from $110 / 250", slug: "flyers" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
      ]}
      whyPoints={[
        "Full-time in-house Photoshop designer — not a template tool, not an AI generator",
        "Standard layout fee: $35 flat (business cards, flyers, single-panel banners)",
        "Complex design (logos, multi-product, full vehicle layouts) — quoted same day",
        "Same-day proofs on most standard jobs submitted before 10 AM",
        "All file formats accepted: AI, PSD, PDF, PNG, JPG, even a phone photo of your sketch",
        "You own the artwork — source files included, no ransom fees",
        "Design + print in one building — no file handoff delays",
        "Rush design + print available for +$40 flat — call to confirm capacity",
      ]}
      faqs={[
        {
          q: "How much does graphic design cost in Saskatoon?",
          a: "Standard print layouts — business cards, flyers, single-panel banners, yard signs — start at $35 flat at True Color. That covers the initial layout and two revision rounds. Logo creation, complex multi-product designs, or vehicle wrap layouts are quoted individually — call (306) 954-8688 or submit a quote request online and we'll get back to you same day.",
        },
        {
          q: "Can you design and print in the same shop?",
          a: "Yes — and that's what makes True Color different from most Saskatoon print shops. Our full-time designer works in the same building as our Roland UV printer. You submit your brief, get a proof, approve it, and your finished product is on the press immediately. No files moving between vendors, no delays.",
        },
        {
          q: "Do you create logos from scratch?",
          a: "Yes. Our designer builds custom logos in Photoshop from a description, reference images, or rough sketches. You'll receive a print-ready file plus source files you can use anywhere. Logo projects are quoted individually — most simple logos are $75–$150 depending on complexity.",
        },
        {
          q: "Can you modify or resize my existing artwork?",
          a: "Absolutely — file modification is one of the most common requests. Low-resolution logos cleaned up for large-format, existing designs resized to new dimensions, adding or removing elements, changing colours to match updated branding. Send us what you have and we'll quote it same day.",
        },
        {
          q: "What file formats do you accept?",
          a: "We accept everything: AI, PSD, EPS, PDF, PNG, JPG, even a photo you took of a printed piece. If you don't have a file at all, that's fine — describe what you want or bring a reference and our designer builds it from scratch.",
        },
        {
          q: "Do I get to keep the design files?",
          a: "Yes. You own the artwork. We provide a print-ready PDF as standard, and the source file (PSD or AI) is yours on request. No licensing fees, no usage restrictions — it's your design.",
        },
        {
          q: "How fast is graphic design turnaround?",
          a: "Most standard layouts (business cards, flyers, single banners) come back as a proof the same day if submitted before 10 AM. Complex jobs (logos, multi-product campaigns) are typically 1–2 business days. Rush design is available as part of our +$40 same-day rush option — call (306) 954-8688 to confirm.",
        },
        {
          q: "Can you design for multiple products at once?",
          a: "Yes — this is one of the biggest advantages of having design and print in one shop. Submit a campaign brief (for example: banner + flyers + business cards + window decal) and our designer builds a consistent package across all formats. One design fee, multiple print products, picked up same day or next day.",
        },
      ]}
    />
  );
}
