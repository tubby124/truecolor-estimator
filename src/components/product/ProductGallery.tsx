"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: Props) {
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
        <Image
          src={images[active]}
          alt={`${productName} — True Color Display Printing Saskatoon`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 55vw"
          priority
        />
      </div>

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
                alt={`${productName} photo ${i + 1}`}
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
