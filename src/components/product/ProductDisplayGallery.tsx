"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ProductDisplayImage } from "@/lib/data/product-display-galleries";

interface Props {
  images: readonly ProductDisplayImage[];
  productName: string;
}

// Match ProductPageClient's one/two/three-column grid inside max-w-6xl px-6.
const DISPLAY_SIZES = "(max-width: 767px) calc(100vw - 48px), (max-width: 1023px) calc(50vw - 40px), (max-width: 1151px) calc(37.04vw - 41.49px), 386px";

/** Explicit, scoped galleries use native modal focus behavior; legacy galleries stay unchanged. */
export function ProductDisplayGallery({ images, productName }: Props) {
  const [active, setActive] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const current = images[active];
  if (!current) return null;

  return (
    <div className="min-w-0 space-y-3" data-product-display-gallery={productName}>
      <button
        type="button"
        className="relative block w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#f8f4ef] cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087da0]"
        aria-label={`Open ${productName} image ${active + 1} of ${images.length}`}
        onClick={() => dialogRef.current?.showModal()}
      >
        <Image
          src={current.src}
          alt={current.alt}
          fill
          className="object-contain"
          sizes={DISPLAY_SIZES}
          priority={active === 0}
          fetchPriority={active === 0 ? "high" : undefined}
        />
      </button>

      <dialog
        ref={dialogRef}
        aria-label={`${productName} image ${active + 1} of ${images.length}`}
        className="fixed inset-0 m-auto w-[calc(100vw-2rem)] max-w-5xl h-[90vh] max-h-[90vh] border-0 rounded-xl bg-[#f8f4ef] p-0 backdrop:bg-black/85"
        onKeyDown={(event) => {
          // This dialog has one control; keep Tab and Shift+Tab on that control.
          if (event.key === "Tab") {
            event.preventDefault();
            closeRef.current?.focus();
          }
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
      >
        <div className="relative w-full h-full">
          <Image src={current.src} alt={current.alt} fill className="object-contain" sizes="(max-width: 1056px) calc(100vw - 32px), 1024px" />
        </div>
        <button
          ref={closeRef}
          type="button"
          className="absolute top-3 right-3 rounded-full bg-black/80 text-white w-11 h-11 text-3xl leading-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close image"
        >
          ×
        </button>
      </dialog>

      <div className="flex max-w-full gap-2 overflow-x-auto pb-1" role="group" aria-label={`${productName} photo gallery`}>
        {images.map((image, index) => (
          <button
            type="button"
            key={image.src}
            onClick={() => setActive(index)}
            aria-label={`View ${productName} photo ${index + 1} of ${images.length}`}
            aria-pressed={index === active}
            className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087da0] ${index === active ? "border-[#16C2F3]" : "border-gray-200 hover:border-gray-400"}`}
          >
            <Image src={image.src} alt={image.alt} fill className="object-contain" sizes="64px" />
          </button>
        ))}
      </div>
    </div>
  );
}
