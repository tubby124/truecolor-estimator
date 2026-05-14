import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Image Upscaling Moose Jaw SK | From $40 | True Color" },
  description:
    "AI image upscaling and photo enhancement for Moose Jaw businesses. Print-ready files from low-res sources. From $40 flat. Same-day digital delivery.",
  alternates: { canonical: "/image-upscale-moose-jaw-sk" },
  openGraph: {
    title: "Image Upscaling Moose Jaw SK | True Color Display Printing",
    description:
      "AI image upscaling 4×–8×. Print-ready files from low-res photos. From $40 flat. Same-day digital delivery to Moose Jaw.",
    url: "https://truecolorprinting.ca/image-upscale-moose-jaw-sk",
    images: [{ url: "/images/products/og/image-upscale-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function ImageUpscaleMooseJawPage() {
  return (
    <IndustryPage
      canonicalSlug="image-upscale-moose-jaw-sk"
      primaryProductSlug="stickers"
      title="Image Upscaling — Moose Jaw SK"
      subtitle="AI image upscaling and photo enhancement for Moose Jaw businesses. From $40. Same-day digital delivery."
      heroImage="/images/products/heroes/image-upscale-hero-1200x500.webp"
      heroAlt="AI image upscaling service for Moose Jaw SK businesses by True Color Display Printing"
      description={
        "AI image upscaling and photo enhancement for Moose Jaw businesses. From $40 flat per image — print-ready sharp output from blurry, low-resolution, or grainy source files. Built for Moose Jaw realtors, restaurants, breweries, and small businesses with only a tiny logo or phone-shot photo that needs to scale up to a banner, sign, or business card. Processed in-house in Saskatoon, returned same business day via email or Dropbox link. No courier required."
      }
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing offers AI image upscaling and photo restoration as a
            digital service. Send your low-resolution photo, pixelated logo, or grainy
            photograph and we&apos;ll return a sharp, print-ready high-resolution file via
            email or Dropbox link. <strong>$40 flat per image</strong> for standard 4×
            upscaling, $60 for 8× (going from a small phone photo to a 4×8&apos; banner).
            Same-business-day digital delivery to Moose Jaw — no shipping cost.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Common Moose Jaw use cases: <strong>brewery and distillery brand assets</strong>{" "}
            (small logos that need to print sharp on bottle labels and banners), restaurant
            menu photography, realtor listing photos, family photo restoration for memorial
            and gallery displays. Bundle the upscale with{" "}
            <Link href="/logo-vectorization-moose-jaw-sk" className="text-[#16C2F3] underline font-medium">
              logo vectorization
            </Link>{" "}
            if you also need a scalable vector copy.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To order: email your file to{" "}
            <a href="mailto:info@true-color.ca" className="text-[#16C2F3] underline font-medium">
              info@true-color.ca
            </a>{" "}
            or call{" "}
            <a href="tel:+13069548688" className="text-[#16C2F3] underline font-medium">
              (306) 954-8688
            </a>. Tell us the final print size and substrate so we upscale to the right
            resolution. Most jobs returned within 1 business day. Rush (under 4 hours) +$40
            flat.
          </p>
        </>
      }
      products={[
        { name: "Image Upscaling", from: "from $40 flat", slug: "stickers" },
        { name: "Logo Vectorization", from: "from $50 flat", slug: "stickers" },
        { name: "Photo Posters", from: "from $25", slug: "photo-posters" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
      ]}
      whyPoints={[
        "AI upscaling at 4× ($40) or 8× ($60) — print-ready output from low-res sources",
        "Same-business-day digital delivery to Moose Jaw — no courier required",
        "We tell you the right output resolution for your target print size + substrate",
        "Roland UV print quality once upscaled — combine with a True Color print job for one workflow",
        "Standard formats: PNG, JPG, TIFF, PDF — Dropbox or email delivery",
        "Family photo restoration: scratches, faded colours, tears repaired",
        "Rush (under 4 hours) available at +$40 flat",
        "$35 in-house designer add-on if you need layout work on the upscaled file",
      ]}
      faqs={[
        {
          q: "How much does image upscaling cost in Moose Jaw?",
          a: "$40 flat per image for 4× upscaling, $60 for 8× upscaling. Family photo restoration is $40 per photo. Rush (under 4 hours) +$40 flat. No shipping cost — digital delivery.",
        },
        {
          q: "How do I send True Color my photo for upscaling?",
          a: "Email to info@true-color.ca or call (306) 954-8688. For files larger than 25MB, send a Dropbox or Google Drive link. Tell us the final print size and substrate so we upscale to the right resolution.",
        },
        {
          q: "What file types do you accept and return?",
          a: "Accept JPG, PNG, TIFF, PDF, HEIC, RAW, plus phone snapshots. Return PNG (with transparency), JPG (smaller), or TIFF (max quality). Specify your output format if needed.",
        },
        {
          q: "Will an upscaled image actually look sharp when printed large?",
          a: "Yes — the AI reconstructs detail rather than just stretching pixels. We test against the intended print size in Photoshop before sending it back. Roland UV printer-ready.",
        },
        {
          q: "Do you do brewery and distillery brand asset cleanup for Moose Jaw?",
          a: "Yes — brewery and distillery brand assets are a common upscale job. Small logos that look fine on a website but pixelate on a bottle label or banner can be upscaled to print-sharp. Pair with logo vectorization if you also need a scalable vector format.",
        },
        {
          q: "Can you restore an old family photo for a Moose Jaw memorial?",
          a: "Yes — $40 flat per photo. We fix tears, scratches, faded colours, missing edges. Pair with our photo poster printing for a finished framed output.",
        },
      ]}
      relatedCities={[
        { name: "Saskatoon", slug: "image-upscale-saskatoon" },
        { name: "Regina", slug: "image-upscale-regina" },
        { name: "Prince Albert", slug: "image-upscale-prince-albert-sk" },
      ]}
    />
  );
}
