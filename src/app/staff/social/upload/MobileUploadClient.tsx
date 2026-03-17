"use client";

import { useState } from "react";
import Link from "next/link";
import { ImagePicker } from "@/components/social/ImagePicker";
import { SendToSocialModal } from "@/components/social/SendToSocialModal";
import { useToast, ToastContainer } from "@/components/ui/Toast";

export function MobileUploadClient() {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const { toasts, showToast, dismissToast } = useToast();

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-[#1c1712]">Upload</h1>
            <p className="text-xs text-gray-400">Snap a photo and add to your library</p>
          </div>
          <Link
            href="/staff/social/queue"
            className="text-xs font-semibold text-gray-500 hover:text-[#1c1712]"
          >
            &larr; Queue
          </Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <ImagePicker
            value={imageUrls}
            onChange={setImageUrls}
            maxImages={10}
          />
        </div>

        {imageUrls.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                showToast(`${imageUrls.length} image${imageUrls.length > 1 ? "s" : ""} saved to library`, "success");
                setImageUrls([]);
              }}
              className="flex-1 border-2 border-gray-200 text-[#1c1712] text-sm font-bold py-3 rounded-xl hover:border-gray-300 transition-colors"
            >
              Save to Library
            </button>
            <button
              onClick={() => setShowSendModal(true)}
              className="flex-1 bg-[#e63020] text-white text-sm font-bold py-3 rounded-xl hover:bg-[#c8281a] transition-colors"
            >
              Create Post
            </button>
          </div>
        )}
      </div>

      <SendToSocialModal
        isOpen={showSendModal}
        onClose={() => {
          setShowSendModal(false);
          setImageUrls([]);
        }}
        initialData={{
          imageUrls,
          source: "manual",
        }}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
