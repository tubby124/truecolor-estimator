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

// Batch three is website-display-only.  The original heroes remain first so
// Merchant, feed, and shared-hero consumers keep their approved assets.
const WINDOW_DECALS_DISPLAY_GALLERY: readonly ProductDisplayImage[] = [
  {
    src: "/images/products/product/window-decal-before-after-800x600.webp",
    alt: "Before-and-after storefront window showing a colourful True Color vinyl graphic.",
    width: 800,
    height: 600,
  },
  {
    src: "/images/products/gallery/window-decals/window-decals-overview-v1-1200w.webp",
    alt: "Illustrative Bloom Room flower graphic applied to a glass storefront door.",
    width: 1200,
    height: 900,
  },
  {
    src: "/images/products/gallery/window-decals/window-decals-material-detail-v1-1200w.webp",
    alt: "Illustrative pink cherry graphic cut from opaque vinyl on a glass door.",
    width: 1200,
    height: 900,
  },
  {
    src: "/images/products/gallery/window-decals/window-decals-application-v1-1200w.webp",
    alt: "Illustrative coffee-cup window graphic on a café door, clear of its handle.",
    width: 1200,
    height: 900,
  },
  {
    src: "/images/products/gallery/window-decals/window-decals-alternate-design-v1-1200w.webp",
    alt: "Illustrative floral cut-vinyl graphic and lettering on a studio glass door.",
    width: 1200,
    height: 900,
  },
];

const BROCHURES_DISPLAY_GALLERY: readonly ProductDisplayImage[] = [
  {
    src: "/images/products/product/brochures-800x600.webp",
    alt: "Open full-colour brochure with pages of business imagery and colour blocks.",
    width: 800,
    height: 600,
  },
  {
    src: "/images/products/gallery/brochures/brochures-overview-v1-1200w.webp",
    alt: "Illustrative green botanical tri-fold brochure open beside its folded cover.",
    width: 1200,
    height: 900,
  },
  {
    src: "/images/products/gallery/brochures/brochures-material-detail-v1-1200w.webp",
    alt: "Illustrative blue and coral tri-fold brochure showing three scored panels.",
    width: 1200,
    height: 900,
  },
  {
    src: "/images/products/gallery/brochures/brochures-application-v1-1200w.webp",
    alt: "Illustrative blue-and-cream tri-fold brochure standing open on a counter.",
    width: 1200,
    height: 900,
  },
  {
    src: "/images/products/gallery/brochures/brochures-alternate-design-v1-1200w.webp",
    alt: "Illustrative terracotta and olive half-fold brochure on a desk beside a notebook.",
    width: 1200,
    height: 900,
  },
];

const FULL_NOINDEX_DISPLAY_GALLERIES: Readonly<Record<string, readonly ProductDisplayImage[]>> = {
  "acp-signs": [
    { src: "/images/products/product/acp-aluminum-sign-800x600.webp", alt: "Original Aluminum Composite Signs product image.", width: 800, height: 534 },
    { src: "/images/products/gallery/acp-signs/acp-signs-alternate-design-v1-1200w.webp", alt: "Illustrative Warm terracotta cafe directory on flat ACP, different graphic hierarchy", width: 1200, height: 900 },
    { src: "/images/products/gallery/acp-signs/acp-signs-application-v1-1200w.webp", alt: "Illustrative Aluminum Composite Signs application sample.", width: 1200, height: 900 },
    { src: "/images/products/gallery/acp-signs/acp-signs-material-detail-v1-1200w.webp", alt: "Illustrative Thin rigid edge revealing dark PE core between aluminum skins and applied printed face", width: 1200, height: 900 },
    { src: "/images/products/gallery/acp-signs/acp-signs-overview-inherited-v1-1200w.webp", alt: "Illustrative Preserve accepted rigid sign concept", width: 1200, height: 800 },
  ],
  "artwork-setup": [
    { src: "/images/products/product/logo-vectorization-formats-800x600.webp", alt: "Original Artwork Setup & File Fixes product image.", width: 1448, height: 1086 },
    { src: "/images/products/gallery/artwork-setup/artwork-setup-alternate-design-v1-1200w.webp", alt: "Illustrative Simple fictional business card file correction with consistent artwork and visible safe margin", width: 1200, height: 900 },
    { src: "/images/products/gallery/artwork-setup/artwork-setup-application-v1-1200w.webp", alt: "Illustrative Same print-ready flyer paired with finished gloss print, no fake calibration claims", width: 1200, height: 900 },
    { src: "/images/products/gallery/artwork-setup/artwork-setup-material-detail-v1-1200w.webp", alt: "Illustrative Close trim line, bleed and safe margin; guides outside final artwork and explanatory labels typeset separately", width: 1200, height: 900 },
  ],
  "boat-registration-numbers": [
    { src: "/images/industries/boat-registration-numbers/boat-registration-number-decal-aluminum-bow-1200x800.webp", alt: "Original Boat Registration Number Decals product image.", width: 1200, height: 800 },
    { src: "/images/products/gallery/boat-registration-numbers/boat-registration-numbers-alternate-design-v1-1200w.webp", alt: "Illustrative White sample number lettering on dark fibreglass hull; straight readable alignment", width: 1200, height: 900 },
    { src: "/images/products/gallery/boat-registration-numbers/boat-registration-numbers-application-v1-1200w.webp", alt: "Illustrative Dry boat on trailer with illustrative number at bow, no fabricated real registration", width: 1200, height: 900 },
    { src: "/images/products/gallery/boat-registration-numbers/boat-registration-numbers-material-detail-v1-1200w.webp", alt: "Illustrative Close smooth individual cut character edge, no printed background rectangle", width: 1200, height: 900 },
    { src: "/images/products/gallery/boat-registration-numbers/boat-registration-numbers-overview-v1-1200w.webp", alt: "Illustrative Contrasting fictional sample block character decal on clean aluminum bow, above waterline", width: 1200, height: 900 },
  ],
  "business-cards": [
    { src: "/images/products/product/business-cards-800x600.webp", alt: "Original Business Cards product image.", width: 1536, height: 1024 },
    { src: "/images/products/gallery/business-cards/business-cards-alternate-design-v1-1200w.webp", alt: "Illustrative Electric orange/navy trades-business design on smooth gloss stock", width: 1200, height: 900 },
    { src: "/images/products/gallery/business-cards/business-cards-application-v1-1200w.webp", alt: "Illustrative Two-sided fictional ceramics studio card pair at a restrained reception counter", width: 1200, height: 900 },
    { src: "/images/products/gallery/business-cards/business-cards-material-detail-v1-1200w.webp", alt: "Illustrative Macro on smooth gloss card faces with restrained reflection and thin stacked edges", width: 1200, height: 900 },
  ],
  "candle-jar-labels": [
    { src: "/images/products/product/candle-jar-labels-product-800x600.webp", alt: "Original Candle & Jar Labels product image.", width: 1448, height: 1086 },
    { src: "/images/products/gallery/candle-jar-labels/candle-jar-labels-alternate-design-v1-1200w.webp", alt: "Illustrative Botanical green marmalade jar label as materially different application", width: 1200, height: 900 },
    { src: "/images/products/gallery/candle-jar-labels/candle-jar-labels-application-v1-1200w.webp", alt: "Illustrative Unlit candle collection on warm wood boutique display", width: 1200, height: 900 },
    { src: "/images/products/gallery/candle-jar-labels/candle-jar-labels-material-detail-v1-1200w.webp", alt: "Illustrative Gloss labelled curved jar edge, no wrinkle or metallic foil", width: 1200, height: 900 },
    { src: "/images/products/gallery/candle-jar-labels/candle-jar-labels-overview-v1-1200w.webp", alt: "Illustrative Unlit fictional candle jar and tin with distinctive printed label artwork", width: 1200, height: 900 },
  ],
  "coil-bound-booklets": [
    { src: "/images/products/product/coil-bound-booklet-hero-800x600.webp", alt: "Original Coil-Bound Booklets product image.", width: 800, height: 600 },
    { src: "/images/products/gallery/coil-bound-booklets/coil-bound-booklets-alternate-design-v1-1200w.webp", alt: "Illustrative Lilac and charcoal original workshop manual alternate cover, same physical binding", width: 1200, height: 900 },
    { src: "/images/products/gallery/coil-bound-booklets/coil-bound-booklets-application-v1-1200w.webp", alt: "Illustrative Open booklet lying flat on indoor training desk, continuous plastic coil and full-colour spread", width: 1200, height: 900 },
    { src: "/images/products/gallery/coil-bound-booklets/coil-bound-booklets-material-detail-v1-1200w.webp", alt: "Illustrative Close black plastic helical coil threading evenly spaced holes through gloss cover/pages", width: 1200, height: 900 },
  ],
  "cosmetic-labels": [
    { src: "/images/products/product/cosmetic-labels-product-800x600.webp", alt: "Original Cosmetic Labels product image.", width: 1448, height: 1086 },
    { src: "/images/products/gallery/cosmetic-labels/cosmetic-labels-alternate-design-v1-1200w.webp", alt: "Illustrative Violet and apricot expressive hair-care label on smooth cylindrical bottle", width: 1200, height: 900 },
    { src: "/images/products/gallery/cosmetic-labels/cosmetic-labels-application-v1-1200w.webp", alt: "Illustrative Bathroom vanity application scene with two labelled skincare products", width: 1200, height: 900 },
    { src: "/images/products/gallery/cosmetic-labels/cosmetic-labels-material-detail-v1-1200w.webp", alt: "Illustrative Gloss laminated label on smooth amber glass under angled soft light", width: 1200, height: 900 },
  ],
  "custom-logo-design": [
    { src: "/images/products/product/logo-vectorization-sign-application-800x600.webp", alt: "Original Logo Design & Print-Ready Artwork product image.", width: 1448, height: 1086 },
    { src: "/images/products/gallery/custom-logo-design/custom-logo-design-alternate-design-v1-1200w.webp", alt: "Illustrative Bold red/black fictional repair studio identity, different visual language", width: 1200, height: 900 },
    { src: "/images/products/gallery/custom-logo-design/custom-logo-design-application-v1-1200w.webp", alt: "Illustrative Same fictional identity on business card and small packaging label, each material credible", width: 1200, height: 900 },
    { src: "/images/products/gallery/custom-logo-design/custom-logo-design-material-detail-v1-1200w.webp", alt: "Illustrative Original logo vector curves, colour chips and layout detail with generous space", width: 1200, height: 900 },
    { src: "/images/products/gallery/custom-logo-design/custom-logo-design-overview-v1-1200w.webp", alt: "Illustrative Fictional new botanical studio identity presented as expressive sketch-to-mark composition", width: 1200, height: 900 },
  ],
  "custom-shape-signs": [
    { src: "/images/products/product/coroplast-diecut-sasknation-key-800x600.webp", alt: "Original Custom-Shape Signs product image.", width: 800, height: 600 },
    { src: "/images/products/gallery/custom-shape-signs/custom-shape-signs-alternate-design-v1-1200w.webp", alt: "Illustrative Forest-green leaf-shaped ACP concept, thin dark core/aluminum skins; quote/material confirmation before release", width: 1200, height: 900 },
    { src: "/images/products/gallery/custom-shape-signs/custom-shape-signs-application-v1-1200w.webp", alt: "Illustrative Fictional outdoor frozen-treat counter with securely supported shaped sign", width: 1200, height: 900 },
    { src: "/images/products/gallery/custom-shape-signs/custom-shape-signs-material-detail-v1-1200w.webp", alt: "Illustrative Visible coroplast cut-edge flutes following broad manageable contour", width: 1200, height: 900 },
  ],
  "door-hangers": [
    { src: "/images/products/product/brochure-flat-trifold-800x600.webp", alt: "Original Door Hangers product image.", width: 800, height: 600 },
    { src: "/images/products/gallery/door-hangers/door-hangers-alternate-design-v1-1200w.webp", alt: "Illustrative Mint and cream pet-care alternate door-hanger artwork, clearly labelled concept outside image", width: 1200, height: 900 },
    { src: "/images/products/gallery/door-hangers/door-hangers-application-v1-1200w.webp", alt: "Illustrative Conceptual hanger naturally suspended from ordinary door knob through opening", width: 1200, height: 900 },
    { src: "/images/products/gallery/door-hangers/door-hangers-material-detail-v1-1200w.webp", alt: "Illustrative Top hole and slit detail in thin gloss stock, no impossible unbroken attachment", width: 1200, height: 900 },
  ],
  "flyers": [
    { src: "/images/products/product/flyers-stack-800x600.webp", alt: "Original Flyers product image.", width: 1536, height: 1024 },
    { src: "/images/products/gallery/flyers/flyers-alternate-design-v1-1200w.webp", alt: "Illustrative High-energy acid-yellow/black cycling event flyer with different imagery and hierarchy", width: 1200, height: 900 },
    { src: "/images/products/gallery/flyers/flyers-application-v1-1200w.webp", alt: "Illustrative Fictional community art class flyer on a cafe information counter", width: 1200, height: 900 },
    { src: "/images/products/gallery/flyers/flyers-material-detail-v1-1200w.webp", alt: "Illustrative Lifted corner and thin gloss paper edge with controlled highlight", width: 1200, height: 900 },
  ],
  "foamboard-displays": [
    { src: "/images/products/product/foamboard-display-800x600.webp", alt: "Original Foamboard Displays product image.", width: 1536, height: 1024 },
    { src: "/images/products/gallery/foamboard-displays/foamboard-displays-alternate-design-v1-1200w.webp", alt: "Illustrative Burnt-orange gallery event display leaning safely on indoor shelf", width: 1200, height: 900 },
    { src: "/images/products/gallery/foamboard-displays/foamboard-displays-application-v1-1200w.webp", alt: "Illustrative Conference reception easel display in a calm sunlit indoor foyer", width: 1200, height: 900 },
    { src: "/images/products/gallery/foamboard-displays/foamboard-displays-material-detail-v1-1200w.webp", alt: "Illustrative Close clean white 5mm board edge and printed face without magnifying unverified core", width: 1200, height: 900 },
    { src: "/images/products/gallery/foamboard-displays/foamboard-displays-overview-v1-1200w.webp", alt: "Illustrative Indoor fictional botanical exhibition display on easel, full panel shown", width: 1200, height: 900 },
  ],
  "freezer-labels": [
    { src: "/images/products/product/freezer-labels-product-800x600.webp", alt: "Original Freezer Labels product image.", width: 1448, height: 1086 },
    { src: "/images/products/gallery/freezer-labels/freezer-labels-alternate-design-v1-1200w.webp", alt: "Illustrative Ochre/cream bakery dough label on a smooth freezer-safe tub", width: 1200, height: 900 },
    { src: "/images/products/gallery/freezer-labels/freezer-labels-application-v1-1200w.webp", alt: "Illustrative Freezer Labels application sample.", width: 1200, height: 900 },
    { src: "/images/products/gallery/freezer-labels/freezer-labels-material-detail-v1-1200w.webp", alt: "Illustrative Dry labelled container before freezing; smooth firmly attached label corners", width: 1200, height: 900 },
    { src: "/images/products/gallery/freezer-labels/freezer-labels-overview-v1-1200w.webp", alt: "Illustrative Fictional meal-prep container with clean flat gloss label on lid", width: 1200, height: 900 },
  ],
  "image-upscale": [
    { src: "/images/products/product/image-upscale-product-800x600.webp", alt: "Original Image Upscale & Enhancement product image.", width: 1448, height: 1086 },
    { src: "/images/products/gallery/image-upscale/image-upscale-alternate-design-v1-1200w.webp", alt: "Illustrative Original food still-life enhancement workspace, no fabricated recovered texture", width: 1200, height: 900 },
    { src: "/images/products/gallery/image-upscale/image-upscale-application-v1-1200w.webp", alt: "Illustrative Print-size preview of same original landscape image on a matte poster mockup", width: 1200, height: 900 },
    { src: "/images/products/gallery/image-upscale/image-upscale-material-detail-v1-1200w.webp", alt: "Illustrative Matching region shown at equal magnification; produce comparison from same source, never two invented scenes", width: 1200, height: 900 },
  ],
  "logo-vectorization": [
    { src: "/images/products/product/logo-vectorization-product-800x600.webp", alt: "Original Logo Vectorization product image.", width: 1448, height: 1086 },
    { src: "/images/products/gallery/logo-vectorization/logo-vectorization-alternate-design-v1-1200w.webp", alt: "Illustrative Alternate original geometric flower mark; before/after derived from same source needed for honest comparison", width: 1200, height: 900 },
    { src: "/images/products/gallery/logo-vectorization/logo-vectorization-application-v1-1200w.webp", alt: "Illustrative Fictional mark consistently applied to card and sign design mockups", width: 1200, height: 900 },
    { src: "/images/products/gallery/logo-vectorization/logo-vectorization-material-detail-v1-1200w.webp", alt: "Illustrative Logo Vectorization material detail sample.", width: 1200, height: 900 },
    { src: "/images/products/gallery/logo-vectorization/logo-vectorization-overview-v1-1200w.webp", alt: "Illustrative Original fictional geometric bird mark in a design workspace, crisp vector result on card", width: 1200, height: 900 },
  ],
  "magnet-calendars": [
    { src: "/images/products/product/magnet-calendars-800x600.webp", alt: "Original Magnet Calendars product image.", width: 800, height: 600 },
    { src: "/images/products/gallery/magnet-calendars/magnet-calendars-alternate-design-v1-1200w.webp", alt: "Illustrative Forest-green gardening season planner magnet with visual blocks; final dates deferred", width: 1200, height: 900 },
    { src: "/images/products/gallery/magnet-calendars/magnet-calendars-application-v1-1200w.webp", alt: "Illustrative Magnet schedule on clean steel office cabinet; surrounding negative space", width: 1200, height: 900 },
    { src: "/images/products/gallery/magnet-calendars/magnet-calendars-material-detail-v1-1200w.webp", alt: "Illustrative Flexible thin magnetic back edge and smooth gloss printed face", width: 1200, height: 900 },
  ],
  "photo-posters": [
    { src: "/images/products/product/photo-posters-800x600.webp", alt: "Original Photo Posters product image.", width: 800, height: 600 },
    { src: "/images/products/gallery/photo-posters/photo-posters-alternate-design-v1-1200w.webp", alt: "Illustrative Large graphic botanical photography poster with emerald palette; original imagery", width: 1200, height: 900 },
    { src: "/images/products/gallery/photo-posters/photo-posters-application-v1-1200w.webp", alt: "Illustrative Original landscape print in optional illustrative frame on quiet indoor wall", width: 1200, height: 900 },
    { src: "/images/products/gallery/photo-posters/photo-posters-material-detail-v1-1200w.webp", alt: "Illustrative Close matte poster surface and thin gently curled edge, no glass or canvas texture", width: 1200, height: 900 },
  ],
  "product-labels": [
    { src: "/images/products/product/product-labels-product-800x600.webp", alt: "Original Product Labels product image.", width: 1448, height: 1086 },
    { src: "/images/products/gallery/product-labels/product-labels-alternate-design-v1-1200w.webp", alt: "Illustrative Indigo and cream botanical tea packaging label on smooth tin", width: 1200, height: 900 },
    { src: "/images/products/gallery/product-labels/product-labels-application-v1-1200w.webp", alt: "Illustrative Small producer packing desk with neatly labelled jars and sparse props", width: 1200, height: 900 },
    { src: "/images/products/gallery/product-labels/product-labels-material-detail-v1-1200w.webp", alt: "Illustrative Gloss label edge conforming smoothly to cylindrical jar, no paper fibres", width: 1200, height: 900 },
    { src: "/images/products/gallery/product-labels/product-labels-overview-v1-1200w.webp", alt: "Illustrative Fictional tomato preserve labels on jars plus one loose label, clear product-first composition", width: 1200, height: 900 },
  ],
  "rack-cards": [
    { src: "/images/products/product/brochure-flat-trifold-800x600.webp", alt: "Original Rack Cards product image.", width: 800, height: 600 },
    { src: "/images/products/gallery/rack-cards/rack-cards-alternate-design-v1-1200w.webp", alt: "Illustrative Burgundy/cream restaurant tasting-event rack card with different visual hierarchy", width: 1200, height: 900 },
    { src: "/images/products/gallery/rack-cards/rack-cards-application-v1-1200w.webp", alt: "Illustrative 4x9in cards in matching acrylic lobby rack, image unobstructed", width: 1200, height: 900 },
    { src: "/images/products/gallery/rack-cards/rack-cards-material-detail-v1-1200w.webp", alt: "Illustrative Close thin gloss rack-card corners in a modest stack", width: 1200, height: 900 },
    { src: "/images/products/gallery/rack-cards/rack-cards-overview-v1-1200w.webp", alt: "Illustrative Tall narrow fictional walking-tour rack cards with full trim shown", width: 1200, height: 900 },
  ],
  "roll-labels": [
    { src: "/images/products/product/roll-labels-product-800x600.webp", alt: "Original Roll Labels product image.", width: 1448, height: 1086 },
    { src: "/images/products/gallery/roll-labels/roll-labels-alternate-design-v1-1200w.webp", alt: "Illustrative Alternate plum/cream bulk label artwork as flat sheets; actual roll reference held pending specification", width: 1200, height: 900 },
    { src: "/images/products/gallery/roll-labels/roll-labels-application-v1-1200w.webp", alt: "Illustrative Small producer manually applying sheet-supplied labels to smooth containers", width: 1200, height: 900 },
    { src: "/images/products/gallery/roll-labels/roll-labels-material-detail-v1-1200w.webp", alt: "Illustrative Close one die-cut label peeling from flat release sheet, consistent repeated artwork", width: 1200, height: 900 },
    { src: "/images/products/gallery/roll-labels/roll-labels-overview-v1-1200w.webp", alt: "Illustrative Orderly sheets of repeated original fictional pantry labels, broad clear margins", width: 1200, height: 900 },
  ],
  "stickers": [
    { src: "/images/products/product/stickers-800x600.webp", alt: "Original Vinyl Stickers product image.", width: 800, height: 600 },
    { src: "/images/products/gallery/stickers/stickers-application-v1-1200w.webp", alt: "Illustrative Fictional juice-studio sticker neatly adhered to a smooth reusable bottle", width: 1200, height: 900 },
    { src: "/images/products/gallery/stickers/stickers-material-detail-v1-1200w.webp", alt: "Illustrative Macro on a square vinyl sticker edge and backing, no thick card", width: 1200, height: 900 },
  ],
  "vehicle-magnets": [
    { src: "/images/products/product/vehicle-magnets-800x600.webp", alt: "Original Vehicle Magnets product image.", width: 1536, height: 1024 },
    { src: "/images/products/gallery/vehicle-magnets/vehicle-magnets-alternate-design-v1-1200w.webp", alt: "Illustrative Orange/black locksmith identity on magnet on flat steel work truck door", width: 1200, height: 900 },
    { src: "/images/products/gallery/vehicle-magnets/vehicle-magnets-application-v1-1200w.webp", alt: "Illustrative Rectangular fictional landscape contractor magnet fully contacting flat white steel van door", width: 1200, height: 900 },
    { src: "/images/products/gallery/vehicle-magnets/vehicle-magnets-material-detail-v1-1200w.webp", alt: "Illustrative Separate gently curved magnet showing dark magnetic back; no adhesive liner", width: 1200, height: 900 },
    { src: "/images/products/gallery/vehicle-magnets/vehicle-magnets-overview-inherited-v1-1200w.webp", alt: "Illustrative Preserve accepted removable vehicle magnet concept", width: 1200, height: 800 },
  ],
  "vinyl-banners": [
    { src: "/images/products/product/banner-vinyl-colorful-800x600.webp", alt: "Original Vinyl Banners product image.", width: 1536, height: 1024 },
    { src: "/images/products/gallery/vinyl-banners/vinyl-banners-alternate-design-v1-1200w.webp", alt: "Illustrative A bold burnt-orange local music event layout, broad typography and graphic rhythm", width: 1200, height: 900 },
    { src: "/images/products/gallery/vinyl-banners/vinyl-banners-application-v1-1200w.webp", alt: "Illustrative Horizontal fictional pottery market banner secured evenly on a courtyard fence", width: 1200, height: 900 },
    { src: "/images/products/gallery/vinyl-banners/vinyl-banners-overview-inherited-v1-1200w.webp", alt: "Illustrative Preserve accepted colourful horizontal banner concept", width: 1200, height: 800 },
  ],
  "vinyl-lettering": [
    { src: "/images/products/product/vinyl-lettering-800x600.webp", alt: "Original Vinyl Lettering product image.", width: 800, height: 600 },
    { src: "/images/products/gallery/vinyl-lettering/vinyl-lettering-alternate-design-v1-1200w.webp", alt: "Illustrative Red cut geometric lettering on clear shop window, restrained alternate composition", width: 1200, height: 900 },
    { src: "/images/products/gallery/vinyl-lettering/vinyl-lettering-application-v1-1200w.webp", alt: "Illustrative Black vinyl unit-name lettering on flat light-painted metal door", width: 1200, height: 900 },
    { src: "/images/products/gallery/vinyl-lettering/vinyl-lettering-material-detail-v1-1200w.webp", alt: "Illustrative Transfer tape lifted away from single-colour letter edges; no floating or printed backing", width: 1200, height: 900 },
    { src: "/images/products/gallery/vinyl-lettering/vinyl-lettering-overview-v1-1200w.webp", alt: "Illustrative Fictional studio hours and simple white cut wordmark on glass", width: 1200, height: 900 },
  ],
  "window-perf": [
    { src: "/images/products/product/perf-vinyl-interior-seethrough-800x600.webp", alt: "Original Perforated Window Vinyl product image.", width: 800, height: 600 },
    { src: "/images/products/gallery/window-perf/window-perf-alternate-design-v1-1200w.webp", alt: "Illustrative Fresh green produce-shop graphic on one panel of storefront glass", width: 1200, height: 900 },
    { src: "/images/products/gallery/window-perf/window-perf-application-v1-1200w.webp", alt: "Illustrative Inside view through same perforated storefront panel, daylight outside, screen-like visibility", width: 1200, height: 900 },
    { src: "/images/products/gallery/window-perf/window-perf-material-detail-v1-1200w.webp", alt: "Illustrative Macro of physically regular real perforation holes interrupting the printed ink", width: 1200, height: 900 },
    { src: "/images/products/gallery/window-perf/window-perf-overview-v1-1200w.webp", alt: "Illustrative Fictional fitness-studio perforated glass graphic viewed from street", width: 1200, height: 900 },
  ],
};

export function getProductDisplayGallery(slug: string): readonly ProductDisplayImage[] | undefined {
  switch (slug) {
    case "coroplast-signs": return COROPLAST_DISPLAY_GALLERY;
    case "postcards": return POSTCARDS_DISPLAY_GALLERY;
    case "retractable-banners": return RETRACTABLE_DISPLAY_GALLERY;
    case "window-decals": return WINDOW_DECALS_DISPLAY_GALLERY;
    case "brochures": return BROCHURES_DISPLAY_GALLERY;
    default: return Object.hasOwn(FULL_NOINDEX_DISPLAY_GALLERIES, slug) ? FULL_NOINDEX_DISPLAY_GALLERIES[slug] : undefined;
  }
}
