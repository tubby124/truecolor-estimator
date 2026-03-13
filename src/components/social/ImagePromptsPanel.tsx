"use client";

import { useState } from "react";

interface ImagePrompt {
  id: string;
  name: string;
  category: string;
  prompt: string;
  imagePath: string;
}

interface ImagePromptsPanelProps {
  prompts: ImagePrompt[];
  nicheSlug: string;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
        copied
          ? "bg-green-100 text-green-700"
          : "bg-[#1c1712] text-white hover:bg-[#2c2722]"
      }`}
    >
      {copied ? "Copied" : label}
    </button>
  );
}

export function ImagePromptsPanel({ prompts, nicheSlug }: ImagePromptsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Group prompts by category
  const grouped = prompts.reduce<Record<string, ImagePrompt[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{category}</p>
          </div>
          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div key={item.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="flex-1 text-left"
                    >
                      <p className="text-sm font-bold text-[#1c1712]">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">{item.imagePath}</p>
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <CopyButton text={item.prompt} label="Copy Prompt" />
                      <CopyButton text={item.imagePath} label="Copy Path" />
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="text-xs text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                      >
                        {isExpanded ? "−" : "+"}
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">
                        {item.prompt}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-3 uppercase tracking-widest">
                        Upload to: <span className="font-mono normal-case">/public{item.imagePath}</span>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-[10px] text-gray-400 uppercase tracking-widest">
        Full prompts also saved to: GBP_UPLOAD/niches/{nicheSlug}/image-prompts.md
      </p>
    </div>
  );
}
