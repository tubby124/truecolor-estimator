// Static product content for /products/[slug] pages
// Material specs sourced from Spicer supplier PDFs in docs/suppliers/spicer/product-specs/
// Pricing specs from data/tables/pricing_rules.v1.csv

export interface SizePreset {
  label: string;
  width_in: number;
  height_in: number;
}

export interface ProductContent {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  fromPrice: string;
  category: string;
  material_code?: string;
  heroImage: string;
  galleryImages: string[];
  defaultSides: 1 | 2;
  sideOptions: boolean; // show single/double toggle
  sizePresets: SizePreset[];
  qtyPresets: number[];
  specs: { label: string; value: string }[];
  whoUsesThis: string[];
  faqs: { q: string; a: string }[];
  relatedSlugs: string[];
  addons?: { label: string; unitPrice: number; step?: number; engineCode?: string; tip?: string }[];
  materialInfo?: { headline: string; bullets: string[] };
  tierPresets?: { label: string; material_code: string; price: number }[];
}

export const PRODUCTS: Record<string, ProductContent> = {
  "coroplast-signs": {
    slug: "coroplast-signs",
    name: "Coroplast Signs",
    tagline: "Durable yard signs that survive Saskatchewan winters.",
    description:
      "Coroplast is a 4mm corrugated polypropylene board — lightweight, fully waterproof, and UV-resistant. Perfect for job sites, real estate listings, directional signs, and event displays. It holds up year-round in Saskatchewan weather and typically lasts 2–3 years outdoors.",
    fromPrice: "$30",
    category: "SIGN",
    material_code: "MPHCC020",
    heroImage: "/images/products/product/coroplast-yard-sign-800x600.webp",
    galleryImages: [
      "/images/products/product/coroplast-yard-sign-800x600.webp",
      "/images/products/product/coroplast-job-site-800x600.webp",
      "/images/gallery/gallery-coroplast-realtor-keyshape.jpg",
    ],
    defaultSides: 1,
    sideOptions: true,
    sizePresets: [
      { label: "12×18\"", width_in: 12, height_in: 18 },
      { label: "18×24\"", width_in: 18, height_in: 24 },
      { label: "24×36\"", width_in: 24, height_in: 36 },
      { label: "4×8 ft", width_in: 48, height_in: 96 },
    ],
    qtyPresets: [1, 5, 10, 25],
    specs: [
      { label: "Material", value: "4mm corrugated polypropylene (Coroplast)" },
      { label: "Print", value: "Full-colour digital UV-resistant ink" },
      { label: "Standard sizes", value: "12×18\", 18×24\", 24×36\", 4×8 ft — custom available" },
      { label: "Sides", value: "Single or double-sided" },
      { label: "Weather resistance", value: "Waterproof, UV-resistant, rated for outdoor use" },
      { label: "Lifespan", value: "2–3 years in direct sun / Saskatchewan winters" },
      { label: "Add-ons", value: "H-stakes (+$2.50 ea), grommets (+$2.50 ea)" },
    ],
    whoUsesThis: ["Construction", "Real Estate", "Events", "Retail", "Agriculture"],
    faqs: [
      {
        q: "How long do coroplast signs last outdoors in Saskatchewan?",
        a: "Typically 2–3 years in direct sun and through prairie winters. The UV-resistant ink prevents fading, and the polypropylene substrate won't rot, rust, or absorb water.",
      },
      {
        q: "Can I get double-sided signs?",
        a: "Yes — double-sided adds approximately 50% to the price. Both sides are printed and bonded back-to-back.",
      },
      {
        q: "Do you offer H-stakes for yard installation?",
        a: "Yes — wire H-stakes are $2.50 each and slide into the bottom flutes of the sign. Select them as an add-on when ordering.",
      },
      {
        q: "What file format do I need to provide?",
        a: "PDF (preferred), PNG at 150+ DPI, or AI. No file? Our in-house designer handles artwork prep, upscaling, and layout from a rough sketch — starting at $35.",
      },
    ],
    relatedSlugs: ["vehicle-magnets", "vinyl-banners", "acp-signs"],
    addons: [
      { label: "H-Stakes", unitPrice: 2.50, step: 1, engineCode: "H_STAKE", tip: "Wire H-stakes slide into the bottom flutes for yard or ground installation." },
      { label: "Grommets", unitPrice: 2.50, step: 2, engineCode: "GROMMETS", tip: "For hanging or wall-mounting. Count auto-calculated from your sign size every 2 ft." },
    ],
    materialInfo: {
      headline: "4mm corrugated polypropylene — weatherproof, lightweight",
      bullets: [
        "Holds up to -40°C Saskatchewan winters",
        "UV-resistant ink — no fading for 2+ years outdoors",
        "Recyclable — drop-off at most SK recycling centres",
        "Flutes run vertically — H-stakes slide right in",
      ],
    },
  },

  "vinyl-banners": {
    slug: "vinyl-banners",
    name: "Vinyl Banners",
    tagline: "13oz vinyl for events, storefronts, and trade shows.",
    description:
      "Printed on 13oz scrim vinyl — a woven polyester mesh laminated with PVC for superior tear resistance and vibrant colour. Hemmed edges standard. Grommets optional (+$2.50 each). Suitable for indoor and outdoor use. Any size, any quantity.",
    fromPrice: "$45",
    category: "BANNER",
    material_code: "RMBF004",
    heroImage: "/images/products/product/banner-vinyl-colorful-800x600.webp",
    galleryImages: [
      "/images/products/product/banner-vinyl-colorful-800x600.webp",
      "/images/gallery/gallery-outdoor-banner-best-donairs.webp",
      "/images/gallery/gallery-vinyl-banner-windshield-masters.webp",
    ],
    defaultSides: 1,
    sideOptions: false,
    sizePresets: [
      { label: "2×4 ft", width_in: 24, height_in: 48 },
      { label: "2×6 ft", width_in: 24, height_in: 72 },
      { label: "3×6 ft", width_in: 36, height_in: 72 },
      { label: "4×8 ft", width_in: 48, height_in: 96 },
    ],
    qtyPresets: [1, 2, 5, 10],
    specs: [
      { label: "Material", value: "13oz scrim vinyl (woven polyester + PVC laminate)" },
      { label: "Print", value: "Full-colour digital, vibrant outdoor inks" },
      { label: "Finish", value: "Hemmed edges standard — grommets optional (+$2.50 each)" },
      { label: "Standard sizes", value: "2×4, 2×6, 3×6, 4×8 ft — any custom size available" },
      { label: "Weather resistance", value: "Outdoor rated, wind-resistant with hemmed edges" },
      { label: "Sides", value: "Single-sided (double-sided available on request)" },
    ],
    whoUsesThis: ["Events", "Retail", "Construction", "Sports", "Real Estate"],
    faqs: [
      {
        q: "Are grommets included?",
        a: "Hemmed edges are included standard. Grommets are optional — add them to your order for $2.50 each. Count is auto-calculated from your banner size (every 2 ft along the perimeter).",
      },
      {
        q: "Can I get a banner wider than 4 feet?",
        a: "Yes — we can print any custom size. Select 'Custom' when ordering and enter your exact dimensions.",
      },
      {
        q: "How do I hang a vinyl banner outdoors?",
        a: "Use bungee cords or zip ties through the grommets. For high-wind locations, consider requesting a wind-slit or pole-pocket finish.",
      },
      {
        q: "How long does a vinyl banner last outdoors?",
        a: "With proper hanging (not too taut, allows some wind movement), 13oz vinyl banners last 1–3 years outdoors.",
      },
    ],
    addons: [
      { label: "Grommets", unitPrice: 2.50, step: 2, engineCode: "GROMMETS", tip: "Count auto-calculated from your banner size — every 2 ft along the perimeter." },
    ],
    relatedSlugs: ["retractable-banners", "coroplast-signs", "acp-signs"],
    materialInfo: {
      headline: "13oz scrim vinyl — tear-resistant, outdoor-rated",
      bullets: [
        "Woven polyester mesh + PVC laminate — won't tear in wind",
        "Vibrant outdoor inks, 1–3 year outdoor lifespan",
        "Hemmed edges included — grommets optional at $2.50 each",
        "Any custom size — min charge $45",
      ],
    },
  },

  "vehicle-magnets": {
    slug: "vehicle-magnets",
    name: "Vehicle Magnets",
    tagline: "30mil magnets for any vehicle. Remove in seconds.",
    description:
      "Made from 30mil flexible magnetic sheeting — thick enough to stay put on the highway, flexible enough to remove and store flat. Full-colour print on white gloss surface. Suitable for all steel vehicles. Your business is on wheels.",
    fromPrice: "$45",
    category: "MAGNET",
    material_code: "MAG302437550M",
    heroImage: "/images/products/product/vehicle-magnets-800x600.webp",
    galleryImages: [
      "/images/products/product/vehicle-magnets-800x600.webp",
      "/images/gallery/gallery-vehicle-decal-windshield-masters.webp",
    ],
    defaultSides: 1,
    sideOptions: false,
    sizePresets: [
      { label: "8×12\"", width_in: 8, height_in: 12 },
      { label: "12×18\"", width_in: 12, height_in: 18 },
      { label: "18×24\"", width_in: 18, height_in: 24 },
      { label: "24×36\"", width_in: 24, height_in: 36 },
    ],
    qtyPresets: [1, 2, 4, 5, 10],
    specs: [
      { label: "Material", value: "30mil flexible magnetic sheeting" },
      { label: "Print surface", value: "White gloss vinyl laminate — full colour" },
      { label: "Standard sizes", value: "8×12\", 12×18\", 18×24\", 24×36\" — custom available" },
      { label: "Vehicles", value: "Works on any steel vehicle door, hood, or roof" },
      { label: "Care", value: "Remove and store flat when not in use to prevent warping" },
    ],
    whoUsesThis: ["Construction", "Real Estate", "Agriculture", "Trades", "Delivery"],
    faqs: [
      {
        q: "Will the magnet damage my vehicle's paint?",
        a: "No — 30mil magnets are safe for all factory paint finishes. Remove them regularly (at least weekly) and clean both the magnet and vehicle surface to prevent debris buildup underneath.",
      },
      {
        q: "Will they stay on at highway speeds?",
        a: "Yes — 30mil is the industry standard for vehicle magnets and stays secure at highway speeds. Ensure the vehicle surface is clean and dry when applying.",
      },
      {
        q: "Can I order just one magnet?",
        a: "Yes — minimum order is 1 magnet. Most customers order in pairs (driver and passenger doors).",
      },
      {
        q: "Do they work on aluminum vehicles?",
        a: "No — magnets only adhere to steel. Many newer trucks and vans have aluminum doors. Check your vehicle specs or test with a fridge magnet first.",
      },
    ],
    relatedSlugs: ["coroplast-signs", "vinyl-banners", "acp-signs"],
  },

  "business-cards": {
    slug: "business-cards",
    name: "Business Cards",
    tagline: "250 cards on 14pt gloss stock. $40.",
    description:
      "Printed on 14pt gloss card stock — the industry standard for professional business cards. Crisp colour, smooth matte or gloss finish, sharp edges. 250 cards is the standard run; we also offer 500 and 1000.",
    fromPrice: "$40",
    category: "BUSINESS_CARD",
    material_code: "PLACEHOLDER_14PT",
    heroImage: "/images/products/product/business-cards-800x600.webp",
    galleryImages: [
      "/images/products/product/business-cards-800x600.webp",
    ],
    defaultSides: 2,
    sideOptions: true,
    sizePresets: [
      { label: "3.5×2\"", width_in: 3.5, height_in: 2 },
    ],
    qtyPresets: [250, 500, 1000],
    specs: [
      { label: "Paper", value: "14pt gloss card stock" },
      { label: "Print", value: "Full-colour digital (Konica Minolta press)" },
      { label: "Size", value: "Standard 3.5×2\" (business card size)" },
      { label: "Sides", value: "Single ($40/250) or double-sided ($45/250)" },
      { label: "Turnaround", value: "Same day or next morning (standard 1–3 business days)" },
    ],
    whoUsesThis: ["Healthcare", "Real Estate", "Construction", "Retail", "Trades", "Events"],
    faqs: [
      {
        q: "What's the difference between single and double-sided?",
        a: "Single-sided has print on the front only — the back is blank white. Double-sided prints both sides — great for adding your services, tagline, or map on the back.",
      },
      {
        q: "Can I get more than 250 cards?",
        a: "Yes — 500 cards and 1000 cards are available. Price per card drops significantly with higher quantities.",
      },
      {
        q: "Do you design business cards?",
        a: "Yes — our in-house designer can create a layout from scratch (+$50) or make minor adjustments to your existing design (+$35). Just bring your logo and any content you want on the card.",
      },
      {
        q: "What file format should I provide?",
        a: "PDF or AI at exact business card size (3.5×2\") with 1/8\" bleed on all sides. Not sure? We'll guide you through it or design it for you.",
      },
    ],
    relatedSlugs: ["flyers", "coroplast-signs", "vehicle-magnets"],
  },

  "flyers": {
    slug: "flyers",
    name: "Flyers & Brochures",
    tagline: "100 flyers on 80lb gloss from $45.",
    description:
      "Printed on Pacesetter 80lb gloss text stock — bright white, FSC-certified, sharp colour reproduction. Perfect for mass distribution, door-to-door campaigns, event handouts, and in-store promotions. Any quantity, both sides available.",
    fromPrice: "$45",
    category: "FLYER",
    material_code: "PLACEHOLDER_80LB",
    heroImage: "/images/products/product/flyers-stack-800x600.webp",
    galleryImages: [
      "/images/products/product/flyers-stack-800x600.webp",
    ],
    defaultSides: 2,
    sideOptions: true,
    sizePresets: [
      { label: "Letter (100)", width_in: 8.5, height_in: 11 },
    ],
    qtyPresets: [100, 250, 500, 1000],
    specs: [
      { label: "Paper", value: "Pacesetter 80lb gloss text (FSC-certified)" },
      { label: "Print", value: "Full-colour digital (Konica Minolta press)" },
      { label: "Size", value: "Letter (8.5×11\") — other sizes available" },
      { label: "Sides", value: "Single or double-sided" },
      { label: "Also available", value: "100lb gloss text for heavier feel" },
    ],
    whoUsesThis: ["Retail", "Events", "Non-Profits", "Healthcare", "Sports", "Agriculture"],
    faqs: [
      {
        q: "What's the minimum quantity for flyers?",
        a: "100 flyers is the minimum. Price per flyer drops significantly at 250 and 500+.",
      },
      {
        q: "What's the difference between 80lb and 100lb paper?",
        a: "80lb gloss is standard — crisp print, good colour. 100lb is noticeably heavier and feels more premium. Add $20 for 100lb on a 250-flyer run.",
      },
      {
        q: "Can I get a different size than letter?",
        a: "Yes — half-letter (5.5×8.5\"), legal (8.5×14\"), and other sizes available. Ask us when ordering.",
      },
      {
        q: "Do you do door-to-door distribution?",
        a: "We print; we don't distribute. But we can print and have them ready for you to pick up same-day or next morning.",
      },
    ],
    relatedSlugs: ["business-cards", "coroplast-signs", "vinyl-banners"],
  },

  "acp-signs": {
    slug: "acp-signs",
    name: "Aluminum Composite Signs",
    tagline: "3mm aluminum composite. Built to last indoors or out.",
    description:
      "ACP (aluminum composite panel) consists of two thin aluminum sheets bonded to a polyethylene core — rigid, lightweight, and fully weather-resistant. Looks premium, lasts indefinitely. The choice for permanent outdoor signage, office directories, and retail displays.",
    fromPrice: "$60",
    category: "RIGID",
    material_code: "RMACP002",
    heroImage: "/images/products/product/acp-aluminum-sign-800x600.webp",
    galleryImages: [
      "/images/products/product/acp-aluminum-sign-800x600.webp",
    ],
    defaultSides: 1,
    sideOptions: true,
    sizePresets: [
      { label: "12×18\"", width_in: 12, height_in: 18 },
      { label: "18×24\"", width_in: 18, height_in: 24 },
      { label: "24×36\"", width_in: 24, height_in: 36 },
      { label: "4×8 ft", width_in: 48, height_in: 96 },
    ],
    qtyPresets: [1, 5, 10, 25],
    specs: [
      { label: "Material", value: "3mm aluminum composite panel (ACP) — 2 aluminum skins + PE core" },
      { label: "Print", value: "Full-colour UV-cured digital print" },
      { label: "Standard sizes", value: "12×18\", 18×24\", 24×36\", 4×8 ft — custom available" },
      { label: "Weather resistance", value: "Fully weatherproof, no warping, no rust — indefinite outdoor lifespan" },
      { label: "Mounting", value: "Drill and screw (holes drilled on request), or adhesive backing" },
      { label: "Finish", value: "Smooth gloss or matte laminate available" },
    ],
    whoUsesThis: ["Construction", "Retail", "Real Estate", "Healthcare", "Events"],
    faqs: [
      {
        q: "How does ACP compare to coroplast?",
        a: "ACP is significantly more rigid and durable — it won't flex or dent. Coroplast is lighter and cheaper for short-term use. ACP is the right choice for permanent or semi-permanent signage.",
      },
      {
        q: "Can ACP signs be mounted on a wall?",
        a: "Yes — we can drill mounting holes on request. For exterior mounting, use stainless steel standoffs or screws for a clean finished look.",
      },
      {
        q: "How long do ACP signs last?",
        a: "Indefinitely with proper installation. ACP doesn't rust, warp, or degrade from UV exposure under normal outdoor conditions.",
      },
      {
        q: "Can I get rounded corners or custom shapes?",
        a: "Rounded corners are available. Custom shapes require routing — ask for a quote.",
      },
    ],
    relatedSlugs: ["coroplast-signs", "vinyl-banners", "foamboard-displays"],
    materialInfo: {
      headline: "3mm aluminum composite panel — rigid, weatherproof, permanent",
      bullets: [
        "Two aluminum skins bonded to a polyethylene core",
        "Won't rust, warp, or degrade outdoors — indefinite lifespan",
        "UV-cured digital print — no fading",
        "Drill holes or adhesive mounting on request",
      ],
    },
  },

  "foamboard-displays": {
    slug: "foamboard-displays",
    name: "Foamboard Displays",
    tagline: "Lightweight indoor displays from $45.",
    description:
      "5mm PVC foamboard — rigid, smooth-faced, and ultra-lightweight. Ideal for counter displays, event signage, trade show backdrops, and retail point-of-purchase displays. Clean edges, sharp print, easy to transport and set up.",
    fromPrice: "$45",
    category: "FOAMBOARD",
    material_code: "GENERIC_FOAM",
    heroImage: "/images/products/product/foamboard-display-800x600.webp",
    galleryImages: [
      "/images/products/product/foamboard-display-800x600.webp",
    ],
    defaultSides: 1,
    sideOptions: false,
    sizePresets: [
      { label: "12×18\"", width_in: 12, height_in: 18 },
      { label: "18×24\"", width_in: 18, height_in: 24 },
      { label: "24×36\"", width_in: 24, height_in: 36 },
    ],
    qtyPresets: [1, 5, 10, 25],
    specs: [
      { label: "Material", value: "5mm PVC foamboard (Gilman InSite)" },
      { label: "Print", value: "Full-colour UV-resistant digital print" },
      { label: "Weight", value: "Very lightweight — ideal for transport and display" },
      { label: "Use", value: "Indoor only — not weatherproof" },
      { label: "Standard sizes", value: "12×18\", 18×24\", 24×36\" — custom available" },
    ],
    whoUsesThis: ["Retail", "Events", "Healthcare", "Non-Profits", "Trade Shows"],
    faqs: [
      {
        q: "Is foamboard suitable for outdoor use?",
        a: "No — foamboard is designed for indoor use only. For outdoor signage, choose coroplast or ACP instead.",
      },
      {
        q: "Can foamboard be mounted on a wall?",
        a: "Yes — foam mounting tape or small nails work well. Foamboard is too light for traditional screw mounting.",
      },
      {
        q: "What's the difference between foamboard and ACP?",
        a: "Foamboard is lighter and cheaper for indoor use. ACP is heavier, more rigid, and weatherproof — use it for outdoor or long-term displays.",
      },
    ],
    relatedSlugs: ["acp-signs", "retractable-banners", "vinyl-banners"],
  },

  "window-decals": {
    slug: "window-decals",
    name: "Window Decals",
    tagline: "Custom adhesive vinyl decals for windows and vehicles.",
    description:
      "Printed on premium adhesive vinyl — crisp colour, clean cut edges, easy to apply. Perfect for storefronts, vehicle windows, glass doors, and promotional surfaces. Removable without residue on most surfaces. Custom sizes and shapes available.",
    fromPrice: "$45",
    category: "DECAL",
    material_code: "ARLPMF7008",
    heroImage: "/images/gallery/gallery-window-decal-swiss-barber.webp",
    galleryImages: [
      "/images/gallery/gallery-window-decal-swiss-barber.webp",
    ],
    defaultSides: 1,
    sideOptions: false,
    sizePresets: [
      { label: "12×12\"", width_in: 12, height_in: 12 },
      { label: "12×24\"", width_in: 12, height_in: 24 },
      { label: "24×24\"", width_in: 24, height_in: 24 },
      { label: "24×36\"", width_in: 24, height_in: 36 },
    ],
    qtyPresets: [1, 2, 5, 10],
    specs: [
      { label: "Material", value: "Premium adhesive vinyl (matte or gloss)" },
      { label: "Print", value: "Full-colour digital, vibrant UV-resistant inks" },
      { label: "Adhesive", value: "Removable adhesive — no residue on glass" },
      { label: "Standard sizes", value: "12×12\", 12×24\", 24×24\", 24×36\" — custom available" },
      { label: "Application", value: "Windows, glass doors, vehicles, smooth surfaces" },
    ],
    whoUsesThis: ["Retail", "Construction", "Real Estate", "Events", "Healthcare"],
    faqs: [
      {
        q: "Will window decals damage my glass?",
        a: "No — adhesive vinyl uses a removable adhesive that peels off cleanly from glass without residue. Avoid applying to painted, textured, or porous surfaces.",
      },
      {
        q: "Can I put these on my vehicle windows?",
        a: "Yes — adhesive vinyl works on auto glass. For the outside of a vehicle, use standard adhesive. For the inside, specify reverse-print when ordering.",
      },
      {
        q: "How long do window decals last outdoors?",
        a: "UV-resistant inks give a 2–3 year outdoor lifespan on glass. Avoid pressure washing directly at the edges.",
      },
      {
        q: "What file format do I need?",
        a: "PDF (preferred), PNG at 150+ DPI, or AI. Need a design? Our in-house team handles it from a rough sketch — starting at $35.",
      },
    ],
    relatedSlugs: ["vehicle-magnets", "coroplast-signs", "vinyl-banners"],
  },

  "retractable-banners": {
    slug: "retractable-banners",
    name: "Retractable Banner Stands",
    tagline: "Economy, Deluxe, or Premium stand. Banner included.",
    description:
      "Choose from three tiers of retractable banner stands — Economy ($219), Deluxe ($299), or Premium ($349). All include a 33.5\" wide × 80\" tall full-colour printed banner. Rolls up into a compact base in seconds. Ideal for trade shows, conferences, retail, and events.",
    fromPrice: "from $219",
    category: "DISPLAY",
    material_code: "RBS33507875S",
    heroImage: "/images/products/product/retractable-stand-600x900.webp",
    galleryImages: [
      "/images/products/product/retractable-stand-600x900.webp",
      "/images/gallery/gallery-retractable-banner-financial-office.jpg",
      "/images/gallery/gallery-retractable-banner-client-office.jpg",
    ],
    defaultSides: 1,
    sideOptions: false,
    sizePresets: [
      { label: "33.5×80\"", width_in: 33.5, height_in: 80 },
    ],
    qtyPresets: [1, 2],
    specs: [
      { label: "Economy", value: "Aluminum stand, basic roll-up mechanism, carry bag — $219" },
      { label: "Deluxe", value: "Premium aluminum stand, tension mechanism, padded carry case — $299" },
      { label: "Premium", value: "Deluxe stand + expedited turnaround, professional print finish — $349" },
      { label: "Banner size", value: "33.5\" × 80\" (standard retractable size)" },
      { label: "Setup time", value: "Under 30 seconds" },
      { label: "Includes", value: "Stand + full-colour printed banner + carry bag/case" },
    ],
    whoUsesThis: ["Trade Shows", "Events", "Retail", "Healthcare", "Non-Profits"],
    faqs: [
      {
        q: "Does the stand come with the printed banner?",
        a: "Yes — the $219 price includes the stand, your custom printed banner, and a carry bag.",
      },
      {
        q: "Can I replace the banner on the stand later?",
        a: "Yes — if your branding changes, we can print a replacement banner that fits your existing stand.",
      },
      {
        q: "Is this the right stand for outdoor use?",
        a: "Retractable stands are primarily designed for indoor use. For outdoor events, a weighted base or banner stake set is more appropriate.",
      },
    ],
    relatedSlugs: ["vinyl-banners", "foamboard-displays", "coroplast-signs"],
    tierPresets: [
      { label: "Economy — $219", material_code: "RBS33507875S", price: 219 },
      { label: "Deluxe — $299", material_code: "RBS33507900PSB", price: 299 },
      { label: "Premium — $349", material_code: "RBS33507900PREM", price: 349 },
    ],
  },
};

export const PRODUCT_SLUGS = Object.keys(PRODUCTS);

export function getProduct(slug: string): ProductContent | undefined {
  return PRODUCTS[slug];
}
