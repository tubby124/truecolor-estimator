import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getBrokerage } from "@/lib/data/brokerages";
import { PortalOrderForm } from "./PortalOrderForm";

export const metadata: Metadata = {
  // Portals are private order pages for a single brokerage — keep them out of
  // the index so Diana's agents don't share a public URL by accident.
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ brokerage: string }>;
}

export default async function BrokerageOrderPortal({ params }: PageProps) {
  const { brokerage: slug } = await params;
  const brokerage = getBrokerage(slug);
  if (!brokerage) notFound();

  const accent = brokerage.brandColor;

  return (
    <div className="min-h-screen bg-[#f8f8f8] text-[#111]">
      {/* Brand banner — replaces logo/tagline composite; lossless brand expression */}
      {brokerage.bannerSrc ? (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Image
              src={brokerage.bannerSrc}
              alt={`${brokerage.name} brand banner`}
              width={1600}
              height={420}
              priority
              className="w-full h-auto"
              sizes="(max-width: 768px) 100vw, 1024px"
            />
          </div>
        </div>
      ) : null}

      <header style={{ backgroundColor: accent }} className="text-white">
        <div className="max-w-4xl mx-auto px-6 py-10 sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-2">
            Agent order portal
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
            {brokerage.name} signage orders
          </h1>
          {brokerage.tagline ? (
            <p className="mt-3 text-base sm:text-lg opacity-95 max-w-2xl">
              {brokerage.tagline}
            </p>
          ) : null}
          <div className="mt-6 grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-70 mb-1">Brokerage</p>
              <p className="font-semibold">{brokerage.brokerName}</p>
              <p className="opacity-90">{brokerage.brokerEmail}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider opacity-70 mb-1">Printed by</p>
              <p className="font-semibold">True Color Display Printing</p>
              <p className="opacity-90">Saskatoon, SK · (306) 954-8688</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider opacity-70 mb-1">Ships to</p>
              <p className="opacity-90">
                {brokerage.citiesServed.slice(0, 4).join(" · ")}
                {brokerage.citiesServed.length > 4 ? " · …" : ""}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 mb-8">
          <h2 className="text-lg font-bold text-[#1c1712] mb-2">How this works</h2>
          <ol className="text-sm text-gray-700 space-y-1.5 list-decimal pl-5">
            <li>Pick what you need + pick a topper message from the gallery.</li>
            <li>We email a proof using your brand assets within 1 business day.</li>
            <li>Approve the proof, get a Clover payment link, pay your own card.</li>
            <li>We print in Saskatoon and ship straight to your address.</li>
          </ol>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-sm font-semibold text-[#1c1712] mb-1.5">
              About the prices you&apos;ll see
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Each item shows its{" "}
              <span className="font-semibold">honest per-piece price</span> — material,
              cutting, and packing only. Your whole order also has a{" "}
              <span className="font-semibold">
                {brokerage.orderMinimum
                  ? `$${brokerage.orderMinimum} minimum`
                  : "small minimum"}
              </span>{" "}
              that covers our one-time design proof + press setup (same cost whether you
              order 1 or 20). Mix and match across designs — toppers, directionals, signs
              — to clear it together. Big signs (For Sale, Open House) also drop the
              per-unit price at 10+ quantity.
            </p>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Your brand files live with us — you don&apos;t need to upload artwork. We pull from{" "}
            <span className="font-semibold text-gray-700">{brokerage.name}&apos;s asset folder</span>{" "}
            to keep brand consistency across every sign.
          </p>
        </div>

        <PortalOrderForm brokerage={brokerage} accent={accent} />
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        Printed by True Color Display Printing · 216 33rd St W, Saskatoon SK · truecolorprinting.ca
      </footer>
    </div>
  );
}
