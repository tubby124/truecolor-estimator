export type GalleryProjectKind = "real-client" | "shop-process" | "concept";
export type GalleryRightsStatus = "approved" | "legacy-public" | "hold";
export type GalleryPrivacyStatus = "reviewed" | "review-required";

export type GalleryProject = {
  id: string;
  src: string;
  width: number;
  height: number;
  focalPoint: { x: number; y: number };
  displayOrder: number;
  title: string;
  caption: string;
  alt: string;
  kind: GalleryProjectKind;
  category: string;
  productSlug: string;
  productHref: string;
  priceLabel: string;
  rightsStatus: GalleryRightsStatus;
  privacyStatus: GalleryPrivacyStatus;
  published: boolean;
  homepageFeatured: boolean;
  clientDisplayName?: string;
};

export const GALLERY_CATEGORIES = [
  "All",
  "Shop",
  "Signs",
  "Banners",
  "Displays",
  "Vehicle",
  "Window & Vinyl",
  "Cards & Print",
  "Magnets",
] as const;

export const GALLERY_PRODUCT_HREFS: Readonly<Record<string, string>> = {
  "coroplast-signs": "/coroplast-signs-saskatoon",
  "vinyl-banners": "/banner-printing-saskatoon",
  "acp-signs": "/acp-signs-saskatoon",
  "vehicle-magnets": "/vehicle-magnets-saskatoon",
  "retractable-banners": "/retractable-banners-saskatoon",
  "business-cards": "/business-cards-saskatoon",
  flyers: "/flyer-printing-saskatoon",
  "window-decals": "/window-decals-saskatoon",
  "vinyl-lettering": "/vinyl-lettering-saskatoon",
  stickers: "/sticker-printing-saskatoon",
  postcards: "/postcard-printing-saskatoon",
  "magnet-calendars": "/products/magnet-calendars",
  "foamboard-displays": "/foamboard-printing-saskatoon",
  brochures: "/brochure-printing-saskatoon",
  "vehicle-decals": "/vehicle-decals-saskatoon",
};

type GallerySeed = readonly [
  src: string,
  label: string,
  priceLabel: string,
  productSlug: string,
  category: string,
  width: number,
  height: number,
  overrides?: Partial<
    Pick<
      GalleryProject,
      | "id"
      | "focalPoint"
      | "caption"
      | "alt"
      | "kind"
      | "productHref"
      | "rightsStatus"
      | "privacyStatus"
      | "published"
      | "homepageFeatured"
      | "clientDisplayName"
    >
  >,
];

// Existing gallery order, labels, pricing labels, and destinations are retained here.
// New work must enter through the reviewed import workflow rather than being guessed from a photo.
const GALLERY_SEEDS: readonly GallerySeed[] = [
  ["/images/gallery/gallery-shop-roland-large-format.webp", "Roland TrueVIS — In-House Printing", "Our Shop", "coroplast-signs", "Shop", 900, 1200],
  ["/images/gallery/gallery-shop-roland-ag-banner.webp", "Roland Printing — Agricultural Banner Run", "Our Shop", "vinyl-banners", "Shop", 960, 1200],
  ["/images/gallery/gallery-shop-roland-saskatoon-cabs.webp", "Roland Printing — Saskatoon Cabs Decals", "Our Shop", "stickers", "Shop", 960, 1200],
  ["/images/gallery/gallery-coroplast-realtor-keyshape.webp", "Custom-Shape Sign — Boyes Group Realtor", "from $8/sqft", "coroplast-signs", "Signs", 1200, 675],
  ["/images/gallery/gallery-coroplast-circle-made-in-canada.webp", "Custom Circle Sign — Made in Canada", "from $8/sqft", "coroplast-signs", "Signs", 900, 1200],
  ["/images/gallery/gallery-coroplast-retail-zaks-pricing.webp", "Retail Pricing Signs — Zak's", "from $8/sqft", "coroplast-signs", "Signs", 800, 1066],
  ["/images/gallery/gallery-design-retail-weve-moving.webp", "We're Moving Announcement Sign", "from $8/sqft", "coroplast-signs", "Signs", 800, 1200],
  ["/images/gallery/gallery-coroplast-remax-openhouse.webp", "Open House Sign — RE/MAX Aman Singh", "from $8/sqft", "coroplast-signs", "Signs", 1200, 1200],
  ["/images/gallery/gallery-coroplast-71st-storage.webp", "Roadside Directional Sign — 71st Street Storage", "from $8/sqft", "coroplast-signs", "Signs", 1200, 900],
  ["/images/gallery/gallery-coroplast-parking-signs.webp", "Private Parking Signs — Batch Order", "from $8/sqft", "coroplast-signs", "Signs", 960, 1200],
  ["/images/gallery/gallery-coroplast-bjm-graduation.webp", "Grad Yard Sign — Bishop James Mahoney", "from $8/sqft", "coroplast-signs", "Signs", 960, 1200],
  ["/images/gallery/gallery-acp-cargem-auto-sales.webp", "ACP Sign — CARGEM Auto Sales", "from $13/sqft", "acp-signs", "Signs", 1200, 1200],
  ["/images/gallery/gallery-acp-mia-casa-construction.webp", "ACP Sign — Mia Casa Construction", "from $13/sqft", "acp-signs", "Signs", 960, 1200],
  ["/images/gallery/gallery-outdoor-banner-best-donairs.webp", "Outdoor Storefront Banner — Best Donairs", "from $66", "vinyl-banners", "Banners", 800, 1066],
  ["/images/gallery/gallery-vinyl-banner-windshield-masters.webp", "Vinyl Banner — Windshield Masters", "from $66", "vinyl-banners", "Banners", 800, 1066],
  ["/images/gallery/gallery-banner-habesha-convenience.webp", "Storefront Banner — Habesha Convenience Store", "from $66", "vinyl-banners", "Banners", 1200, 1200],
  ["/images/gallery/gallery-banner-colorful-nails-spa.webp", "Salon Banner — Colorful Nails & Spa", "from $66", "vinyl-banners", "Banners", 960, 1200],
  ["/images/gallery/gallery-banner-hello-warman-petshop.webp", "Large Format Banner — Hello Warman Pet Shop", "from $66", "vinyl-banners", "Banners", 1200, 1200],
  ["/images/gallery/gallery-banner-ericsson-5g.webp", "Large Format Event Banner — Ericsson 5G", "from $66", "vinyl-banners", "Banners", 1200, 1200],
  ["/images/gallery/gallery-banner-karuna-vitamin.webp", "Trade Show Backdrop — Karuna Skincare", "from $66", "vinyl-banners", "Banners", 1200, 1200],
  ["/images/gallery/gallery-retractable-banner-financial-office.webp", "Retractable Banner — Financial Services", "from $219", "retractable-banners", "Displays", 900, 1200],
  ["/images/gallery/gallery-retractable-banner-client-office.webp", "Retractable Banner — Client Delivery", "from $219", "retractable-banners", "Displays", 900, 1200],
  ["/images/gallery/gallery-retractable-borna-realtor.webp", "Retractable Banner — Borna Development Realtor", "from $219", "retractable-banners", "Displays", 960, 1200],
  ["/images/gallery/gallery-retractable-shammi-realtor.webp", "Retractable Banner — Divine Kreation Realty", "from $219", "retractable-banners", "Displays", 960, 1200],
  ["/images/gallery/gallery-retractable-wfg-insurance.webp", "Retractable Banner — WFG Insurance Agent", "from $219", "retractable-banners", "Displays", 960, 1200],
  ["/images/gallery/gallery-retractable-two-men-truck.webp", "Retractable Banner — Two Men and a Truck", "from $219", "retractable-banners", "Displays", 960, 1200],
  ["/images/gallery/gallery-retractable-lilians-hair.webp", "Retractable Banner — Lilian's Hair Studio", "from $219", "retractable-banners", "Displays", 800, 1000],
  ["/images/gallery/gallery-vehicle-decal-riverbend-door.webp", "Door Panel Decal — RiverBend Auto Glass", "from $14/sqft", "vehicle-decals", "Vehicle", 800, 600],
  ["/images/gallery/gallery-vehicle-decal-riverbend-side.webp", "Full Door Vinyl — RiverBend Auto Glass", "from $14/sqft", "vehicle-decals", "Vehicle", 800, 600],
  ["/images/gallery/gallery-vehicle-decal-riverbend-rear-window.webp", "Rear Window Decal — RiverBend Auto Glass", "from $14/sqft", "vehicle-decals", "Vehicle", 800, 600],
  ["/images/gallery/gallery-vehicle-vinyl-ayotte-plumbing.webp", "Van Vinyl Branding — Ayotte Plumbing", "from $24/sqft", "vehicle-magnets", "Vehicle", 1200, 900],
  ["/images/gallery/gallery-vehicle-vinyl-ayotte-full-side.webp", "Full Side Vinyl — Ayotte Service Van", "from $24/sqft", "vehicle-magnets", "Vehicle", 1200, 900],
  ["/images/gallery/gallery-vehicle-decal-windshield-masters.webp", "Door Magnet — Windshield Masters", "from $24/sqft", "vehicle-magnets", "Vehicle", 800, 1066],
  ["/images/gallery/gallery-vehicle-vinyl-south-stream.webp", "Truck Wrap — South Stream Seafood", "from $24/sqft", "vehicle-magnets", "Vehicle", 1200, 1200],
  ["/images/gallery/gallery-vinyl-lettering-skbk-trailer.webp", "Trailer Lettering — SKBK Construction", "from $8.50/sqft", "vinyl-lettering", "Vehicle", 1200, 900],
  ["/images/gallery/gallery-window-decal-swiss-barber.webp", "Window Decals — Swiss Barber", "from $11/sqft", "window-decals", "Window & Vinyl", 800, 1066],
  ["/images/gallery/gallery-window-decal-pact-agriculture.webp", "Office Window Decals — PACT", "from $11/sqft", "window-decals", "Window & Vinyl", 900, 1200],
  ["/images/gallery/gallery-window-decal-skull-car.webp", "Custom Window Decal — Die-Cut Skull", "from $11/sqft", "window-decals", "Window & Vinyl", 1200, 800],
  ["/images/gallery/gallery-vinyl-lettering-cowry-kitchen.webp", "Storefront Vinyl Lettering — Cowry Cabinets", "from $8.50/sqft", "vinyl-lettering", "Window & Vinyl", 1200, 1200],
  ["/images/gallery/gallery-vinyl-lettering-mags.webp", "Large Cut Vinyl Letters — MAGS", "from $8.50/sqft", "vinyl-lettering", "Window & Vinyl", 960, 1200],
  ["/images/gallery/gallery-business-cards-bd-deep-cleaning.webp", "Business Cards — BD Deep Cleaning", "from $45", "business-cards", "Cards & Print", 900, 1200],
  ["/images/gallery/gallery-loyalty-card-prairie-cannabis.webp", "Loyalty Card — Prairie Cannabis", "from $45", "business-cards", "Cards & Print", 900, 1200],
  ["/images/gallery/gallery-business-cards-nofal-barber.webp", "Business Cards — Nofal Barber Shop", "from $45", "business-cards", "Cards & Print", 1200, 1200],
  ["/images/gallery/gallery-business-cards-lilians-hair.webp", "Business Cards — Lilian's Hair Studio", "from $45", "business-cards", "Cards & Print", 1200, 787],
  ["/images/gallery/gallery-flyers-boxed-marketing.webp", "Marketing Flyers — Boxed Order", "from $45", "flyers", "Cards & Print", 1200, 675],
  ["/images/gallery/gallery-flyer-pulse-strategies.webp", "Professional Flyer — Pulse Strategies CPA", "from $45", "flyers", "Cards & Print", 900, 1200],
  ["/images/gallery/gallery-large-format-realtor-poster.webp", "Large Format Print — Kevin Appl REALTOR", "from $8/sqft", "flyers", "Cards & Print", 1200, 900],
  ["/images/gallery/gallery-flyer-nissen-ramen.webp", "Restaurant Flyer — Nissen Dim Sum Ramen", "from $45", "flyers", "Cards & Print", 1200, 1200],
  ["/images/gallery/gallery-flyer-sprayright-agri.webp", "Agricultural Flyer — SprayRight", "from $45", "flyers", "Cards & Print", 960, 1200],
  ["/images/gallery/gallery-flyer-axis-health.webp", "Rack Cards — Axis Health Center", "from $45", "flyers", "Cards & Print", 960, 1200],
  ["/images/gallery/gallery-postcards-oxenfree-crafts.webp", "Postcards — Oxenfree Crafts", "from $35", "postcards", "Cards & Print", 960, 1200],
  ["/images/gallery/gallery-stickers-dyck-farms.webp", "Sticker Sheets — Dyck Farms", "from $25", "stickers", "Cards & Print", 960, 1200],
  ["/images/gallery/gallery-magnet-calendar-shuttle.webp", "Calendar Magnet — Prairie Path Shuttle", "from $45", "magnet-calendars", "Magnets", 1200, 675],
  ["/images/gallery/gallery-magnet-calendar-lyndell-concrete.webp", "Calendar Magnet — Lyndell Concrete Supply", "from $45", "magnet-calendars", "Magnets", 1200, 1189],
  [
    "/images/gallery/gallery-boat-licence-number-lettering.webp",
    "Boat Licence-Number and Name Lettering",
    "Custom lettering",
    "vinyl-lettering",
    "Vehicle",
    1200,
    900,
    {
      caption: "Pleasure craft licence-number decals and custom boat-name lettering prepared in Saskatoon.",
      alt: "Red and grey pleasure craft licence-number and boat-name lettering prepared in Saskatoon",
      kind: "real-client",
      rightsStatus: "approved",
      privacyStatus: "reviewed",
      published: true,
      homepageFeatured: false,
    },
  ],
  [
    "/images/gallery/gallery-coroplast-fowlplay-decoys.webp",
    "Coroplast Stake Sign — Fowlplay Decoys",
    "from $8/sqft",
    "coroplast-signs",
    "Signs",
    1200,
    859,
    {
      caption: "Finished Fowlplay Decoys coroplast stake sign printed in Saskatoon.",
      alt: "Fowlplay Decoys coroplast stake sign printed by True Color in Saskatoon",
      kind: "real-client",
      rightsStatus: "approved",
      privacyStatus: "reviewed",
      published: true,
      homepageFeatured: false,
      clientDisplayName: "Fowlplay Decoys",
    },
  ],
  [
    "/images/gallery/gallery-coroplast-team-auctions-bid-sign.webp",
    "Coroplast Bid Sign — Team Auctions",
    "from $8/sqft",
    "coroplast-signs",
    "Signs",
    1200,
    754,
    {
      caption: "Team Auctions bid-direction coroplast sign printed in Saskatoon.",
      alt: "Red and white Team Auctions bid-direction coroplast sign printed in Saskatoon",
      kind: "real-client",
      rightsStatus: "approved",
      privacyStatus: "reviewed",
      published: true,
      homepageFeatured: true,
      clientDisplayName: "Team Auctions",
    },
  ],
  [
    "/images/gallery/gallery-custom-large-format-printed-graphic.webp",
    "Custom Large-Format Printed Graphic",
    "Custom quote",
    "custom-printing",
    "Signs",
    1200,
    857,
    {
      caption: "Custom large-format printed graphic produced at our Saskatoon shop.",
      alt: "Blue and white custom large-format printed graphic produced in Saskatoon",
      kind: "real-client",
      productHref: "/products",
      rightsStatus: "approved",
      privacyStatus: "reviewed",
      published: true,
      homepageFeatured: false,
    },
  ],
  [
    "/images/gallery/gallery-short-run-hiring-prints.webp",
    "Short-Run Hiring Prints",
    "Short-run printing",
    "flyers",
    "Cards & Print",
    1200,
    346,
    {
      caption: "Short-run hiring prints produced for a Saskatoon business.",
      alt: "Three short-run hiring prints produced for a Saskatoon business",
      kind: "real-client",
      rightsStatus: "approved",
      privacyStatus: "reviewed",
      published: true,
      homepageFeatured: false,
    },
  ],
  [
    "/images/gallery/gallery-wide-format-print-production.webp",
    "In-House Wide-Format Print Production",
    "Our Shop",
    "wide-format-printing",
    "Shop",
    468,
    1200,
    {
      caption: "A colourful wide-format print produced in-house at our Saskatoon shop.",
      alt: "Colourful wide-format graphic during in-house print production in Saskatoon",
      kind: "shop-process",
      productHref: "/products",
      rightsStatus: "approved",
      privacyStatus: "reviewed",
      published: true,
      homepageFeatured: true,
    },
  ],
] as const;

function projectId(src: string): string {
  return src.slice(src.lastIndexOf("/") + 1).replace(/\.[^.]+$/, "");
}

export const GALLERY_PROJECTS: readonly GalleryProject[] = GALLERY_SEEDS.map(
  ([src, label, priceLabel, productSlug, category, width, height, overrides = {}], index) => ({
    id: overrides.id ?? projectId(src),
    src,
    width,
    height,
    focalPoint: overrides.focalPoint ?? { x: 50, y: 50 },
    displayOrder: index + 1,
    title: label,
    caption: overrides.caption ?? label,
    alt:
      overrides.alt ??
      `${label} — ${category} printing by True Color Display Printing, Saskatoon`,
    kind: overrides.kind ?? (category === "Shop" ? "shop-process" : "real-client"),
    category,
    productSlug,
    productHref:
      overrides.productHref ?? GALLERY_PRODUCT_HREFS[productSlug] ?? `/products/${productSlug}`,
    priceLabel,
    rightsStatus: overrides.rightsStatus ?? "legacy-public",
    privacyStatus: overrides.privacyStatus ?? "reviewed",
    published: overrides.published ?? true,
    homepageFeatured: overrides.homepageFeatured ?? false,
    ...(overrides.clientDisplayName
      ? { clientDisplayName: overrides.clientDisplayName }
      : {}),
  }),
);

export const PUBLISHED_GALLERY_PROJECTS = GALLERY_PROJECTS.filter(
  (project) => project.published && project.rightsStatus !== "hold",
);
