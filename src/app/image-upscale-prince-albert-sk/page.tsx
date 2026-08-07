import type { Metadata } from "next";
import Link from "next/link";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Image Upscaling Prince Albert SK | $20 Flat | True Color" },
  description:
    "AI image upscaling and photo enhancement for Prince Albert businesses. Print-ready files from low-res sources. $20 flat. Same-day digital delivery.",
  alternates: { canonical: "/image-upscale-prince-albert-sk" },
  openGraph: {
    title: "Image Upscaling Prince Albert SK | True Color Display Printing",
    description:
      "AI image upscaling and photo restoration. Print-ready files from low-res photos. $20 flat. Same-day digital delivery to Prince Albert.",
    url: "https://truecolorprinting.ca/image-upscale-prince-albert-sk",
    images: [{ url: "/images/products/og/image-upscale-og-1200x630.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function ImageUpscalePrinceAlbertPage() {
  return (
    <IndustryPage
      canonicalSlug="image-upscale-prince-albert-sk"
      primaryProductSlug="image-upscale"
      title="Image Upscaling — Prince Albert SK"
      subtitle="AI image upscaling and photo enhancement for PA businesses. $20 flat. Same-day digital delivery."
      heroImage="/images/products/heroes/image-upscale-hero-1200x500.webp"
      heroAlt="AI image upscaling service for Prince Albert SK businesses by True Color Display Printing"
      description={
        "AI image upscaling and photo enhancement for Prince Albert businesses. $20 flat per image — print-ready sharp output from blurry, low-resolution, or grainy source files. Built for PA realtors, tourism operators, hunting/fishing lodges, indigenous-craft brands, and small businesses with only a tiny logo or phone-shot photo. Processed in-house in Saskatoon, returned same business day via email or Dropbox — no courier required. Distance doesn't matter for digital deliverables."
      }
      descriptionNode={
        <>
          <p className="text-gray-600 text-lg leading-relaxed">
            True Color Display Printing offers AI image upscaling and photo restoration as a
            digital service. Send your low-resolution photo, pixelated logo, or grainy
            photograph and we&apos;ll return a sharp, print-ready high-resolution file via
            email or Dropbox link. It&apos;s <strong>$20 flat per image</strong> — 2×
            resolution for prints up to 12×18&quot;, or 4× upscaling with noise reduction
            and sharpening for banner-sized output, at the same one price.
            Same-business-day digital delivery to Prince Albert. Distance is irrelevant for
            digital files — same turnaround whether you&apos;re in PA or downtown Saskatoon.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Common PA use cases: <strong>tourism operator photography</strong> (lodges,
            outfitters, fishing camps with only old web-resolution photos), indigenous-craft
            brand asset cleanup (small logos that need to print sharp on labels and signs),
            realtor listing photos, family photo restoration. Bundle the upscale with{" "}
            <Link href="/logo-vectorization-prince-albert-sk" className="text-[#16C2F3] underline font-medium">
              logo vectorization
            </Link>{" "}
            if you also need a scalable vector format.
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
        { name: "Image Upscaling", from: "$20 flat", slug: "image-upscale" },
        { name: "Logo Vectorization", from: "$40 flat", slug: "logo-vectorization" },
        { name: "Photo Posters", from: "from $25", slug: "photo-posters" },
        { name: "Business Cards", from: "250 for $45", slug: "business-cards" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
      ]}
      whyPoints={[
        "AI upscaling at $20 flat per image — one price, no tier ladder",
        "Digital delivery — distance is irrelevant, same turnaround as a downtown Saskatoon customer",
        "We tell you the right output resolution for your target print size + substrate",
        "Roland TrueVIS VG2 eco-solvent print quality once upscaled — combine with a True Color print job",
        "Standard formats: PNG, JPG, TIFF, PDF — Dropbox or email delivery",
        "Tourism operator and indigenous-craft brand asset cleanup is a regular PA print job",
        "Rush (under 4 hours) available at +$40 flat",
        "$40 in-house designer add-on if you need layout work on the upscaled file",
      ]}
      faqs={[
        {
          q: "How much does image upscaling cost in Prince Albert?",
          a: "$20 flat per image — basic upscaling, AI noise reduction and sharpening all included, no tier ladder. Rush (under 4 hours) +$40 flat. No shipping cost — digital delivery.",
        },
        {
          q: "Do you charge more because Prince Albert is further north?",
          a: "No — there's no shipping cost on a digital deliverable. The file goes via email or Dropbox in seconds. Same turnaround, same price as a Saskatoon customer.",
        },
        {
          q: "Do you do tourism and outfitter photo cleanup for PA?",
          a: "Yes — PA tourism operators (lodges, outfitters, fishing camps) often have only low-resolution web photos that look great on a website but pixelate when printed on a banner, sign, or brochure. We upscale to 4× or 8× and return a sharp print-ready file.",
        },
        {
          q: "What file types do you accept and return?",
          a: "Accept JPG, PNG, TIFF, PDF, HEIC, RAW, phone snapshots. Return PNG, JPG, or TIFF. Specify output format if needed.",
        },
        {
          q: "What's the turnaround for PA upscale jobs?",
          a: "Same-business-day for orders received before 11 AM. Next-business-day for orders received after. Rush (under 4 hours) +$40 flat as long as file received before 1 PM.",
        },
        {
          q: "Can you restore an old family photo for a PA memorial?",
          a: "Yes — $40 flat per photo. We fix tears, scratches, faded colours, missing edges. Pair with our photo poster printing for a finished framed output.",
        },
      ]}
      relatedCities={[
        { name: "Saskatoon", slug: "image-upscale-saskatoon" },
        { name: "Regina", slug: "image-upscale-regina" },
        { name: "Moose Jaw", slug: "image-upscale-moose-jaw-sk" },
      ]}
    />
  );
}
