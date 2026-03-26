"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface Props {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && setLightbox(false);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox]);

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#f8f4ef]">
        <Image
          src={images[active]}
          alt={`${productName} — ${images[active].split("/").pop()?.replace(/-\d+x\d+\.webp$/, "").replace(/-/g, " ") ?? "True Color Display Printing Saskatoon"}`}
          fill
          className="object-contain cursor-zoom-in"
          sizes="(max-width: 768px) 100vw, 55vw"
          priority
          onClick={() => setLightbox(true)}
        />
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <div className="relative w-full h-full max-w-5xl max-h-[90vh]">
            <Image
              src={images[active]}
              alt={`${productName} — full size`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none"
            onClick={() => setLightbox(false)}
            aria-label="Close image"
          >
            ×
          </button>
        </div>
      )}

      {/* Thumbnails (only if more than 1 image) */}
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors shrink-0 ${
                i === active
                  ? "border-[#16C2F3]"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <Image
                src={src}
                alt={src.split("/").pop()?.replace(/-\d+x\d+\.webp$/, "").replace(/-/g, " ") ?? `${productName} photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
