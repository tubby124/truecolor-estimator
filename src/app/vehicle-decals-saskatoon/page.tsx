import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: { absolute: "Vehicle Decals Saskatoon | Print & Install | True Color" },
  description:
    "Custom vehicle decals in Saskatoon — die-cut door panels, rear window graphics, and full-colour vinyl installed on your vehicle. From $200 printed and installed.",
  alternates: { canonical: "/vehicle-decals-saskatoon" },
  openGraph: {
    title: "Vehicle Decals Saskatoon | Printed & Installed | True Color",
    description:
      "Die-cut vehicle decals printed and installed in Saskatoon. Door panels, rear windows, full-colour vinyl. From $200 installed. Local pickup at 216 33rd St W.",
    url: "https://truecolorprinting.ca/vehicle-decals-saskatoon",
    type: "website",
  },
};

export default function VehicleDecalsSaskatoonPage() {
  return (
    <IndustryPage
      canonicalSlug="vehicle-decals-saskatoon"
      primaryProductSlug="window-decals"
      title="Vehicle Decals Saskatoon"
      subtitle="Die-cut, full-colour vinyl — printed and installed on your vehicle. From $200."
      heroImage="/images/gallery/gallery-vehicle-decal-riverbend-side.webp"
      heroAlt="Custom vehicle door decal printed and installed by True Color Display Printing, Saskatoon"
      description="True Color prints and installs custom die-cut vehicle decals for Saskatoon businesses — door panels, rear window graphics, side body vinyl, and more. Every decal is printed on our Roland UV wide-format printer, die-cut to your exact shape, and installed at our shop. RiverBend Auto Glass, Ayotte Plumbing, and South Stream Seafood all brand their fleet through us. Starting at $200 for a standard door panel package printed and installed. Need magnets instead of permanent vinyl? We do those too from $45."
      products={[
        { name: "Window & Vehicle Decals", from: "from $200 installed", slug: "window-decals" },
        { name: "Vehicle Magnets", from: "from $45", slug: "vehicle-magnets" },
        { name: "Vinyl Lettering", from: "from $40", slug: "vinyl-lettering" },
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
      ]}
      whyPoints={[
        "Die-cut vinyl — cut to your exact logo or shape, no white rectangle border",
        "Printed on Roland TrueVIS UV — vivid, UV-resistant colours that last outdoors",
        "Installation included — we apply the decal at our shop, no bubbles, no lifting edges",
        "Door panels, rear windows, side graphics — any flat or slightly curved vehicle surface",
        "Works on cars, trucks, vans, trailers, and heavy equipment",
        "Same-day rush available (+$40) for orders placed before 10 AM",
      ]}
      faqs={[
        {
          q: "How much do vehicle decals cost in Saskatoon?",
          a: "A standard die-cut door panel decal — printed and installed — starts at $200. Price depends on size, number of colours, quantity, and whether installation is at our shop or on-site. Request a quote for an exact price on your vehicle and artwork.",
        },
        {
          q: "What's the difference between a vehicle decal and a vehicle magnet?",
          a: "Vehicle decals (vinyl) are permanently or semi-permanently applied to the vehicle surface. They look cleaner, last longer, and can be die-cut to any shape. Vehicle magnets are removable — you put them on and take them off as needed. Magnets are better if you use a personal vehicle for business occasionally. Decals are better for dedicated fleet vehicles.",
        },
        {
          q: "Do you install the decals at your shop?",
          a: "Yes — bring your vehicle to 216 33rd St W, Saskatoon and we'll install it here. Installation is included in the $200 package price. For large fleets or on-site installs, contact us for a custom quote.",
        },
        {
          q: "How long do vehicle decals last?",
          a: "Roland UV-printed vinyl on a quality adhesive substrate typically lasts 3–5 years on a vehicle exterior. Saskatchewan's UV and cold don't noticeably affect well-applied cast vinyl. Removal is possible without paint damage if done carefully with heat.",
        },
        {
          q: "Can I get a rear window decal instead of a door panel?",
          a: "Yes — rear window decals are one of our most popular vehicle graphics. We print in white or full-colour on clear vinyl for dark glass (as shown in our RiverBend Auto Glass example). Same starting price applies.",
        },
        {
          q: "Do you do full vehicle wraps?",
          a: "For full wraps, we print the vinyl panels and can refer you to a certified wrap installer in Saskatoon. Partial wraps and large side panels we handle in-house. Contact us with your vehicle make/model for a quote.",
        },
      ]}
    />
  );
}
