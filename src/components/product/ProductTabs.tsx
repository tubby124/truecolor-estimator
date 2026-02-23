"use client";

import { useState } from "react";
import type { ProductContent } from "@/lib/data/products-content";

interface Props {
  product: ProductContent;
}

const TABS = [
  { id: "about", label: "What This Is" },
  { id: "specs", label: "Specs" },
  { id: "who", label: "Who Uses This" },
  { id: "faq", label: "FAQ" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ProductTabs({ product }: Props) {
  const [active, setActive] = useState<TabId>("about");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
              active === tab.id
                ? "border-[#16C2F3] text-[#16C2F3]"
                : "border-transparent text-gray-500 hover:text-[#1c1712]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="py-8">
        {active === "about" && (
          <p className="text-gray-600 leading-relaxed max-w-2xl">{product.description}</p>
        )}

        {active === "specs" && (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            {product.specs.map((s) => (
              <div key={s.label} className="border-b border-gray-100 pb-3">
                <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  {s.label}
                </dt>
                <dd className="text-sm text-[#1c1712] font-medium">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {active === "who" && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              {product.name} are commonly ordered by:
            </p>
            <div className="flex flex-wrap gap-2">
              {product.whoUsesThis.map((industry) => (
                <span
                  key={industry}
                  className="px-4 py-2 bg-[#f4efe9] rounded-full text-sm font-medium text-[#1c1712]"
                >
                  {industry}
                </span>
              ))}
            </div>
          </div>
        )}

        {active === "faq" && (
          <div className="space-y-6 max-w-2xl">
            {product.faqs.map((faq) => (
              <div key={faq.q}>
                <p className="font-semibold text-[#1c1712] mb-2">{faq.q}</p>
                <p className="text-gray-600 leading-relaxed text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
