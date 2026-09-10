/** Product-detail display only. Never use this registry for Merchant or SEO heroes. */
export interface ProductDisplayImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

// Owner requested a coroplast-only deployment test and retention of the original
// For Sale image. Keep it first to preserve the initial-image baseline. The
// material-detail candidate remains excluded pending construction review.
const COROPLAST_DISPLAY_GALLERY: readonly ProductDisplayImage[] = [
  {
    src: "/images/products/product/coroplast-yard-sign-800x600.webp",
    alt: "Cyan and magenta For Sale coroplast sign on a wire stake against a white background.",
    width: 1536,
    height: 1024,
  },
  {
    src: "/images/products/gallery/coroplast-signs/coroplast-signs-overview-v1-1200w.webp",
    alt: "Illustrative coroplast yard sign with tomato artwork and Grow Together text in a community garden.",
    width: 1200,
    height: 900,
  },
  {
    src: "/images/products/gallery/coroplast-signs/coroplast-signs-application-v1-1200w.webp",
    alt: "Illustrative yellow-and-green Plant Sale coroplast sign on a wire stake outside a greenhouse.",
    width: 1200,
    height: 900,
  },
  {
    src: "/images/products/gallery/coroplast-signs/coroplast-signs-alternate-design-v1-1200w.webp",
    alt: "Illustrative blue, white and red real-estate For Sale yard sign on a wire stake.",
    width: 1200,
    height: 900,
  },
];

export function getProductDisplayGallery(slug: string): readonly ProductDisplayImage[] | undefined {
  return slug === "coroplast-signs" ? COROPLAST_DISPLAY_GALLERY : undefined;
}
