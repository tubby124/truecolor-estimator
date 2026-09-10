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


// Owner-authorized second batch; each original hero remains first.
const POSTCARDS_DISPLAY_GALLERY: readonly ProductDisplayImage[] = [
  {
    "src": "/images/products/product/postcards-800x600.webp",
    "alt": "Cyan and magenta promotional postcards with home, food, business and concert artwork on a white surface.",
    "width": 800,
    "height": 600
  },
  {
    "src": "/images/products/gallery/postcards/postcards-material-detail-v1-1200w.webp",
    "alt": "Illustrative glossy postcard with a blue-and-yellow coastal scene and a blank address reverse.",
    "width": 1200,
    "height": 900
  },
  {
    "src": "/images/products/gallery/postcards/postcards-application-v1-1200w.webp",
    "alt": "Illustrative blue-and-yellow art postcards in a clear display rack on a gallery counter.",
    "width": 1200,
    "height": 900
  },
  {
    "src": "/images/products/gallery/postcards/postcards-alternate-design-v1-1200w.webp",
    "alt": "Illustrative Harbor Point coastal postcard beside its address reverse on a wooden table.",
    "width": 1200,
    "height": 900
  }
];

const RETRACTABLE_DISPLAY_GALLERY: readonly ProductDisplayImage[] = [
  {
    "src": "/images/products/product/retractable-stand-600x900.webp",
    "alt": "Cyan and magenta retractable banner with abstract geometric artwork and a silver base in an indoor lobby.",
    "width": 1024,
    "height": 1536
  },
  {
    "src": "/images/products/gallery/retractable-banners/retractable-banners-overview-v1-1200w.webp",
    "alt": "Illustrative teal-and-orange After Hours retractable banner with saxophone artwork in an indoor lobby.",
    "width": 1200,
    "height": 900
  },
  {
    "src": "/images/products/gallery/retractable-banners/retractable-banners-application-v1-1200w.webp",
    "alt": "Illustrative teal-and-white retractable banner with a mountain-and-lake design in a bright indoor foyer.",
    "width": 1200,
    "height": 900
  },
  {
    "src": "/images/products/gallery/retractable-banners/retractable-banners-alternate-design-v1-1200w.webp",
    "alt": "Illustrative Find Your Balance retractable banner with yoga artwork in a studio.",
    "width": 1200,
    "height": 900
  }
];

export function getProductDisplayGallery(slug: string): readonly ProductDisplayImage[] | undefined {
  switch (slug) {
    case "coroplast-signs": return COROPLAST_DISPLAY_GALLERY;
    case "postcards": return POSTCARDS_DISPLAY_GALLERY;
    case "retractable-banners": return RETRACTABLE_DISPLAY_GALLERY;
    default: return undefined;
  }
}
