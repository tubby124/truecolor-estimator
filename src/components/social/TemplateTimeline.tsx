"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { BlitzTemplate } from "@/lib/types/blitz";

interface Props {
  templates: BlitzTemplate[];
}

export function TemplateTimeline({ templates }: Props) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  async function copyToClipboard(text: string, field: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // silent
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="divide-y divide-gray-100">
        {templates.map((tmpl, i) => {
          const isExpanded = expandedStep === tmpl.step;
          const dayLabel = tmpl.wait_days === 0 ? "Day 0" : `Day ${templates.slice(0, i + 1).reduce((sum, t) => sum + t.wait_days, 0)}`;

          return (
            <div key={tmpl.id} className="group">
              <button
                onClick={() => setExpandedStep(isExpanded ? null : tmpl.step)}
                className="w-full px-5 py-3.5 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors"
              >
                {/* Step dot + line */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <span className={`w-3 h-3 rounded-full border-2 ${
                    i === 0 ? "bg-[#e63020] border-[#e63020]" : "bg-white border-gray-300"
                  }`} />
                </div>

                {/* Step number */}
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-14 flex-shrink-0">
                  Step {tmpl.step}
                </span>

                {/* Day label */}
                <span className="text-[10px] font-bold text-gray-300 w-14 flex-shrink-0">
                  {dayLabel}
                </span>

                {/* Subject */}
                <span className="text-sm font-semibold text-[#1c1712] flex-1 truncate">
                  {tmpl.subject ?? `Template #${tmpl.brevo_template_id}`}
                </span>

                {/* Wait days */}
                <span className="text-[10px] text-gray-300 flex-shrink-0">
                  +{tmpl.wait_days}d wait
                </span>

                {/* Expand chevron */}
                <svg
                  className={`w-4 h-4 text-gray-300 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 pl-[76px] space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Brevo Template ID:</span>
                        <button
                          onClick={() => copyToClipboard(String(tmpl.brevo_template_id), `tmpl-${tmpl.step}`)}
                          className="text-xs font-bold text-[#e63020] hover:underline"
                        >
                          {tmpl.brevo_template_id}
                          {copiedField === `tmpl-${tmpl.step}` && (
                            <span className="ml-2 text-green-600 text-[10px]">Copied!</span>
                          )}
                        </button>
                      </div>
                      {tmpl.subject && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subject:</span>
                          <button
                            onClick={() => copyToClipboard(tmpl.subject!, `subj-${tmpl.step}`)}
                            className="text-xs text-gray-600 hover:text-[#e63020] transition-colors"
                          >
                            {tmpl.subject}
                            {copiedField === `subj-${tmpl.step}` && (
                              <span className="ml-2 text-green-600 text-[10px] font-bold">Copied!</span>
                            )}
                          </button>
                        </div>
                      )}
                      <a
                        href={`https://app.brevo.com/email-campaign/design/template/${tmpl.brevo_template_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-xs font-bold text-[#e63020] hover:underline mt-1"
                      >
                        View in Brevo →
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
