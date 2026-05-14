import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Image Upscaling Regina SK | From $40 | True Color" },
  description:
    "AI image upscaling and photo enhancement for Regina businesses. Print-ready files from low-res sources. From $40 flat. Same-day digital delivery.",
  alternates: { canonical: "/image-upscale-regina" },
  openGraph: {
    title: "Image Upscaling Regina SK | True Color Display Printing",
    description:
      "AI image upscaling 4x–8x. Print-ready files from low-res photos. From $40 flat. Same-day digital delivery to Regina.",
    url: "https://truecolorprinting.ca/image-upscale-regina",
    images: [{ url: "/images/products/og/image-upscale-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function ImageUpscaleReginaPage() {
  return (
    <IndustryPage
      canonicalSlug="image-upscale-regina"
      primaryProductSlug="stickers"
      title="Image Upscaling — Regina SK"
      subtitle="AI image upscaling and photo enhancement for Regina businesses. From $40. Same-day digital delivery."
      heroImage="/images/products/heroes/image-upscale-hero-1200x500.webp"
      heroAlt="AI image upscaling service for Regina SK businesses by True Color Display Printing"
      description={
        "AI image upscaling and photo enhancement for Regina businesses. From $40 flat per image — print-ready sharp output from blurry, low-resolution, or grainy source files. Built for Regina realtors who need a sharp listing photo, restaurants reusing old menu shots, small businesses with only a tiny logo file, and anyone trying to print a banner or sign from a phone snapshot. We process the file in-house in Saskatoon and email the result the same business day. No courier needed — files delivered as high-res PNG, JPG, or TIFF over email or Dropbox link."
      }
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing offers AI image upscaling and photo restoration as a
            digital service. Send us your low-resolution photo, pixelated logo, or grainy
            family photograph and we&apos;ll return a sharp, print-ready high-resolution file
            via email or Dropbox link. <strong>$40 flat per image</strong> for standard 4×
            upscaling (typical for going from web-resolution to a 24×36&quot; poster), $60 for
            8× (going from a tiny smartphone photo to a 4×8&apos; banner). Same-day digital
            delivery to Regina — no shipping required.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Common Regina use cases: <strong>realtor listing photos</strong> shot at low-res
            on an older phone that need to print to 18×24&quot; coroplast signs, restaurant
            menu items where the original food photography file was lost, business owners with
            only an old website logo who need it printed sharp on a{" "}
            <Link href="/banner-printing-regina" className="text-[#16C2F3] underline font-medium">
              vinyl banner
            </Link>{" "}
            or{" "}
            <Link href="/business-cards-regina" className="text-[#16C2F3] underline font-medium">
              business card
            </Link>, and family photo restoration for printed gallery walls and memorial
            displays. Bundle the upscale with{" "}
            <Link href="/logo-vectorization-regina" className="text-[#16C2F3] underline font-medium">
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
            </a>. Tell us the final print size and substrate (sign, banner, card, poster) and
            we&apos;ll upscale to the right resolution. Most jobs returned within 1 business
            day. Rush upscale (under 4 hours) available at +$40 flat.
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
        "Same-business-day digital delivery to Regina — no courier required",
        "We tell you the right output resolution for your target print size + substrate",
        "Roland UV print quality once upscaled — combine with a True Color print job for one workflow",
        "Standard formats: PNG, JPG, TIFF, PDF — Dropbox or email delivery",
        "Family photo restoration: scratches, faded colours, tears repaired",
        "Rush (under 4 hours) available at +$40 flat",
        "$35 in-house designer add-on if you also need layout work on the upscaled file",
      ]}
      faqs={[
        {
          q: "How much does image upscaling cost in Regina?",
          a: "$40 flat per image for standard 4× upscaling (web-res to 24×36\" poster resolution), $60 flat for 8× (tiny smartphone photo to 4×8' banner resolution). Family photo restoration is $40 per photo. Rush turnaround (under 4 hours) adds $40 flat. No shipping cost — files delivered digitally.",
        },
        {
          q: "How do I send True Color my photo for upscaling?",
          a: "Email the file to info@true-color.ca or call (306) 954-8688. For files larger than 25MB, send a Dropbox or Google Drive link. Tell us the final print size and substrate (sign, banner, business card, poster) so we upscale to the right resolution.",
        },
        {
          q: "What file types do you accept and return?",
          a: "Accept: JPG, PNG, TIFF, PDF, HEIC, RAW, plus phone snapshots. Return: PNG (with transparency if applicable), JPG (smaller file), or TIFF (max quality). Specify if you need a specific output format for your printer or marketing platform.",
        },
        {
          q: "Will an upscaled image actually look sharp when printed large?",
          a: "Yes — that's the whole point. The AI reconstructs detail rather than just stretching pixels. Edges stay crisp, text stays readable, faces stay natural. We test the upscaled file against the intended print size in our Photoshop before sending it back so we know it'll work on our Roland UV printer.",
        },
        {
          q: "What's the turnaround for Regina upscale jobs?",
          a: "Same-business-day delivery for orders received before 11 AM. Next-business-day for orders received after. Rush turnaround (under 4 hours) is +$40 flat as long as the file is received before 1 PM.",
        },
        {
          q: "Can you restore an old family photo for a Regina memorial or gallery wall?",
          a: "Yes — $40 flat per photo. We fix tears, scratches, faded colours, and missing edges. Common requests: pre-1980 wedding photos, mid-century family portraits, and old business photographs. Pair with our photo poster printing for the final framed output.",
        },
      ]}
      relatedCities={[
        { name: "Saskatoon", slug: "image-upscale-saskatoon" },
        { name: "Moose Jaw", slug: "image-upscale-moose-jaw-sk" },
        { name: "Prince Albert", slug: "image-upscale-prince-albert-sk" },
      ]}
    />
  );
}
