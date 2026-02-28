import type { Metadata } from "next";
import { IndustryPage } from "@/components/site/IndustryPage";

export const metadata: Metadata = {
  title: "Agribusiness Signs Saskatchewan | Farm & Field Signage | True Color",
  description:
    "Custom signs for Saskatchewan agribusinesses — farm signs, equipment dealers, grain elevators, co-ops, and ag retailers. Coroplast, ACP aluminum, banners. Saskatoon local. Volume pricing.",
  alternates: { canonical: "/agribusiness-signs-saskatchewan" },
  openGraph: {
    title: "Agribusiness Signs Saskatchewan | True Color Display Printing",
    description:
      "Coroplast, ACP, and banner printing for Saskatchewan farms, ag dealers, and co-ops. Volume pricing. Local pickup Saskatoon.",
    url: "https://truecolorprinting.ca/agribusiness-signs-saskatchewan",
    type: "website",
  },
};

export default function AgribusinessSignsSaskatchewanPage() {
  return (
    <IndustryPage
      canonicalSlug="agribusiness-signs-saskatchewan"
      primaryProductSlug="coroplast-signs"
      title="Agribusiness Signs Saskatchewan"
      subtitle="Farm signs, equipment branding, and field signage built for Saskatchewan conditions."
      heroImage="/images/products/heroes/agriculture-hero-1200x500.webp"
      heroAlt="Agribusiness signs for Saskatchewan farms and equipment dealers"
      description="Saskatchewan's ag sector needs signage that performs in the field — UV-resistant coroplast that survives prairie winters, truck magnets that stay on at highway speeds, and aluminum signs that last 10+ years on equipment. True Color Display Printing serves ag retailers, grain elevator operators, equipment dealers, co-ops, and independent farm operations across Saskatchewan. Volume pricing applies automatically — no account needed. Pickup in Saskatoon or we can arrange delivery for large runs."
      products={[
        { name: "Coroplast Signs", from: "from $8/sqft", slug: "coroplast-signs" },
        { name: "ACP Aluminum Signs", from: "from $13/sqft", slug: "acp-signs" },
        { name: "Vehicle Magnets", from: "from $24/sqft", slug: "vehicle-magnets" },
        { name: "Vinyl Banners", from: "from $8.25/sqft", slug: "vinyl-banners" },
        { name: "Business Cards", from: "250 for $40", slug: "business-cards" },
      ]}
      whyPoints={[
        "Coroplast from $8/sqft — weather-resistant, UV-printed, survives Saskatchewan freeze/thaw cycles",
        "ACP aluminum signs from $13/sqft — 10+ year lifespan, ideal for permanent farm and equipment yard signage",
        "Volume discounts built in — 17+ sqft gets 17% off coroplast, no account needed",
        "Vehicle and equipment magnets from $24/sqft — removable branding for tractors, trucks, and grain carts",
        "In-house designer handles low-res logos and rough sketches — no need to hire a graphic designer",
        "Local Saskatoon pickup at 216 33rd St W — no shipping wait, inspect before you leave",
      ]}
      faqs={[
        {
          q: "What's the best sign material for outdoor farm use in Saskatchewan?",
          a: "For temporary or seasonal use (1–3 years), coroplast is the best value at $8/sqft. For permanent signage (10+ years), 3mm aluminum composite (ACP) at $13/sqft is the professional standard — it won't rust, warp, or fade. Both are UV-printed and weather-resistant.",
        },
        {
          q: "Can you do large-format signs for grain elevators or bin yards?",
          a: "Yes — we print up to 4×8 ft on coroplast and ACP, and larger sizes on vinyl banner material. For oversized permanent installations, we recommend ACP panels or multi-panel vinyl banners. Call (306) 954-8688 to discuss your project.",
        },
        {
          q: "Do you do volume pricing for ag equipment dealers ordering 50+ signs?",
          a: "Volume discounts apply automatically based on total sqft — no account needed. Coroplast: 8% off at 8+ sqft, 17% off at 17+ sqft. For larger runs (50+ signs), call for a custom quote.",
        },
        {
          q: "What about vehicle and equipment magnets for farm trucks?",
          a: "30mil vehicle magnets from $24/sqft. They stick securely to steel doors on trucks, grain trucks, and equipment cabs. Removable — no paint damage, no residue. Great for co-op fleet branding and seasonal campaigns.",
        },
        {
          q: "Can I get signs with GPS field boundaries or aerial imagery?",
          a: "Yes — bring us a PDF or image export from your farm management software. We print any custom graphic including aerial photography, field maps, and certification badges on coroplast, ACP, or banner material.",
        },
      ]}
    />
  );
}
