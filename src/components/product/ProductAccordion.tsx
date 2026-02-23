"use client";

import { useState } from "react";
import type { ProductContent } from "@/lib/data/products-content";

// materialInfo is an optional future field not yet in ProductContent;
// we extend locally so the component is ready when the data is added.
interface MaterialInfo {
  headline: string;
  bullets: string[];
}

interface Props {
  product: ProductContent & { materialInfo?: MaterialInfo };
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function ProductAccordion({ product }: Props) {
  const [open, setOpen] = useState({
    about: true,
    specs: true,
    who: false,
    faq: true,
  });

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  function toggle(section: keyof typeof open) {
    setOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  return (
    <div className="mt-8 border-t border-gray-100 divide-y divide-gray-100">

      {/* ── Section 1: About this product ── */}
      <div>
        <button
          onClick={() => toggle("about")}
          className="flex items-center justify-between w-full py-4 border-b border-gray-100 cursor-pointer hover:text-[#16C2F3] transition-colors"
        >
          <span className="font-semibold text-[#1c1712] text-base">About this product</span>
          <ChevronIcon open={open.about} />
        </button>

        {open.about && (
          <div className="py-5">
            <p className="text-gray-600 leading-relaxed max-w-2xl">{product.description}</p>

            {product.materialInfo && (
              <div className="mt-4 bg-[#f4efe9] rounded-lg p-4">
                <p className="font-bold text-[#1c1712] text-sm mb-2">
                  {product.materialInfo.headline}
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {product.materialInfo.bullets.map((bullet) => (
                    <li key={bullet} className="text-sm text-[#1c1712]">
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Section 2: Specs & Materials ── */}
      <div>
        <button
          onClick={() => toggle("specs")}
          className="flex items-center justify-between w-full py-4 border-b border-gray-100 cursor-pointer hover:text-[#16C2F3] transition-colors"
        >
          <span className="font-semibold text-[#1c1712] text-base">Specs &amp; Materials</span>
          <ChevronIcon open={open.specs} />
        </button>

        {open.specs && (
          <div className="py-5">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {product.specs.map((spec) => (
                <div key={spec.label}>
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {spec.label}
                  </dt>
                  <dd className="text-sm text-[#1c1712] mt-0.5">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      {/* ── Section 3: Who uses this ── */}
      <div>
        <button
          onClick={() => toggle("who")}
          className="flex items-center justify-between w-full py-4 border-b border-gray-100 cursor-pointer hover:text-[#16C2F3] transition-colors"
        >
          <span className="font-semibold text-[#1c1712] text-base">Who uses this</span>
          <ChevronIcon open={open.who} />
        </button>

        {open.who && (
          <div className="py-5">
            <div className="flex flex-wrap gap-2">
              {product.whoUsesThis.map((industry) => (
                <span
                  key={industry}
                  className="bg-[#f4efe9] text-[#1c1712] text-sm font-medium px-3 py-1.5 rounded-full"
                >
                  {industry}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Section 4: Common questions ── */}
      <div>
        <button
          onClick={() => toggle("faq")}
          className="flex items-center justify-between w-full py-4 border-b border-gray-100 cursor-pointer hover:text-[#16C2F3] transition-colors"
        >
          <span className="font-semibold text-[#1c1712] text-base">Common questions</span>
          <ChevronIcon open={open.faq} />
        </button>

        {open.faq && (
          <div className="py-2">
            {product.faqs.map((faq, i) => (
              <div key={faq.q} className="border-b border-gray-100 last:border-0">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex justify-between items-start cursor-pointer py-3 w-full text-left"
                >
                  <span className="font-semibold text-[#1c1712] text-sm pr-4">{faq.q}</span>
                  <span className="text-gray-400 text-base mt-0.5 shrink-0">
                    {openFaq === i ? "▾" : "▸"}
                  </span>
                </button>

                {openFaq === i && (
                  <p className="text-sm text-gray-600 leading-relaxed py-3">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
