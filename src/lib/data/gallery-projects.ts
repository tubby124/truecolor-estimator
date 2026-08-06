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
  // 2026-08-06 proof-of-work wave — imported via scripts/import-gallery-images.mjs (batches 1+2)
  ["/images/gallery/gallery-coroplast-aw-bogo-promo.webp", "Promo Sign — A&W Restaurant", "from $8/sqft", "coroplast-signs", "Signs", 900, 1200, { id: "coroplast-aw-bogo-promo", focalPoint: { x: 50, y: 50 }, caption: "Full-colour coroplast promo sign printed for an A&W restaurant campaign.", alt: "A&W buy-one-get-one promo sign on coroplast printed by True Color in Saskatoon", kind: "real-client", productHref: "/coroplast-signs-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-retractable-sisters-kitchen.webp", "Retractable Banner — Sister's Kitchen", "from $219", "retractable-banners", "Displays", 1200, 915, { id: "retractable-sisters-kitchen", focalPoint: { x: 50, y: 45 }, caption: "Food catering retractable banner with full photo collage, printed and assembled in-house.", alt: "Sister's Kitchen catering retractable banner stand printed in Saskatoon", kind: "real-client", productHref: "/retractable-banners-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-stickers-crime-stoppers.webp", "Decals — Saskatoon Crime Stoppers", "from $25", "stickers", "Cards & Print", 900, 1200, { id: "stickers-crime-stoppers", focalPoint: { x: 55, y: 45 }, caption: "Printed and cut decal sets for Saskatoon Crime Stoppers alongside service-dog notice stickers.", alt: "Saskatoon Crime Stoppers decals and sticker sheets printed by True Color", kind: "real-client", productHref: "/sticker-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-coroplast-telemiracle-shield.webp", "Custom-Shape Sign — TeleMiracle 50", "from $50", "custom-shape-signs", "Signs", 900, 1200, { id: "coroplast-telemiracle-shield", focalPoint: { x: 50, y: 50 }, caption: "Contour-cut TeleMiracle 50 Kinsmen Kinettes shield, printed and cut on the in-house Roland.", alt: "TeleMiracle 50 Kinsmen custom-shape sign printed and contour cut in Saskatoon", kind: "real-client", productHref: "/products/custom-shape-signs", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-window-decal-hutch-barber-storefront.webp", "Storefront Windows — Hutch Barber", "from $11/sqft", "window-decals", "Window & Vinyl", 900, 1200, { id: "window-decal-hutch-barber-storefront", focalPoint: { x: 45, y: 50 }, caption: "Perforated and cut window graphics installed across the Hutch Barber storefront on Idylwyld Drive.", alt: "Hutch Barber storefront window decals installed in Saskatoon by True Color", kind: "real-client", productHref: "/window-decals-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-retractable-financial-planner-pickup.webp", "Banner Pickup — Financial Planner", "from $219", "retractable-banners", "Displays", 900, 1200, { id: "retractable-financial-planner-pickup", focalPoint: { x: 50, y: 40 }, caption: "A client picking up his finished retractable banner at the shop — printed, assembled, and ready same visit.", alt: "Client with finished retractable banner at True Color print shop in Saskatoon", kind: "real-client", productHref: "/retractable-banners-saskatoon", rightsStatus: "hold", privacyStatus: "review-required", published: false, homepageFeatured: false }],
  ["/images/gallery/gallery-flyer-madina-spice.webp", "Grocery Flyers — Madina Spice", "from $45", "flyers", "Cards & Print", 900, 1200, { id: "flyer-madina-spice", focalPoint: { x: 50, y: 50 }, caption: "Full-colour weekly grocery flyers printed in volume for Madina Spice.", alt: "Madina Spice grocery store flyers printed in Saskatoon by True Color", kind: "real-client", productHref: "/flyer-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-magnet-calendar-ramadan-prayers.webp", "Prayer Calendars — First Choice", "from $45", "magnet-calendars", "Magnets", 900, 1200, { id: "magnet-calendar-ramadan-prayers", focalPoint: { x: 50, y: 40 }, caption: "Ramadan prayer and iqama time calendar magnets printed for First Choice.", alt: "Ramadan prayer time calendar magnets printed in Saskatoon by True Color", kind: "real-client", productHref: "/products/magnet-calendars", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-magnet-calendar-hague-trucking.webp", "Wall Calendars — Trucking Company", "from $45", "magnet-calendars", "Magnets", 1200, 1189, { id: "magnet-calendar-hague-trucking", focalPoint: { x: 50, y: 45 }, caption: "Custom photo wall calendars for a Hague, SK trucking company — fleet photos and full-year layout.", alt: "Custom trucking company wall calendars printed by True Color Saskatoon", kind: "real-client", productHref: "/products/magnet-calendars", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-photo-poster-kevin-appl.webp", "Framed Poster — Kevin Appl, REAL", "from $15", "photo-posters", "Cards & Print", 900, 1200, { id: "photo-poster-kevin-appl", focalPoint: { x: 50, y: 45 }, caption: "Client-appreciation photo poster printed for realtor Kevin Appl.", alt: "Framed photo poster for realtor Kevin Appl printed in Saskatoon", kind: "real-client", productHref: "/photo-poster-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-flyers-event-show-run.webp", "Event Show Flyers — Studio Run", "from $45", "flyers", "Cards & Print", 1200, 1200, { id: "flyers-event-show-run", focalPoint: { x: 50, y: 50 }, caption: "Vibrant event show flyers fresh off the digital press — colour that pops straight off the stack.", alt: "Colorful event show flyers printed on digital press at True Color Saskatoon", kind: "shop-process", productHref: "/flyer-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-banner-dee-bee-shoppe.webp", "Vinyl Banner — Dee Bee Shoppe", "from $66", "vinyl-banners", "Banners", 900, 1200, { id: "banner-dee-bee-shoppe", focalPoint: { x: 50, y: 45 }, caption: "Cotton candy vendor banner printed on 13oz scrim vinyl for the Dee Bee Shoppe.", alt: "Dee Bee Shoppe cotton candy vinyl banner printed in Saskatoon", kind: "real-client", productHref: "/banner-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-acp-coop-humboldt-platinum.webp", "ACP Panel — Co-op Humboldt", "from $13/sqft", "acp-signs", "Signs", 900, 1200, { id: "acp-coop-humboldt-platinum", focalPoint: { x: 50, y: 45 }, caption: "Platinum sponsor recognition panel printed on aluminum composite for Co-op Humboldt.", alt: "Co-op Humboldt platinum sponsor ACP sign printed by True Color Saskatoon", kind: "real-client", productHref: "/acp-signs-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-acp-car-city-auto.webp", "Dealership Sign — Car City Auto", "from $13/sqft", "acp-signs", "Signs", 1200, 838, { id: "acp-car-city-auto", focalPoint: { x: 50, y: 50 }, caption: "Appointment-only dealership sign printed in full colour on rigid panel for Car City Auto.", alt: "Car City Auto dealership sign printed in Saskatoon by True Color", kind: "real-client", productHref: "/acp-signs-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-acp-pet-planet-parking.webp", "Parking Sign — Pet Planet", "from $13/sqft", "acp-signs", "Signs", 900, 1200, { id: "acp-pet-planet-parking", focalPoint: { x: 50, y: 45 }, caption: "Customer parking directional sign printed for Pet Planet — clean layout, tow-notice fine print.", alt: "Pet Planet customer parking sign printed by True Color in Saskatoon", kind: "real-client", productHref: "/acp-signs-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-window-graphics-axis-health.webp", "Storefront Graphics — Axis Health", "from $11/sqft", "window-decals", "Window & Vinyl", 1200, 900, { id: "window-graphics-axis-health", focalPoint: { x: 50, y: 55 }, caption: "Service-menu window graphics installed across the Axis Health Centre storefront.", alt: "Axis Health Centre storefront window graphics installed in Saskatoon", kind: "real-client", productHref: "/window-decals-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-vinyl-lettering-nova-auto-centre.webp", "Wall Lettering — Nova Auto Centre", "from $8.50/sqft", "vinyl-lettering", "Window & Vinyl", 1200, 900, { id: "vinyl-lettering-nova-auto-centre", focalPoint: { x: 50, y: 40 }, caption: "Large interior wall lettering cut and installed for the Nova Auto Centre showroom.", alt: "Nova Auto Centre interior wall vinyl lettering installed in Saskatoon", kind: "real-client", productHref: "/vinyl-lettering-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-install-saap-building-sign.webp", "Building Sign Install — SAAP", "from $13/sqft", "acp-signs", "Signs", 1200, 900, { id: "install-saap-building-sign", focalPoint: { x: 50, y: 40 }, caption: "On-site building sign installation with boom lift — print, produce, and install handled end to end.", alt: "Building sign installation with boom lift by True Color in Saskatchewan", kind: "real-client", productHref: "/acp-signs-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-banner-windshield-hub-building.webp", "Building Banner — Windshield Hub", "from $66", "vinyl-banners", "Banners", 1200, 904, { id: "banner-windshield-hub-building", focalPoint: { x: 50, y: 35 }, caption: "Exterior building banner printed and mounted for Windshield Hub's Saskatoon location.", alt: "Windshield Hub exterior building banner installed in Saskatoon", kind: "real-client", productHref: "/banner-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-banner-bbq-junction.webp", "Long-Format Banner — BBQ Junction", "from $66", "vinyl-banners", "Banners", 900, 1200, { id: "banner-bbq-junction", focalPoint: { x: 30, y: 50 }, caption: "Extra-wide restaurant banner printed edge to edge for BBQ Junction.", alt: "BBQ Junction wide vinyl banner printed by True Color Saskatoon", kind: "real-client", productHref: "/banner-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-retractable-express-photography.webp", "Retractable — Express Photography", "from $219", "retractable-banners", "Displays", 900, 1200, { id: "retractable-express-photography", focalPoint: { x: 50, y: 45 }, caption: "Black-and-gold retractable banner printed for Express Photography — premium studio look.", alt: "Express Photography black and gold retractable banner printed in Saskatoon", kind: "real-client", productHref: "/retractable-banners-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-booklets-ten31-property.webp", "Coil Booklets — Ten31 Property", "from $65", "coil-bound-booklets", "Cards & Print", 900, 1200, { id: "booklets-ten31-property", focalPoint: { x: 50, y: 50 }, caption: "Coil-bound business tracker booklets printed and bound in-house for Ten31 Property.", alt: "Ten31 Property coil-bound business booklets printed in Saskatoon", kind: "real-client", productHref: "/products/coil-bound-booklets", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-vehicle-decal-xray-roofing.webp", "Truck Decals — X-Ray Roofing", "from $14/sqft", "vehicle-decals", "Vehicle", 1200, 900, { id: "vehicle-decal-xray-roofing", focalPoint: { x: 55, y: 50 }, caption: "Cut vinyl truck decals applied to the X-Ray Roofing work truck — number readable across a job site.", alt: "X-Ray Roofing truck vinyl decals installed by True Color Saskatoon", kind: "real-client", productHref: "/vehicle-decals-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-stickers-rock-water-brewing.webp", "Sticker Sheets — Rock Water", "from $25", "stickers", "Cards & Print", 900, 1200, { id: "stickers-rock-water-brewing", focalPoint: { x: 50, y: 50 }, caption: "Die-cut logo sticker sheets printed and kiss-cut for Rock Water Brewing.", alt: "Rock Water Brewing die-cut logo stickers printed in Saskatoon", kind: "real-client", productHref: "/sticker-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-custom-shape-drywall-starburst.webp", "Retail Starbursts — Die-Cut", "from $50", "custom-shape-signs", "Signs", 900, 1200, { id: "custom-shape-drywall-starburst", focalPoint: { x: 50, y: 40 }, caption: "Die-cut starburst shelf signs for a retail drywall promo — contour cut to shape in-house.", alt: "Die-cut yellow starburst retail promo signs printed in Saskatoon", kind: "real-client", productHref: "/products/custom-shape-signs", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-coroplast-exp-open-house.webp", "Open House Sign — eXp Realty", "from $8/sqft", "coroplast-signs", "Signs", 900, 1200, { id: "coroplast-exp-open-house", focalPoint: { x: 50, y: 45 }, caption: "Directional open house sign printed on coroplast for an eXp Realty team.", alt: "eXp Realty open house coroplast sign printed in Saskatoon", kind: "real-client", productHref: "/coroplast-signs-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-flyers-wiens-campaign.webp", "Campaign Flyers — Ward Seven", "from $45", "flyers", "Cards & Print", 900, 1200, { id: "flyers-wiens-campaign", focalPoint: { x: 50, y: 45 }, caption: "Municipal campaign flyers printed in volume stacks for a Saskatoon ward candidate.", alt: "Election campaign flyers printed in bulk stacks by True Color Saskatoon", kind: "real-client", productHref: "/flyer-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-business-cards-exp-premium-black.webp", "Premium Cards — eXp Realty", "from $45", "business-cards", "Cards & Print", 1200, 900, { id: "business-cards-exp-premium-black", focalPoint: { x: 50, y: 50 }, caption: "Premium black business cards with photo panel and QR code for an eXp Realty agent.", alt: "Premium black eXp Realty business cards printed in Saskatoon", kind: "real-client", productHref: "/business-cards-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-poster-roxy-super8-event.webp", "Event Poster — Roxy Theatre", "from $15", "photo-posters", "Cards & Print", 900, 1200, { id: "poster-roxy-super8-event", focalPoint: { x: 50, y: 40 }, caption: "Illustrated event posters printed for the One Take Super 8 screening at the Roxy Theatre.", alt: "One Take Super 8 event posters for Roxy Theatre printed in Saskatoon", kind: "real-client", productHref: "/photo-poster-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-aframe-cafe-sidewalk-sign.webp", "A-Frame Sidewalk Sign — Café", "from $8/sqft", "coroplast-signs", "Signs", 900, 1200, { id: "aframe-cafe-sidewalk-sign", focalPoint: { x: 50, y: 45 }, caption: "Sidewalk A-frame insert printed for a café promo — coroplast insert sized for a standard frame.", alt: "Cafe A-frame sidewalk sign insert printed by True Color Saskatoon", kind: "real-client", productHref: "/coroplast-signs-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-custom-shape-sasknation.webp", "Custom-Shape Sign — SaskNation", "from $50", "custom-shape-signs", "Signs", 900, 1200, { id: "custom-shape-sasknation", focalPoint: { x: 50, y: 50 }, caption: "Contour-cut SaskNation arrow sign printed and cut in-house.", alt: "SaskNation custom-shape arrow sign printed in Saskatoon by True Color", kind: "real-client", productHref: "/products/custom-shape-signs", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-foamboard-branding-panels.webp", "Rigid Display Panels — Branding Set", "from $45", "foamboard-displays", "Displays", 900, 1200, { id: "foamboard-branding-panels", focalPoint: { x: 50, y: 50 }, caption: "Dark-theme rigid display panels printed as a coordinated branding set with QR codes.", alt: "Dark rigid branding display panels with QR codes printed in Saskatoon", kind: "real-client", productHref: "/foamboard-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-coroplast-bid-on-me-auction.webp", "Auction Signs — Bid On Me", "from $8/sqft", "coroplast-signs", "Signs", 900, 1200, { id: "coroplast-bid-on-me-auction", focalPoint: { x: 50, y: 45 }, caption: "QR-coded equipment auction signs printed on coroplast for a consignment sale.", alt: "Bid On Me equipment auction coroplast signs with QR codes printed in Saskatoon", kind: "real-client", productHref: "/coroplast-signs-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-banner-strength-nation-champions.webp", "Team Banner — Strength Nation", "from $66", "vinyl-banners", "Banners", 901, 1200, { id: "banner-strength-nation-champions", focalPoint: { x: 55, y: 45 }, caption: "U11 hockey champions banner coming off the Roland wide-format printer.", alt: "Strength Nation hockey champions banner printing on Roland in Saskatoon", kind: "shop-process", productHref: "/banner-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-postcards-zaks-home-hardware.webp", "Promo Cards — Zak's Home Hardware", "from $35", "postcards", "Cards & Print", 900, 1200, { id: "postcards-zaks-home-hardware", focalPoint: { x: 45, y: 50 }, caption: "Engraving promo cards printed in volume for Zak's Home Hardware.", alt: "Zak's Home Hardware promo cards printed in Saskatoon by True Color", kind: "real-client", productHref: "/postcard-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-stickers-scott-lake-lodge.webp", "Decals — Scott Lake Lodge", "from $25", "stickers", "Cards & Print", 1200, 900, { id: "stickers-scott-lake-lodge", focalPoint: { x: 45, y: 50 }, caption: "Large die-cut logo decals printed for Scott Lake Lodge in the Northwest Territories.", alt: "Scott Lake Lodge die-cut logo decals printed by True Color Saskatoon", kind: "real-client", productHref: "/sticker-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-retractable-dee-bee-shoppe.webp", "Retractable — Dee Bee Shoppe", "from $219", "retractable-banners", "Displays", 900, 1200, { id: "retractable-dee-bee-shoppe", focalPoint: { x: 50, y: 45 }, caption: "Cotton candy vendor retractable banner printed and assembled for the Dee Bee Shoppe.", alt: "Dee Bee Shoppe retractable banner stand printed in Saskatoon", kind: "real-client", productHref: "/retractable-banners-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-business-cards-allied-infrastructure.webp", "Business Cards — Allied Infrastructure", "from $45", "business-cards", "Cards & Print", 900, 1200, { id: "business-cards-allied-infrastructure", focalPoint: { x: 50, y: 50 }, caption: "Clean corporate business cards printed for Allied Infrastructure.", alt: "Allied Infrastructure business cards printed in Saskatoon by True Color", kind: "real-client", productHref: "/business-cards-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-window-graphics-logistics-storefront.webp", "Window Graphics — Logistics Office", "from $11/sqft", "window-decals", "Window & Vinyl", 1200, 900, { id: "window-graphics-logistics-storefront", focalPoint: { x: 50, y: 50 }, caption: "Full storefront window graphics installed for a Saskatoon logistics and finance office.", alt: "Logistics office storefront window graphics installed in Saskatoon", kind: "real-client", productHref: "/window-decals-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-window-lettering-cowry-storefront.webp", "Storefront Sale Lettering — Cowry", "from $11/sqft", "window-decals", "Window & Vinyl", 1080, 1080, { id: "window-lettering-cowry-storefront", focalPoint: { x: 50, y: 50 }, caption: "Multi-window sale lettering installed across the Cowry Kitchen & Bathroom Cabinets storefront.", alt: "Cowry Cabinets storefront sale window lettering installed in Saskatoon", kind: "real-client", productHref: "/window-decals-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-coroplast-mint-dental-sponsor.webp", "Sponsor Sign — Mint Dental Centre", "from $8/sqft", "coroplast-signs", "Signs", 900, 1200, { id: "coroplast-mint-dental-sponsor", focalPoint: { x: 50, y: 45 }, caption: "Gold-tier sponsor recognition sign printed for Mint Dental Centre.", alt: "Mint Dental Centre gold sponsor sign printed in Saskatoon by True Color", kind: "real-client", productHref: "/coroplast-signs-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-coroplast-borna-development-site.webp", "Site Sign — Borna Development", "from $8/sqft", "coroplast-signs", "Signs", 900, 1200, { id: "coroplast-borna-development-site", focalPoint: { x: 40, y: 50 }, caption: "For-sale development site sign printed for Borna Development Inc.", alt: "Borna Development for sale site sign printed in Saskatoon", kind: "real-client", productHref: "/coroplast-signs-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-window-decal-namaste-door.webp", "Door Decal — Namaste", "from $11/sqft", "window-decals", "Window & Vinyl", 900, 1200, { id: "window-decal-namaste-door", focalPoint: { x: 50, y: 40 }, caption: "Etched-style welcome decal installed on a glass entry door.", alt: "Namaste welcome glass door decal installed in Saskatoon by True Color", kind: "real-client", productHref: "/window-decals-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-vinyl-lettering-prairie-timber.webp", "Cut Lettering — Prairie Timber Homes", "from $8.50/sqft", "vinyl-lettering", "Window & Vinyl", 1080, 1080, { id: "vinyl-lettering-prairie-timber", focalPoint: { x: 50, y: 50 }, caption: "Large-format cut lettering produced for Prairie Timber Homes.", alt: "Prairie Timber Homes large cut vinyl lettering printed in Saskatoon", kind: "real-client", productHref: "/vinyl-lettering-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-poster-paved-arts-concoction.webp", "Event Poster — PAVED Arts", "from $15", "photo-posters", "Cards & Print", 900, 1200, { id: "poster-paved-arts-concoction", focalPoint: { x: 50, y: 45 }, caption: "Concert poster printed for the PAVED Arts Concoction event.", alt: "PAVED Arts Concoction event poster printed in Saskatoon by True Color", kind: "real-client", productHref: "/photo-poster-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-banner-baydo-golf-tour.webp", "Event Banner — Baydo Golf Tour", "from $66", "vinyl-banners", "Banners", 768, 768, { id: "banner-baydo-golf-tour", focalPoint: { x: 50, y: 50 }, caption: "Golf tour event banner printed for Baydo Express Business Travel.", alt: "Baydo Golf Tour event vinyl banner printed in Saskatoon", kind: "real-client", productHref: "/banner-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-coroplast-k-realty-for-sale.webp", "For Sale Sign — K Realty", "from $8/sqft", "coroplast-signs", "Signs", 900, 1200, { id: "coroplast-k-realty-for-sale", focalPoint: { x: 50, y: 45 }, caption: "Realtor for-sale sign with photo panel printed on coroplast for K Realty.", alt: "K Realty for sale coroplast sign printed in Saskatoon by True Color", kind: "real-client", productHref: "/coroplast-signs-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-brochure-saddle-stitched-booklet.webp", "Saddle-Stitched Booklet", "from $70", "brochures", "Cards & Print", 900, 1200, { id: "brochure-saddle-stitched-booklet", focalPoint: { x: 50, y: 50 }, caption: "Multi-page saddle-stitched booklet printed and finished in-house.", alt: "Saddle-stitched booklet printed and bound by True Color Saskatoon", kind: "real-client", productHref: "/brochure-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-foamboard-chatime-drink-poster.webp", "Drink Poster — Chatime", "from $45", "foamboard-displays", "Displays", 900, 1200, { id: "foamboard-chatime-drink-poster", focalPoint: { x: 50, y: 45 }, caption: "Menu promo board printed for a Chatime iced americano campaign.", alt: "Chatime iced americano promo poster board printed in Saskatoon", kind: "real-client", productHref: "/foamboard-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-signs-service-dogs-batch.webp", "Facility Signs — Batch Order", "from $13/sqft", "acp-signs", "Signs", 900, 1200, { id: "signs-service-dogs-batch", focalPoint: { x: 50, y: 50 }, caption: "Service-dogs-welcome facility signs printed as a repeat batch order.", alt: "Service dogs welcome facility signs batch printed in Saskatoon", kind: "real-client", productHref: "/acp-signs-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-coroplast-kids-fest-bouncy-castle.webp", "Event Sign — October Kids Fest", "from $8/sqft", "coroplast-signs", "Signs", 1200, 900, { id: "coroplast-kids-fest-bouncy-castle", focalPoint: { x: 50, y: 50 }, caption: "Colourful bouncy castle event sign printed for a kids fest.", alt: "Bouncy castle October kids fest event sign printed in Saskatoon", kind: "real-client", productHref: "/coroplast-signs-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-vehicle-decal-radio-cabs.webp", "Door Decals — Saskatoon Radio Cabs", "from $14/sqft", "vehicle-decals", "Vehicle", 900, 1200, { id: "vehicle-decal-radio-cabs", focalPoint: { x: 45, y: 50 }, caption: "Oval door decals printed and cut for the Saskatoon Radio Cabs fleet.", alt: "Saskatoon Radio Cabs oval vehicle door decals printed by True Color", kind: "real-client", productHref: "/vehicle-decals-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-coroplast-exp-land-for-sale.webp", "Development Sign — Land For Sale", "from $8/sqft", "coroplast-signs", "Signs", 900, 1200, { id: "coroplast-exp-land-for-sale", focalPoint: { x: 50, y: 50 }, caption: "Multi-lot land-for-sale development sign with floor plans and pricing detail.", alt: "eXp Realty land for sale development sign printed in Saskatoon", kind: "real-client", productHref: "/coroplast-signs-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-vinyl-lettering-wedding-gold.webp", "Wedding Lettering — Gold Script", "from $8.50/sqft", "vinyl-lettering", "Window & Vinyl", 900, 1200, { id: "vinyl-lettering-wedding-gold", focalPoint: { x: 50, y: 50 }, caption: "Gold script wedding lettering cut for a ceremony backdrop.", alt: "Gold script wedding vinyl lettering cut by True Color Saskatoon", kind: "real-client", productHref: "/vinyl-lettering-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-rack-card-bengali-realtors.webp", "Rack Cards — Realtor Team", "from $25", "rack-cards", "Cards & Print", 506, 1200, { id: "rack-card-bengali-realtors", focalPoint: { x: 50, y: 40 }, caption: "Tall-format rack cards printed for a Calgary realtor team's seminar campaign.", alt: "Realtor team rack cards printed by True Color Display Printing", kind: "real-client", productHref: "/products/rack-cards", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-sticker-tc-zebra-die-cut.webp", "Die-Cut Sticker — Shop Mascot", "from $25", "stickers", "Cards & Print", 800, 1200, { id: "sticker-tc-zebra-die-cut", focalPoint: { x: 50, y: 45 }, caption: "Our own die-cut zebra shop sticker — full-colour print with contour cut.", alt: "True Color zebra die-cut sticker printed in Saskatoon print shop", kind: "shop-process", productHref: "/sticker-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-poster-morris-minor-art.webp", "Art Print — Morris Minor", "from $15", "photo-posters", "Cards & Print", 1200, 900, { id: "poster-morris-minor-art", focalPoint: { x: 45, y: 50 }, caption: "Vintage Morris Minor art reproduction printed on the wide-format press.", alt: "Vintage Morris Minor art print reproduction printed in Saskatoon", kind: "real-client", productHref: "/photo-poster-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-business-cards-fade-city.webp", "Business Cards — Fade City", "from $45", "business-cards", "Cards & Print", 1200, 900, { id: "business-cards-fade-city", focalPoint: { x: 50, y: 45 }, caption: "Bold photo business cards printed for the Fade City barber studio.", alt: "Fade City barber business cards printed in Saskatoon by True Color", kind: "real-client", productHref: "/business-cards-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-vehicle-decal-hyundai-stripes.webp", "Accent Stripes — Hyundai N", "from $14/sqft", "vehicle-decals", "Vehicle", 1200, 900, { id: "vehicle-decal-hyundai-stripes", focalPoint: { x: 50, y: 60 }, caption: "Red accent rocker stripes cut and installed on a Hyundai N sport model.", alt: "Red accent vinyl stripes installed on Hyundai N in Saskatoon", kind: "real-client", productHref: "/vehicle-decals-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-acp-car-city-installed.webp", "Installed Sign — Car City Auto", "from $13/sqft", "acp-signs", "Signs", 1200, 618, { id: "acp-car-city-installed", focalPoint: { x: 50, y: 40 }, caption: "Car City Auto dealership sign mounted and lit on the brick storefront.", alt: "Car City Auto sign installed on brick building in Saskatoon", kind: "real-client", productHref: "/acp-signs-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-window-decal-jae-kim-photography.webp", "Door Decal — Jae Kim Photography", "from $11/sqft", "window-decals", "Window & Vinyl", 900, 1200, { id: "window-decal-jae-kim-photography", focalPoint: { x: 50, y: 45 }, caption: "Gold logo door decal installed for the Jae Kim Photography studio entrance.", alt: "Jae Kim Photography gold door decal installed in Saskatoon", kind: "real-client", productHref: "/window-decals-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-postcards-wedding-stationery.webp", "Wedding Stationery Suite", "from $35", "postcards", "Cards & Print", 900, 1200, { id: "postcards-wedding-stationery", focalPoint: { x: 50, y: 45 }, caption: "Ceremony cards, signage inserts, and welcome stationery printed as a wedding suite.", alt: "Wedding ceremony stationery suite printed by True Color Saskatoon", kind: "real-client", productHref: "/postcard-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-shop-storefront-lightbox.webp", "Our Shop — 216 33rd St W", "Our Shop", "coroplast-signs", "Shop", 1200, 1200, { id: "shop-storefront-lightbox", focalPoint: { x: 50, y: 40 }, caption: "The True Color storefront and lightbox sign at 216 33rd St W, Saskatoon.", alt: "True Color Display Printing storefront and lightbox sign in Saskatoon", kind: "shop-process", productHref: "/sign-company-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-flyers-grand-opening-stacks.webp", "Grand Opening Flyers — Volume Run", "from $45", "flyers", "Cards & Print", 675, 1200, { id: "flyers-grand-opening-stacks", focalPoint: { x: 50, y: 45 }, caption: "Grand-opening flyer stacks cut and boxed for an auto glass shop launch.", alt: "Grand opening flyers printed in volume stacks by True Color Saskatoon", kind: "real-client", productHref: "/flyer-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
  ["/images/gallery/gallery-sticker-stonecraft-packaging.webp", "Packaging Label — Stonecraft", "from $25", "stickers", "Cards & Print", 675, 1200, { id: "sticker-stonecraft-packaging", focalPoint: { x: 50, y: 45 }, caption: "Brand label printed and applied to product packaging for a stone veneer company.", alt: "Stone veneer company packaging label sticker printed in Saskatoon", kind: "real-client", productHref: "/sticker-printing-saskatoon", rightsStatus: "approved", privacyStatus: "reviewed", published: true, homepageFeatured: false }],
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
