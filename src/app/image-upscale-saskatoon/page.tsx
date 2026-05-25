import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Image Upscale Saskatoon | From $15 | True Color" },
  description:
    "AI image upscaling and photo restoration in Saskatoon. From $15. Free with $100+ print orders. Print-ready 300dpi files emailed same day. Roland UV print shop.",
  alternates: { canonical: "/image-upscale-saskatoon" },
  openGraph: {
    title: "Image Upscale & Photo Restoration Saskatoon | From $15 | True Color",
    description:
      "AI image upscaling from $15. Photo restoration from $75. FREE with any $100+ print order. Same-day delivery. Print-ready 300dpi files. Saskatoon print shop.",
    url: "https://truecolorprinting.ca/image-upscale-saskatoon",
    images: [{ url: "/images/products/og/image-upscale-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function ImageUpscaleSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="image-upscale-saskatoon"
      primaryProductSlug="vinyl-banners"
      title="Image Upscale & Photo Restoration — Saskatoon"
      subtitle="AI image upscaling and photo restoration. From $15. Free with $100+ print orders."
      heroImage="/images/products/heroes/image-upscale-hero-1200x500.webp"
      heroAlt="AI photo upscale and restoration service in Saskatoon — True Color"
      description={
        "Most Saskatoon print shops will quietly print your 800×600 logo at 4×8 feet and let you discover the blurry result when you pick up the banner. True Color doesn't. Our image upscale service uses professional AI upscaling to take low-resolution files — old logos from your 2014 website, wallet photos, social-media-sized JPGs — and rebuild them into print-ready 300dpi files at the exact size you need. Pricing is simple: $15 basic upscale (2× resolution, fits prints up to 12×18 inches), $35 enhanced (4× upscale with AI noise reduction and sharpening, banner-sized output), $75 full restoration (damaged photo repair, scratch removal, colour restoration). And here's the part most people miss — this service is FREE if you're placing a print order of $100 or more in the same session. You're paying for the print anyway; we'll fix the file for you.\n\nThis service exists because we kept seeing the same problem walk through the door at 216 33rd St W. A real estate agent has a 4×8 vinyl banner ready to print, but their headshot is a 600×400 LinkedIn export. A family wants a memorial sign for a loved one's celebration of life, but the only photo they have is a wallet-sized print from 1978. A contractor wants a vehicle magnet, but their logo file is a screenshot from their old website. A community group needs an A-frame coroplast sign for a Saskatchewan winter event, but the artwork they were given is 72dpi web export. Instead of telling people to come back when they have better files (which they can't get), we built this into our workflow.\n\nFile formats accepted: JPG, PNG, HEIC (iPhone photos), PDF, TIFF. We don't care how rough the source is — send us the screenshot, the iPhone photo of the printed business card, the scanned wallet photo, the PDF export from Canva. Output is a print-ready 300dpi file at whatever final print size you specified, emailed back to you for review and approval. This is a digital-only service — no product is shipped, you download the file from the email.\n\nTurnaround is same-day for $15 and $35 tiers when submitted before 10 AM through our in-house print shop. The $75 restoration tier takes 1–2 business days because damaged-photo repair (torn edges, missing corners, water damage, severe fading) needs manual Photoshop work on top of AI cleanup. If you're stacking this with a print job and want same-day on both, our +$40 flat rush moves the whole package to the front of the queue. If you also need design layout (logo placement, text added, multi-product matching artwork), that's our standard graphic design fee — $35 flat with same-day proof from our in-house Photoshop designer, separate from the upscale fee. The upscale fixes the resolution; the design fee covers actually laying out your finished sign or banner."
      }
      products={[
        { name: "Vinyl Banners", from: "from $66", slug: "vinyl-banners" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Business Cards", from: "from $45 / 250", slug: "business-cards" },
        { name: "Foamboard Displays", from: "from $45", slug: "foamboard-displays" },
      ]}
      whyPoints={[
        "Basic upscale $15 — 2× resolution, suitable for prints up to 12×18 inches",
        "Enhanced upscale $35 — 4× resolution with AI noise reduction and sharpening, banner-ready",
        "Full photo restoration $75 — damaged photo repair, scratch removal, colour restoration",
        "FREE with any print order of $100 or more in the same session",
        "Output is print-ready 300dpi at your final print size, emailed back same day",
        "All file formats accepted: JPG, PNG, HEIC, PDF, TIFF — even an iPhone photo of a printed business card",
        "Same-day turnaround on $15 and $35 tiers when submitted before 10 AM; 1–2 days for $75 restoration",
        "Digital-only service — nothing ships, you download the file from email",
      ]}
      faqs={[
        {
          q: "How much does AI image upscaling cost in Saskatoon?",
          a: "Three tiers: $15 basic upscale (2× resolution, fits prints up to 12×18 inches), $35 enhanced upscale (4× with AI noise reduction and sharpening, suitable for vinyl banners and large signs), and $75 full photo restoration (damaged photo repair, scratch removal, colour restoration on old or damaged photos). All three include a print-ready 300dpi file emailed back to you. Bundle with any print order of $100 or more and the upscale is FREE.",
        },
        {
          q: "Is the upscale really free with a print order?",
          a: "Yes. If your print order subtotal is $100 or more before tax, the basic and enhanced upscale tiers ($15 and $35) are included at no extra charge. The $75 photo restoration tier is also covered if it's needed to make your print order viable (e.g., the wallet photo for the memorial sign you're ordering). Just mention the upscale when you submit your quote — we apply the credit automatically.",
        },
        {
          q: "What's the most common use case?",
          a: "By far the most common: a customer wants a 4×8 vinyl banner ($176 in our standard tier) but the only logo file they have is an 800×600 export from their old website. Without upscaling, that prints as a blurry mess. The $35 enhanced tier rebuilds it to print-ready resolution at 48×96 inches. Banner cost + $35 upscale = sharp banner. Or, since the banner is over $100, the upscale is free.",
        },
        {
          q: "Can you restore an old or damaged family photo for a memorial sign?",
          a: "Yes — this is the $75 restoration tier. We repair torn edges, remove scratches and creases, fix faded colour, fill in missing corners, and upscale the result to print resolution. Most commonly used for memorial signs, gravestone artwork, and celebration-of-life displays. Turnaround is 1–2 business days because damaged-photo repair needs manual Photoshop work, not just AI cleanup. Pair with a $24 raw coroplast yard sign ($25 if ordered alone) or a $45 foamboard display and the restoration is free.",
        },
        {
          q: "What file formats do you accept?",
          a: "Everything common: JPG, PNG, HEIC (iPhone photos), PDF, TIFF. We also accept screenshots, photos-of-photos (where you snapped a phone pic of a printed business card or old print), and PDF exports from Canva or other web tools. If you're unsure whether your file will work, email it to info@true-color.ca and we'll tell you which tier ($15, $35, or $75) it needs before charging anything.",
        },
        {
          q: "How fast is turnaround?",
          a: "Same-day on $15 basic and $35 enhanced tiers when submitted before 10 AM. The $75 restoration tier is 1–2 business days because the manual repair work takes longer than AI upscaling alone. Need everything today including the print job? Our +$40 flat same-day rush moves the entire package — upscale plus print — to the front of the queue. Call (306) 954-8688 to confirm capacity before noon.",
        },
        {
          q: "How is this different from the $35 design fee?",
          a: "Different services, sometimes stacked. The upscale ($15/$35/$75) fixes the resolution of an image so it prints sharp. The design fee ($35 flat with same-day proof from our in-house Photoshop designer) covers actually laying out your finished sign, banner, or business card — placing the logo, adding text, matching colours across multiple products. If your logo is low-res AND you need a full layout built around it, you'd pay both ($35 upscale + $35 design = $70). If your logo is already print-ready and you just need it placed on a banner, it's design only.",
        },
        {
          q: "Where do I send my file and how do I receive the upscaled version?",
          a: "Email the original file to info@true-color.ca with the subject line 'Image upscale' and the print size you need (e.g., '4×8 ft vinyl banner' or '24×36 in coroplast sign'). We confirm the tier and price ($15, $35, or $75 — or free if bundled with a $100+ print order), invoice through Clover, and email back the print-ready 300dpi file the same business day for the standard tiers. Or drop in at 216 33rd St W, Saskatoon and we'll quote it in person.",
        },
      ]}
    />
  );
}
