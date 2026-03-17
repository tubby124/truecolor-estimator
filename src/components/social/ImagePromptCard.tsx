"use client";

import { useState } from "react";
import { SendToSocialModal } from "./SendToSocialModal";

interface Props {
  name: string;
  prompt: string;
  borderColor?: string;
  imageUrl?: string;
}

export function ImagePromptCard({ name, prompt, borderColor, imageUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent
    }
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-sm transition-all group border-l-4 ${borderColor || "border-l-gray-200"}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          <h4 className="text-xs font-bold text-[#1c1712] truncate">{name}</h4>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs font-bold text-[#e63020] hover:text-[#c8281a] px-2.5 py-1 rounded-lg border border-[#e63020]/20 hover:bg-[#e63020]/5 transition-all flex-shrink-0"
        >
          {copied ? (
            <span className="text-green-600">Copied!</span>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
              Copy
            </>
          )}
        </button>
        {imageUrl && (
          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-800 px-2.5 py-1 rounded-lg border border-purple-200 hover:bg-purple-50 transition-all flex-shrink-0"
          >
            -&gt; Queue
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-xl p-3 font-mono">
        {prompt}
      </p>
      {showSendModal && (
        <SendToSocialModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          initialData={{
            imageUrls: imageUrl ? [imageUrl] : [],
            caption: name,
            source: "image-prompt",
          }}
        />
      )}
    </div>
  );
}
