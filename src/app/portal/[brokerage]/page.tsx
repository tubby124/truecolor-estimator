import type { Metadata } from "next";
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
      <header style={{ backgroundColor: accent }} className="text-white">
        <div className="max-w-3xl mx-auto px-6 py-10 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-3">
            Agent order portal
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
            {brokerage.name} signage orders
          </h1>
          {brokerage.tagline ? (
            <p className="mt-3 text-base sm:text-lg opacity-90 max-w-2xl">
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
              <p className="opacity-90">{brokerage.citiesServed.slice(0, 4).join(" · ")}
                {brokerage.citiesServed.length > 4 ? " · …" : ""}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 mb-8">
          <h2 className="text-lg font-bold text-[#1c1712] mb-2">How this works</h2>
          <ol className="text-sm text-gray-700 space-y-1.5 list-decimal pl-5">
            <li>Pick what you need + enter the topper text where prompted.</li>
            <li>We email you a proof with your brand assets within 1 business day.</li>
            <li>Approve the proof, get a Clover payment link, pay your own card.</li>
            <li>We print in Saskatoon and ship straight to your address.</li>
          </ol>
          <p className="text-xs text-gray-500 mt-4">
            Your brand files live with us — you do not need to upload artwork. We pull from{" "}
            <span className="font-semibold text-gray-700">{brokerage.name}&apos;s asset folder</span>{" "}
            to keep brand consistency.
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
