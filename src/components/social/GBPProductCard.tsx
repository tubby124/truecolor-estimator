"use client";

import { useState } from "react";
import { motion } from "motion/react";

interface GBPProduct {
  slug: string;
  name: string;
  category: string;
  price: string;
  cta: string;
  url: string;
  description: string;
  imagePath: string | null;
  imagePrompt: string | null;
  seasonal?: { active: string; addBy: string; removeAfter: string };
}

interface Props {
  product: GBPProduct;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover/field:opacity-100 transition-opacity text-[10px] font-bold text-[#e63020] hover:text-[#c8281a] flex-shrink-0"
      title={`Copy ${label}`}
    >
      {copied ? (
        <span className="text-green-600">Copied!</span>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
        </svg>
      )}
    </button>
  );
}

export function GBPProductCard({ product }: Props) {
  const [descExpanded, setDescExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all group"
    >
      <div className="p-5 space-y-3">
        {/* Name */}
        <div className="group/field flex items-start justify-between gap-2">
          <h3 className="text-sm font-black text-[#1c1712] leading-tight">{product.name}</h3>
          <CopyButton text={product.name} label="name" />
        </div>

        {/* Category + Price */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
            {product.category}
          </span>
          <div className="group/field flex items-center gap-1 ml-auto">
            <span className="text-xs font-bold text-[#e63020]">{product.price}</span>
            <CopyButton text={product.price} label="price" />
          </div>
        </div>

        {/* Seasonal badge */}
        {product.seasonal && (
          <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
            Seasonal: {product.seasonal.active}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400">CTA:</span>
          <span className="text-xs font-semibold text-gray-600">{product.cta}</span>
        </div>

        {/* URL */}
        <div className="group/field flex items-center gap-2">
          <span className="text-[10px] text-gray-400 flex-shrink-0">URL:</span>
          <span className="text-xs text-blue-600 truncate flex-1">{product.url.replace("https://truecolorprinting.ca", "")}</span>
          <CopyButton text={product.url} label="URL" />
        </div>

        {/* Description */}
        <div className="group/field">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</span>
            <CopyButton text={product.description} label="description" />
          </div>
          <p className={`text-xs text-gray-600 leading-relaxed ${descExpanded ? "" : "line-clamp-3"}`}>
            {product.description}
          </p>
          {product.description.length > 150 && (
            <button
              onClick={() => setDescExpanded(!descExpanded)}
              className="text-[10px] font-bold text-[#e63020] mt-1 hover:underline"
            >
              {descExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        {/* Image path */}
        {product.imagePath && (
          <div className="group/field flex items-center gap-2">
            <span className="text-[10px] text-gray-400 flex-shrink-0">Image:</span>
            <span className="text-xs text-gray-500 truncate flex-1">{product.imagePath}</span>
            <CopyButton text={product.imagePath} label="image path" />
          </div>
        )}

        {/* Image prompt link */}
        {product.imagePrompt && (
          <div className="group/field flex items-center gap-2 pt-1 border-t border-gray-100">
            <svg className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            <span className="text-[10px] font-bold text-purple-500">ChatGPT prompt available</span>
            <CopyButton text={product.imagePrompt} label="image prompt" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
