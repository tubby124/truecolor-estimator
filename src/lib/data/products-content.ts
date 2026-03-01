// Static product content for /products/[slug] pages
// Material specs sourced from Spicer supplier PDFs in docs/suppliers/spicer/product-specs/
// Pricing specs from data/tables/pricing_rules.v1.csv

export interface SizePreset {
  label: string;
  width_in: number;
  height_in: number;
  material_code?: string;
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
  lotPriced?: boolean; // true = fixed lot tiers only; hides Custom qty button, shows "call for more"
}

export const PRODUCTS: Record<string, ProductContent> = {
  "coroplast-signs": {
    slug: "coroplast-signs",
    name: "Coroplast Signs",
    tagline: "Durable yard signs that survive Saskatchewan winters.",
    description:
      "Coroplast is 4mm corrugated polypropylene — think cardboard, but fully waterproof, UV-resistant, and built to survive Saskatchewan winters at -40°C. It's the most-ordered outdoor sign material at True Color because it hits the right balance: lightweight enough to install by hand, durable enough for 2–3 years of direct prairie sun. Real estate agents rely on 18×24\" coroplast for listing and open house signs. Contractors bolt 4×8 sheets to site hoardings. Election campaigns order 200+ at a time for lawn placement. Events use 12×18\" directional signs across venue grounds. The material prints beautifully — our Roland TrueVIS UV ink bonds directly to the polypropylene substrate for sharp text and vivid colour that won't peel or bubble. Single-sided is most common. Double-sided (both faces printed and bonded back-to-back) costs roughly 50% more and works well for directional signs visible from both approaches. Add wire H-stakes ($2.50 each) for ground installation or grommets ($2.50 each) for fence and wall mounting — both are available as add-ons in the estimator. True Color prints coroplast signs in-house at 216 33rd St W, Saskatoon. No outsourcing, no minimum quantity. Same-day rush available (+$40 flat) on most orders placed before 10 AM.",
    fromPrice: "$30",
    category: "SIGN",
    material_code: "MPHCC020",
    heroImage: "/images/products/product/coroplast-yard-sign-800x600.webp",
    galleryImages: [
      "/images/products/product/coroplast-yard-sign-800x600.webp",
      "/images/products/product/coroplast-job-site-800x600.webp",
      "/images/products/product/coroplast-fence-construction-800x600.webp",
      "/images/gallery/gallery-coroplast-realtor-keyshape.jpg",
      "/images/gallery/gallery-coroplast-remax-openhouse.jpg",
      "/images/gallery/gallery-coroplast-71st-storage.jpg",
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
      "13oz scrim vinyl is the industry standard for outdoor banners — and for good reason. The 'scrim' is a woven polyester mesh core laminated with PVC on both sides, giving the material its tear resistance. Pull a corner of 13oz vinyl in sustained prairie wind and it won't rip. True Color prints on this material with Roland UV outdoor inks that stay vivid through a full Saskatchewan season. Hemmed edges are included standard on every banner — a double-folded reinforced edge along the perimeter that prevents fraying and protects corners under tension. Add grommets at $2.50 each and hang with bungee cords or zip ties. Vinyl banners are the most versatile large-format print product we make. Storefronts use 3×6 ft banners for grand openings and seasonal sales. Construction sites post 4×8 ft banners on hoarding fences. Sports teams hang them in rinks and gyms for sponsor recognition. Trade show exhibitors use 2×4 ft table banners for booth backdrops. Order any custom size — enter exact dimensions in the estimator, no extra setup charge. Single-sided is standard; double-sided available on request. Outdoor lifespan is 1–3 years depending on sun exposure and wind. Same-day rush available on select sizes. Pickup at 216 33rd St W, Saskatoon.",
    fromPrice: "$66",
    category: "BANNER",
    material_code: "RMBF004",
    heroImage: "/images/products/product/banner-vinyl-colorful-800x600.webp",
    galleryImages: [
      "/images/products/product/banner-vinyl-colorful-800x600.webp",
      "/images/products/product/banner-13oz-1200x400.webp",
      "/images/gallery/gallery-outdoor-banner-best-donairs.webp",
      "/images/gallery/gallery-vinyl-banner-windshield-masters.webp",
      "/images/gallery/gallery-banner-habesha-convenience.jpg",
      "/images/gallery/gallery-banner-ericsson-5g.jpg",
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
        "Any custom size available — smallest preset 2×4 ft from $66",
      ],
    },
  },

  "vehicle-magnets": {
    slug: "vehicle-magnets",
    name: "Vehicle Magnets",
    tagline: "30mil magnets for any vehicle. Remove in seconds.",
    description:
      "30mil vehicle magnets are the smart choice for Saskatoon tradespeople, delivery drivers, and small business owners who want professional fleet branding without a permanent commitment. The '30mil' refers to the thickness of the magnetic sheeting — 30 thousandths of an inch, heavy enough to hold against highway winds on flat steel panels including truck doors, cargo van sides, and equipment hoods. Unlike vinyl wraps or adhesive decals, magnets lift off in seconds and leave zero residue. Protect your vehicle's resale value. Swap branding between trucks. Remove them on personal trips. True Color prints vehicle magnets on our Roland TrueVIS UV equipment — full-colour output that reads clearly at 30 feet. The print surface is white gloss vinyl laminate: sharp logos, vivid brand colours, UV-resistant so they won't fade through a Saskatchewan summer. Most popular size is 12×18\" for truck doors. Step up to 18×24\" for more visibility, or 24×36\" for cargo vans. Order as few as one magnet. Volume discounts kick in at 2 units (8% off) and 5 units (23% off) — popular with contractors branding an entire fleet. Same-day rush available for $40 flat. Pickup at 216 33rd St W, Saskatoon.",
    fromPrice: "$45",
    category: "MAGNET",
    material_code: "MAG302437550M",
    heroImage: "/images/products/product/vehicle-magnets-800x600.webp",
    galleryImages: [
      "/images/products/product/vehicle-magnets-800x600.webp",
      "/images/products/product/magnet-truck-construction-800x600.webp",
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
    relatedSlugs: ["coroplast-signs", "vinyl-banners", "acp-signs", "magnet-calendars", "window-decals"],
  },

  "business-cards": {
    slug: "business-cards",
    name: "Business Cards",
    tagline: "250 cards on 14pt gloss stock. $40.",
    description:
      "14pt gloss card stock is the benchmark for professional business cards in Canada — thick enough to feel substantial in hand, smooth enough for sharp full-colour printing on both sides. At True Color, business cards run on our Konica Minolta digital production press for precise colour matching and a consistent result across every card in the run. The standard 250-card run is $40 double-sided — front design plus a printed reverse, included in the same price since both faces run in one pass. The universal 3.5×2\" format fits every card holder, wallet slot, and Rolodex. Bring a design file (PDF, AI, or EPS preferred) and we'll prep it for print. No design yet? Our in-house designer creates business card layouts from scratch for $50, or updates your existing design for $35 — usually completed the same day. Quantities: 250, 500, or 1000 cards. The per-card cost drops meaningfully at 500 and 1000, so if you distribute them at networking events or on job sites, order up. Single-sided is also available for a leaner look. Business cards are ready for pickup at 216 33rd St W, Saskatoon in 1–3 business days, or next-day with same-day rush.",
    fromPrice: "$40",
    category: "BUSINESS_CARD",
    material_code: "PLACEHOLDER_14PT",
    heroImage: "/images/products/product/business-cards-800x600.webp",
    galleryImages: [
      "/images/products/product/business-cards-800x600.webp",
      "/images/gallery/gallery-business-cards-nofal-barber.jpg",
      "/images/gallery/gallery-business-cards-lilians-hair.jpg",
      "/images/gallery/gallery-business-cards-bd-deep-cleaning.jpg",
    ],
    defaultSides: 2,
    sideOptions: true,
    sizePresets: [
      { label: "3.5×2\"", width_in: 3.5, height_in: 2 },
    ],
    qtyPresets: [250, 500, 1000],
    lotPriced: true,
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
      "Printed on Pacesetter 80lb gloss text — a bright white, FSC-certified press sheet that produces sharp colour reproduction at an efficient price. The 80lb weight is standard for professional flyers and restaurant menus: stiff enough to hold its shape when handed out, light enough to keep postage manageable for direct mail. True Color runs flyers on our Konica Minolta digital production press — the same machine we use for brochures and business cards — with consistent colour from the first sheet to the last. 100 flyers is the minimum (letter size, 8.5×11\"). Price per flyer drops significantly at 250 and 500+. Want a heavier feel? Upgrade to 100lb gloss for $20 extra on a 250-flyer run — noticeably thicker in hand. Both sides available; double-sided is included in the base price. Common uses in Saskatoon: restaurant menus, event programs, open house handouts, election campaign materials, contractor service lists, and non-profit fundraiser sheets. Half-letter (5.5×8.5\"), legal, and other formats available on request. Supply PDF or high-res PNG at 150+ DPI. No file? Our in-house designer handles layout from a rough concept — starts at $35. Pickup at 216 33rd St W, Saskatoon in 1–2 business days, or same-day rush for $40 flat.",
    fromPrice: "$45",
    category: "FLYER",
    material_code: "PLACEHOLDER_80LB",
    heroImage: "/images/products/product/flyers-stack-800x600.webp",
    galleryImages: [
      "/images/products/product/flyers-stack-800x600.webp",
      "/images/gallery/gallery-flyer-nissen-ramen.jpg",
      "/images/gallery/gallery-flyer-sprayright-agri.jpg",
      "/images/gallery/gallery-flyers-boxed-marketing.jpg",
    ],
    defaultSides: 2,
    sideOptions: true,
    sizePresets: [
      { label: "Letter (100)", width_in: 8.5, height_in: 11 },
    ],
    qtyPresets: [100, 250, 500, 1000],
    lotPriced: true,
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
      "ACP (aluminum composite panel) is what you choose when a sign needs to last indefinitely — permanent business signage, address plaques, site identification boards, and retail directories that need to look sharp 10 years from now. The material consists of two thin aluminum face sheets bonded to a polyethylene core, producing a panel that's rigid but surprisingly lightweight — far easier to handle than solid aluminum plate. True Color prints on ACP with UV-cured digital inks that bond permanently to the surface for rich colour and sharp detail that won't fade, peel, or blister through Saskatchewan temperature swings. Unlike coroplast that flexes in the wind or wood that rots, ACP panels stay perfectly flat and weather-resistant for their entire lifespan. Standard sizes run from 12×18\" up to 4×8 ft. Mounting holes are drilled on request for screw-and-standoff installation; adhesive backing is available for glass or finished walls. Gloss laminate is standard; matte finish is available on request. ACP is the right call for permanent signage on a building exterior, at a gated entrance, or in a lobby. Printed and cut in-house at 216 33rd St W, Saskatoon — no outsourcing, same-day rush available on most sizes.",
    fromPrice: "$60",
    category: "RIGID",
    material_code: "RMACP002",
    heroImage: "/images/products/product/acp-aluminum-sign-800x600.webp",
    galleryImages: [
      "/images/products/product/acp-aluminum-sign-800x600.webp",
      "/images/products/product/acp-sign-brick-wall-800x600.webp",
    ],
    defaultSides: 1,
    sideOptions: false,
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
      "5mm PVC foamboard is the go-to material for indoor display work that doesn't need to survive the elements — trade show graphics, conference signage, retail point-of-purchase displays, real estate open house easels, and event directionals. The panel is rigid enough to stand on its own in an easel or lean against a wall without curling, yet light enough to carry a 24×36\" panel in one hand. True Color prints foamboard displays using full-colour UV-resistant digital print — sharp photo reproduction, vivid brand colours, and clean cut edges. Foamboard is strictly an indoor material: unlike ACP or coroplast, it's not weatherproof and will absorb moisture outdoors. For temporary outdoor signage, coroplast is the correct swap. Where foamboard wins is indoors — it's less expensive than ACP, lighter to transport, and easy to mount with foam tape or small picture hooks. Common sizes are 12×18\", 18×24\", and 24×36\". Custom sizes and oversized panels up to 48\" wide are available. Typical uses in Saskatoon: clinic waiting room displays, trade show booth graphics, realtor open house signs, school and university event posters, and lobby directories. Pickup at 216 33rd St W. Same-day rush available on standard sizes.",
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
      "Adhesive vinyl window decals give storefronts, offices, and vehicles a clean, professional look without a permanent commitment. Printed on Arlon DPF 510 matte adhesive vinyl — a 3.2 mil cast vinyl film with a removable adhesive that peels cleanly from glass without leaving residue. True Color prints window decals with Roland UV inks: vivid, UV-resistant colour that holds up outdoors for 2–3 years before any fading. Common uses across Saskatoon: coffee shop window promos, dental office hours on the front door, barber shop logos on the window, contractor logos on truck rear windows, and real estate brokerage door graphics. Any size is possible — enter your custom dimensions in the estimator. For die-cut shapes (circles, logos, custom outlines), contact us for a quote. Standard finish is matte; gloss is available on request. For vehicle windows where you want the graphic visible from outside but not reverse-printed for the driver, specify exterior-facing standard print. For inside-mounted graphics that read correctly from outside, specify reverse-print interior application. Installation is $75 base rate if you want it done professionally, or we supply the decal pre-masked on transfer tape for straightforward self-application on flat glass. Pickup at 216 33rd St W, Saskatoon.",
    fromPrice: "$45",
    category: "DECAL",
    material_code: "ARLPMF7008",
    heroImage: "/images/gallery/gallery-window-decal-swiss-barber.webp",
    galleryImages: [
      "/images/products/product/vinyl-window-decal-storefront-800x600.webp",
      "/images/products/product/vinyl-decal-car-rear-800x600.webp",
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
      { label: "Material", value: "Arlon DPF 510 matte adhesive vinyl — 3.2 mil" },
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
    relatedSlugs: ["window-perf", "vinyl-lettering", "vehicle-magnets"],
    materialInfo: {
      headline: "Arlon DPF 510 matte adhesive vinyl — 3.2 mil full-colour print",
      bullets: [
        "Removable adhesive — peels cleanly from glass without residue",
        "Full-colour UV-resistant print — vibrant colours, 2–3 year outdoor lifespan",
        "Custom shapes and die-cut edges available on request",
        "Works on glass, vehicle windows, smooth walls, and metal",
      ],
    },
  },

  "window-perf": {
    slug: "window-perf",
    name: "Perforated Window Vinyl",
    tagline: "One-way vision graphics. Full colour outside, see-through inside.",
    description:
      "Perforated window vinyl lets you turn a glass storefront into a billboard — full-colour graphic visible from the street, while people inside can still see out through the perforations. The 70/30 ratio means 70% of the surface is printed coverage and 30% is open perforations. From outside: a vivid, continuous graphic. From inside: a screen-like view that preserves natural light and sightlines. True Color prints window perf on 6 mil Vision Perf material with Roland UV outdoor inks — rated for 2–3 years of Saskatchewan outdoor exposure. It applies like a standard adhesive decal and peels cleanly when you want to refresh the graphic. Common applications in Saskatoon: restaurant and café windows with seasonal menu graphics, vehicle rear windows for fleet branding and election campaigns, fitness studio glass partitions, and retail franchise storefronts. Window perf works best on exterior-facing smooth glass. Avoid applying over existing tinted film or frosted glass. Custom panel sizes available — enter your exact window dimensions in the estimator. For multi-panel installations across wide windows, we recommend on-site installation ($75 base rate) to ensure panel alignment and clean seams. For a single panel, self-installation on flat glass is straightforward. Pickup at 216 33rd St W, Saskatoon.",
    fromPrice: "$48",
    category: "DECAL",
    material_code: "RMVN006",
    heroImage: "/images/products/product/window-perf-800x600.webp",
    galleryImages: [
      "/images/products/product/window-perf-800x600.webp",
      "/images/products/product/perf-vinyl-storefront-exterior-800x600.webp",
      "/images/products/product/perf-vinyl-interior-seethrough-800x600.webp",
      "/images/products/product/perf-vinyl-closeup-texture-800x600.webp",
      "/images/gallery/gallery-window-decal-swiss-barber.webp",
    ],
    defaultSides: 1,
    sideOptions: false,
    sizePresets: [
      { label: "24×36\"", width_in: 24, height_in: 36 },
      { label: "36×48\"", width_in: 36, height_in: 48 },
      { label: "36×80\"", width_in: 36, height_in: 80 },
      { label: "48×80\"", width_in: 48, height_in: 80 },
    ],
    qtyPresets: [1, 2, 5, 10],
    specs: [
      { label: "Material", value: "Vision Perf 70/30 window vinyl — 6 mil" },
      { label: "Perforation", value: "30% open area — see-through from inside, opaque from outside" },
      { label: "Print", value: "Full-colour UV-resistant digital print" },
      { label: "Standard sizes", value: "24×36\", 36×48\", 36×80\", 48×80\" — custom panel sizes available" },
      { label: "Application", value: "Exterior glass — storefronts, vehicle rear windows, office partitions" },
      { label: "Removal", value: "Clean peel — no adhesive residue on glass" },
    ],
    whoUsesThis: ["Retail", "Franchise", "Healthcare", "Auto", "Restaurant"],
    faqs: [
      {
        q: "Can people see through window perf from outside?",
        a: "No — from the outside, the graphic is fully visible and opaque. The 30% open perforation is only apparent up close. From inside, you see through the open areas like a screen.",
      },
      {
        q: "How do I measure a window for perf vinyl?",
        a: "Measure the glass area you want covered (width × height in inches). You don't need to cover the frame. We'll cut to your exact dimensions.",
      },
      {
        q: "Does window perf work on all glass?",
        a: "Yes — it applies to any smooth glass surface. Avoid applying over tinted film or existing window graphics.",
      },
      {
        q: "How long does window perf last outdoors?",
        a: "UV-resistant inks give 2–3 years in direct sun. The vinyl itself is rated for extended outdoor use.",
      },
      {
        q: "Do you install window perf?",
        a: "Installation is available at $75 base rate. Large multi-panel jobs are quoted separately. Or pick up and apply it yourself — it's straightforward on flat glass.",
      },
    ],
    relatedSlugs: ["window-decals", "vinyl-lettering", "vinyl-banners"],
    materialInfo: {
      headline: "Vision Perf 70/30 — 6 mil one-way vision vinyl",
      bullets: [
        "70% print coverage — full-colour, vibrant outdoor graphics",
        "30% open perforations — natural light and sightlines preserved",
        "UV-resistant inks — 2–3 year outdoor lifespan",
        "Clean-peel adhesive — no residue on glass",
      ],
    },
  },

  "vinyl-lettering": {
    slug: "vinyl-lettering",
    name: "Vinyl Lettering",
    tagline: "Cut vinyl letters for store hours, addresses, and names.",
    description:
      "Vinyl lettering is the clean, minimalist choice for store hours, business names, suite numbers, and directional text — no printing involved, just precision-cut letters from solid-colour vinyl film. The result is a sharp, professional look that can't be replicated with a printed sticker at the same cost. Priced by bounding box area at $8.50/sqft with a $40 minimum order. A typical set of window hours on a retail door runs $40–$65 depending on the size of the lettering. Available in white, black, red, blue, gold, and other colours on request — no upcharge for colour selection. Where vinyl lettering beats a printed decal: any application where you want a single clean colour that reads sharp from a distance without the visible edge or background of a full decal sheet. Window hours on a front door. Business name above a reception desk. Address numbers on a building exterior. Company name on a truck door without a magnet. Lettering is cut and delivered on transfer tape — peel the backing, position the tape against the surface, press firmly, and peel the tape away. Or add installation service ($75 flat) and we'll align and apply it for you in our shop. Pickup at 216 33rd St W, Saskatoon. Same-day rush available.",
    fromPrice: "$40",
    category: "VINYL_LETTERING",
    material_code: "ARLPMF7008",
    heroImage: "/images/products/product/vinyl-lettering-800x600.webp",
    galleryImages: [
      "/images/products/product/vinyl-lettering-800x600.webp",
      "/images/products/product/vinyl-lettering-shop-window-800x600.webp",
      "/images/products/product/vinyl-lettering-office-wall-800x600.webp",
      "/images/products/product/vinyl-lettering-vehicle-door-800x600.webp",
      "/images/gallery/gallery-vinyl-lettering-cowry-kitchen.jpg",
      "/images/gallery/gallery-vinyl-lettering-mags.jpg",
    ],
    defaultSides: 1,
    sideOptions: false,
    sizePresets: [
      { label: "12×6\"",  width_in: 12, height_in: 6  },
      { label: "24×6\"",  width_in: 24, height_in: 6  },
      { label: "36×6\"",  width_in: 36, height_in: 6  },
      { label: "48×12\"", width_in: 48, height_in: 12 },
    ],
    qtyPresets: [1, 2, 5, 10],
    specs: [
      { label: "Material", value: "Arlon DPF 510 matte vinyl — 3.2 mil, single colour" },
      { label: "Method", value: "Die-cut (no print) — precision plotter cut from coloured vinyl" },
      { label: "Colours", value: "White, black, red, blue, gold — other colours available on request" },
      { label: "Pricing", value: "By bounding box area — enter the width × height of your text block" },
      { label: "Minimum", value: "$40 minimum order" },
      { label: "Application", value: "Glass, painted walls, smooth metal, vehicle doors" },
    ],
    whoUsesThis: ["Retail", "Restaurant", "Healthcare", "Office", "Trades"],
    faqs: [
      {
        q: "How do I measure my lettering for a quote?",
        a: "Measure the width and height of the imaginary box that contains all your text. For example, a 3-line store hours block at 36\" wide × 12\" tall = enter 36×12\". That's the bounding box we price from.",
      },
      {
        q: "What's the difference between vinyl lettering and a printed decal?",
        a: "Vinyl lettering is a single opaque colour, precision-cut — clean, minimalist look, great for hours or addresses. Printed decals support full colour, logos, and photos. If you need more than one colour or any images, choose a window decal instead.",
      },
      {
        q: "What colours are available?",
        a: "White and black cover 90% of jobs. We also carry red, blue, gold, and other colours — just let us know when ordering. No upcharge for colour selection.",
      },
      {
        q: "What's the minimum order?",
        a: "The minimum charge is $40. A typical set of store hours on a door runs $40–$65 depending on size.",
      },
      {
        q: "Do you install vinyl lettering?",
        a: "Installation is $75 flat and includes alignment, squeegee application, and tape removal. Or we prep the lettering on transfer tape for easy DIY install — peel, position, and press.",
      },
    ],
    relatedSlugs: ["window-decals", "window-perf", "coroplast-signs"],
    materialInfo: {
      headline: "Arlon DPF 510 matte vinyl — 3.2 mil die-cut lettering",
      bullets: [
        "Single-colour precision cut — no printing, just clean letter shapes",
        "Applies to glass, painted surfaces, metal, and more",
        "UV-resistant — 3–5 year indoor lifespan; 2–3 years outdoors",
        "Transfer tape included — positioned and ready to apply",
      ],
    },
  },

  "retractable-banners": {
    slug: "retractable-banners",
    name: "Retractable Banner Stands",
    tagline: "Economy, Deluxe, or Premium stand. Banner included.",
    description:
      "A retractable banner stand gives you a professional 33.5×80\" printed display that sets up in under 30 seconds and collapses into a compact carrying case. All three tiers at True Color include the stand, a custom full-colour printed banner, and a carry bag or case — no hidden add-ons to price out separately. Economy ($219) is the right choice for occasional use: conferences, open houses, trade show appearances a few times per year. The aluminum mechanism is reliable and the carry bag makes transport easy. Deluxe ($299) adds a premium tension mechanism for a tighter, flatter banner surface and a padded carry case instead of a basic bag — better for frequent use and long-distance travel to exhibitions across Saskatchewan. Premium ($349) includes the Deluxe stand plus expedited turnaround and a professional print finish for launch-ready displays. The 33.5×80\" size is the industry standard for retractable stands — prints are not interchangeable between manufacturers, so if you have an existing stand from another brand, check dimensions before ordering a replacement. True Color prints replacement banners for existing stands too: send us the model number and we'll confirm sizing. Printed and assembled in-house at 216 33rd St W, Saskatoon. Same-day rush available on Economy tier.",
    fromPrice: "$219",
    category: "DISPLAY",
    material_code: "RBS33507875S",
    heroImage: "/images/products/product/retractable-stand-600x900.webp",
    galleryImages: [
      "/images/products/product/retractable-stand-600x900.webp",
      "/images/gallery/gallery-retractable-banner-financial-office.jpg",
      "/images/gallery/gallery-retractable-banner-client-office.jpg",
      "/images/gallery/gallery-retractable-two-men-truck.jpg",
      "/images/gallery/gallery-retractable-shammi-realtor.jpg",
      "/images/gallery/gallery-retractable-borna-realtor.jpg",
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

  "stickers": {
    slug: "stickers",
    name: "Vinyl Stickers",
    tagline: "Die-cut vinyl stickers. Minimum 50. Durable indoors and out.",
    description:
      "Vinyl stickers are printed on Arlon DPF 510 matte adhesive vinyl — the same 3.2 mil cast film we use for window decals — and die-cut to clean square edges with no white border or carrier sheet separating each sticker. Roland UV-resistant inks produce vivid, durable colour that holds up on product packaging, outdoor surfaces, and high-traffic applications for 2–3 years. The standard size is 4×4\" at a minimum order of 50 stickers. Price drops sharply with quantity: 50 stickers run roughly $1.90 each; 1000 stickers drop to $0.65 each. Custom shapes — circles, ovals, die-cut brand logos — are available by quote beyond the standard 4×4\" square. Common uses in Saskatoon: product labels for local food and ag businesses, branded stickers for farm equipment dealerships, event giveaway packs, coffee shop cup stickers, and packaging seals. Stickers are safe for product packaging as long as they don't contact food directly. The removable adhesive peels cleanly from most smooth surfaces — good for promotional campaigns where you want customers to stick your brand on a laptop or water bottle without permanently marking their property. Supply a PDF or high-res PNG at 150+ DPI. In-house design from $35. Pickup at 216 33rd St W, Saskatoon.",
    fromPrice: "$95",
    category: "STICKER",
    material_code: "ARLPMF7008",
    heroImage: "/images/products/product/stickers-800x600.webp",
    galleryImages: [
      "/images/products/product/stickers-800x600.webp",
      "/images/products/product/sticker-diecut-truecolor-logo-800x600.webp",
      "/images/products/product/sticker-custom-sheet-800x600.webp",
      "/images/products/product/sticker-laptop-waterbottle-800x600.webp",
      "/images/gallery/gallery-stickers-dyck-farms.jpg",
    ],
    defaultSides: 1,
    sideOptions: false,
    sizePresets: [
      { label: "4×4\"", width_in: 4, height_in: 4 },
    ],
    qtyPresets: [50, 100, 250, 500, 1000],
    lotPriced: true,
    specs: [
      { label: "Material", value: "Arlon DPF 510 matte adhesive vinyl — 3.2 mil" },
      { label: "Print", value: "Full-colour UV-resistant digital print" },
      { label: "Cut", value: "Die-cut square — clean edges, no carrier sheet" },
      { label: "Standard size", value: "4×4\" — custom shapes and sizes by quote" },
      { label: "Minimum qty", value: "50 stickers" },
      { label: "Adhesive", value: "Removable — peels cleanly from most surfaces" },
    ],
    whoUsesThis: ["Retail", "Events", "Food & Bev", "Sports", "Trades"],
    faqs: [
      {
        q: "Why is the minimum 50 stickers?",
        a: "Setup and cutting time makes small runs uneconomical. At 50 units the price per sticker drops to $1.90 each. At 1000 units it's $0.65 each.",
      },
      {
        q: "Can I get custom shapes — circles, die-cut logos?",
        a: "Custom shapes (circles, ovals, die-cut outlines) are available by quote. The estimator prices standard 4×4\" squares. Contact us for custom shape pricing.",
      },
      {
        q: "How long do they last outdoors?",
        a: "UV-resistant inks give 2–3 years outdoors on smooth surfaces. For bumper or vehicle use, the removable adhesive will hold but is designed to peel cleanly — not permanent outdoor vinyl.",
      },
      {
        q: "What file do I need to supply?",
        a: "PDF or high-res PNG at 150+ DPI. For die-cut shapes, include a separate cut path in the file. Need a design? Our in-house team starts at $35.",
      },
    ],
    relatedSlugs: ["window-decals", "business-cards", "flyers"],
    materialInfo: {
      headline: "Arlon DPF 510 matte vinyl — 3.2 mil, same as window decals",
      bullets: [
        "UV-resistant inks — 2–3 year outdoor lifespan on smooth surfaces",
        "Removable adhesive — peels cleanly without residue",
        "Die-cut square edges — no white border or carrier sheet",
        "Works on glass, packaging, smooth walls, vehicles, and laptops",
      ],
    },
  },

  "postcards": {
    slug: "postcards",
    name: "Postcards",
    tagline: "14pt gloss postcards. Three sizes. From $35.",
    description:
      "Postcards on 14pt gloss card stock are thick enough to mail without an envelope, durable enough to survive postal sorting, and vivid enough to stand out in a mailbox stack. The 14pt weight is the same stock as our business cards — the same rigidity that signals quality when someone picks it up. Full-colour double-sided printing is standard: front for visual impact, back for the message, address block, and return address. True Color prints postcards on our Konica Minolta digital press with consistent colour and sharp detail. Three standard sizes: 4×6\" — the Canada Post standard for direct mail and unaddressed admail; 5×7\" — stands out in the mailbox and offers more design space; 3×4\" — compact, good for menu inserts, gift enclosures, and leave-behinds. All sizes meet Canada Post mailable postcard dimensions. For bulk mail campaigns, leave the right half of the back panel clear for the address and postage. Planning a direct mail drop in Saskatoon? We print your full run ready to address — or add a postal indicia for pre-sorted bulk mail. Common uses: real estate just-listed mailers, restaurant promo cards, election campaign materials, dental appointment reminders, and event announcements. Pickup at 216 33rd St W.",
    fromPrice: "$35",
    category: "POSTCARD",
    material_code: "PLACEHOLDER_14PT",
    heroImage: "/images/products/product/postcards-800x600.webp",
    galleryImages: [
      "/images/products/product/postcards-800x600.webp",
      "/images/products/product/postcard-realtor-justlisted-800x600.webp",
      "/images/products/product/postcard-restaurant-promo-800x600.webp",
      "/images/products/product/postcard-mailing-stack-800x600.webp",
    ],
    defaultSides: 2,
    sideOptions: false,
    sizePresets: [
      { label: "4×6\"", width_in: 6, height_in: 4 },
      { label: "5×7\"", width_in: 7, height_in: 5 },
      { label: "3×4\"", width_in: 4, height_in: 3 },
    ],
    qtyPresets: [50, 100, 250, 500, 1000],
    lotPriced: true,
    specs: [
      { label: "Stock", value: "14pt gloss coated card — same as business cards" },
      { label: "Print", value: "Full-colour double-sided digital" },
      { label: "Sizes", value: "4×6\", 5×7\", 3×4\" — standard mailable sizes" },
      { label: "Finish", value: "Gloss coated — vivid colour, fingerprint resistant" },
      { label: "Min qty", value: "50 postcards" },
    ],
    whoUsesThis: ["Real Estate", "Retail", "Events", "Healthcare", "Restaurant"],
    faqs: [
      {
        q: "What's the difference between a postcard and a flyer?",
        a: "Postcards are printed on thick 14pt card stock — rigid enough to mail without an envelope, and durable enough to hand out at events. Flyers use lighter 80lb or 100lb paper — better for high-quantity distribution or door hangers.",
      },
      {
        q: "Which size is most popular?",
        a: "4×6\" is the standard Canada Post mailable postcard size and most cost-effective to mail. 5×7\" stands out in a mailbox and has more design real estate. 3×4\" is compact — good for menus, business leave-behinds, and gift inserts.",
      },
      {
        q: "Can I mail these directly?",
        a: "Yes — 4×6\" and 5×7\" meet Canada Post unaddressed admail and addressed admail specs. Leave the right half of the back panel blank for address and postage. We can add a postal indicia if you're doing a bulk mail run — ask us.",
      },
      {
        q: "What file format do I need?",
        a: "PDF with 1/8\" bleed on all sides, or high-res PNG at 300 DPI. Our in-house designer can set up the layout for $35 if you have a rough concept.",
      },
    ],
    relatedSlugs: ["flyers", "brochures", "business-cards"],
  },

  "brochures": {
    slug: "brochures",
    name: "Brochures",
    tagline: "Tri-fold or half-fold. 100lb gloss. From $70.",
    description:
      "Brochures on 100lb gloss text paper are the step up from flyers when you want something that feels premium in hand. The 100lb weight is noticeably heavier than standard 80lb flyer paper — thick enough to hold a fold without cracking, with a smooth gloss surface that makes full-colour images and brand photography pop. True Color prints brochures on our Konica Minolta digital press, folds and scores them in-house, and has them ready for pickup in 2–3 business days. Choose tri-fold (three equal panels, six sides total) for a compact format that fits in pockets and brochure rack displays. Choose half-fold (folded in half, four larger panels) when you need more content space per panel — popular for event programs, service menus, and property listings. Half-fold adds a small upcharge: $15 extra at 100 qty, $10 extra at 250, $15 extra at 500. Minimum order is 100 brochures. Common uses in Saskatoon: medical clinic and dental practice service menus, real estate property packages, ag dealership spec sheets, contractor company overviews, and non-profit program guides. Supply a print-ready PDF with 1/8\" bleed on all sides. Need layout? Our in-house designer handles tri-fold and half-fold setups from $50. Pickup at 216 33rd St W.",
    fromPrice: "$70",
    category: "BROCHURE",
    material_code: "PLACEHOLDER_100LB",
    heroImage: "/images/products/product/brochures-800x600.webp",
    galleryImages: [
      "/images/products/product/brochures-800x600.webp",
      "/images/products/product/brochure-trifold-open-800x600.webp",
      "/images/products/product/brochure-flat-trifold-800x600.webp",
      "/images/products/product/brochure-halffold-spread-800x600.webp",
      "/images/products/product/brochure-acrylic-rack-lobby-800x600.webp",
    ],
    defaultSides: 2,
    sideOptions: false,
    sizePresets: [
      { label: "Tri-fold (6 panels)", width_in: 8.5, height_in: 11, material_code: "PLACEHOLDER_TF_100LB" },
      { label: "Half-fold (4 panels)", width_in: 8.5, height_in: 11, material_code: "PLACEHOLDER_HF_100LB" },
    ],
    qtyPresets: [100, 250, 500],
    lotPriced: true,
    specs: [
      { label: "Stock", value: "100lb gloss text — heavier and premium vs. standard flyer paper" },
      { label: "Print", value: "Full-colour double-sided digital" },
      { label: "Fold options", value: "Tri-fold (6 panels) or half-fold (4 panels)" },
      { label: "Size", value: "8.5×11\" flat — folds to letter/pocket size" },
      { label: "Min qty", value: "100 brochures" },
      { label: "Half-fold upcharge", value: "$15 extra at 100, $10 at 250, $15 at 500" },
    ],
    whoUsesThis: ["Healthcare", "Real Estate", "Retail", "Events", "Trades"],
    faqs: [
      {
        q: "What's the difference between tri-fold and half-fold?",
        a: "Tri-fold divides the 8.5×11\" sheet into 3 equal panels — you get 6 sides (front, back, and 4 interior). Half-fold folds the sheet in half — you get 4 sides, each a larger 5.5×8.5\" panel. Tri-fold is more compact (fits in a pocket); half-fold has more space per panel.",
      },
      {
        q: "How do I set up my file?",
        a: "For tri-fold: set up 3 equal panels of 3.67\" wide × 11\" tall on each side, with 1/8\" bleed. For half-fold: 2 panels of 4.25\" × 11\" each side. We'll send you a template — just ask.",
      },
      {
        q: "Why is the minimum 100?",
        a: "Folding and scoring each brochure requires setup time. Below 100 the per-unit cost rises significantly. For small runs (under 50), consider a flyer on heavier paper instead.",
      },
      {
        q: "How much does half-fold cost vs. tri-fold?",
        a: "The estimator shows tri-fold pricing. Half-fold adds: $15 extra at 100 qty, $10 extra at 250, $15 extra at 500. So 250 half-fold brochures = $115 instead of $105.",
      },
    ],
    relatedSlugs: ["flyers", "postcards", "business-cards"],
  },

  "photo-posters": {
    slug: "photo-posters",
    name: "Photo Posters",
    tagline: "220gsm matte poster paper. Seven sizes. From $15.",
    description:
      "220gsm matte poster paper produces a rich, non-glossy finish that eliminates glare under overhead lighting — ideal for framed prints, clinic walls, gallery displays, school hallways, and any space with fluorescent or track lighting. True Color prints photo posters on our wide-format Roland TrueVIS equipment, which handles photographic image detail at sizes up to 36\" wide without visible pixel loss. Seven standard sizes are available: 12×18\", 16×20\", 18×24\", 20×30\", 24×36\", 30×40\", and 36×48\". Sizes 12×18\" through 24×36\" correspond to standard IKEA and retail frame dimensions — order the poster and grab a matching frame in the same trip. Minimum file resolution: 100 DPI at the print size (a 24×36\" print needs at least a 2400×3600 pixel file). Supply 150–300 DPI for the sharpest result; we'll flag any low-resolution files before printing so there are no surprises. Each poster is priced individually — no minimum run, order one or ten. Common uses in Saskatoon: event feature posters, team and graduation photos, real estate development renderings, restaurant menu wall art, and clinic patient education displays. Oversized prints beyond 36×48\" are available on banner material by request. Pickup at 216 33rd St W.",
    fromPrice: "$15",
    category: "PHOTO_POSTER",
    material_code: "RMPS002",
    heroImage: "/images/products/product/photo-posters-800x600.webp",
    galleryImages: [
      "/images/products/product/photo-posters-800x600.webp",
      "/images/products/product/poster-framed-gallery-wall-800x600.webp",
      "/images/products/product/poster-landscape-framed-800x600.webp",
      "/images/products/product/poster-sports-team-800x600.webp",
      "/images/products/product/poster-event-easel-800x600.webp",
    ],
    defaultSides: 1,
    sideOptions: false,
    sizePresets: [
      { label: "12×18\"", width_in: 12, height_in: 18 },
      { label: "16×20\"", width_in: 16, height_in: 20 },
      { label: "18×24\"", width_in: 18, height_in: 24 },
      { label: "20×30\"", width_in: 20, height_in: 30 },
      { label: "24×36\"", width_in: 24, height_in: 36 },
      { label: "30×40\"", width_in: 30, height_in: 40 },
      { label: "36×48\"", width_in: 36, height_in: 48 },
    ],
    qtyPresets: [1],
    specs: [
      { label: "Material", value: "220gsm matte coated poster paper" },
      { label: "Finish", value: "Matte — no glare, frame-ready" },
      { label: "Sizes", value: "12×18\", 16×20\", 18×24\", 20×30\", 24×36\", 30×40\", 36×48\"" },
      { label: "Print", value: "Full-colour digital, single-sided" },
      { label: "Pricing", value: "Per unit — order individual posters, no minimum" },
    ],
    whoUsesThis: ["Events", "Photography", "Retail", "Healthcare", "Sports"],
    faqs: [
      {
        q: "Matte vs. glossy — which should I choose?",
        a: "We print posters on matte paper. Matte is preferred for framed prints, office displays, and anywhere with overhead lighting — it eliminates glare and reads clearly at all angles. Glossy finish is available for some products but not standard for posters.",
      },
      {
        q: "Are these sizes frame-ready?",
        a: "Yes — 12×18\", 16×20\", 18×24\", 20×30\", and 24×36\" all correspond to standard frame sizes you'll find at IKEA, Walmart, and art supply stores. The 30×40\" and 36×48\" may require custom frames.",
      },
      {
        q: "Can you print larger than 36×48\"?",
        a: "Yes — we can print wide-format sizes beyond 36×48\" on banner or vinyl material. For oversized poster prints, request a custom quote.",
      },
      {
        q: "What resolution do I need for a large poster?",
        a: "Minimum 100 DPI at the print size. For a 24×36\" poster, that's 2400×3600 pixels. For the best results, supply 150–300 DPI. We'll let you know if the file resolution is too low before printing.",
      },
    ],
    relatedSlugs: ["foamboard-displays", "vinyl-banners", "flyers"],
  },

  "magnet-calendars": {
    slug: "magnet-calendars",
    name: "Magnet Calendars",
    tagline: "Any size. Team schedules, business calendars, promotions.",
    description:
      "Promotional magnet calendars are printed on the same 30mil flexible magnetic sheeting as our vehicle magnets, topped with a white gloss vinyl laminate surface that holds vivid full-colour print. The result is a rigid-feeling, professional magnet that sticks to fridges, filing cabinets, locker doors, and any ferromagnetic steel surface. Sports teams order their season schedules on 5×7\" or 8.5×11\" magnets — fans stick them on the fridge and see your logo every day for eight months. Realtors print year-at-a-glance calendars with their headshot and contact info as year-round leave-behinds. Contractors use custom sizes with their phone number and services list as a practical branded giveaway that outlasts any paper flyer. Any standard size from 4×7\" to 8.5×11\" is on the estimator, or enter custom dimensions in the calculator. Pricing is based on square footage — a 5×7\" magnet at 25 units runs well under $2 each before GST. Volume discounts apply: 5% off at 5–9 units, 10% off at 10+. For orders of 50 or more, call us for team bulk pricing. In-house layout and design from $35 for calendar grids, schedule tables, and branded templates. Pickup at 216 33rd St W, Saskatoon.",
    fromPrice: "$45",
    category: "MAGNET",
    material_code: "MAG302437550M",
    heroImage: "/images/products/product/magnet-calendars-800x600.webp",
    galleryImages: [
      "/images/products/product/magnet-calendars-800x600.webp",
      "/images/products/product/magnet-calendar-fridge-800x600.webp",
      "/images/products/product/magnet-calendar-filing-cabinet-800x600.webp",
      "/images/products/product/magnet-calendar-cards-800x600.webp",
    ],
    defaultSides: 1,
    sideOptions: false,
    sizePresets: [
      { label: '4×7"',    width_in: 4,   height_in: 7  },
      { label: '5×7"',    width_in: 5,   height_in: 7  },
      { label: '5×8"',    width_in: 5,   height_in: 8  },
      { label: '4×9"',    width_in: 4,   height_in: 9  },
      { label: '8.5×11"', width_in: 8.5, height_in: 11 },
    ],
    qtyPresets: [1, 10, 25, 50, 100],
    specs: [
      { label: "Material", value: "30mil flexible magnetic sheeting — same as vehicle magnets" },
      { label: "Print surface", value: "White gloss vinyl laminate — full colour" },
      { label: "Common sizes", value: "4×7\", 5×7\", 5×8\", 4×9\", 8.5×11\" — or any custom size" },
      { label: "Min order", value: "$45 (team bulk pricing available at 50+)" },
      { label: "Use", value: "Fridge magnets, team schedules, realtor calendars, promo giveaways" },
    ],
    whoUsesThis: ["Sports Teams", "Real Estate", "Construction", "Agriculture", "Events"],
    faqs: [
      {
        q: "What's the typical use for magnet calendars?",
        a: "Sports teams print their season schedules — fans stick them on the fridge all season. Realtors hand them out with the year calendar and their contact info. Contractors use them as branded leave-behinds. Any business that wants something customers keep for months rather than recycle.",
      },
      {
        q: "What sizes can I order?",
        a: "Any size you want. Common sizes are 4×7\", 5×7\", 5×8\", 4×9\", and 8.5×11\". Use the Custom button on the estimator to enter any dimensions — pricing is based on square footage.",
      },
      {
        q: "Do bulk discounts apply for team orders?",
        a: "Yes — 5% off at 5–9 units, 10% off at 10+. For orders of 50 or more, call or email us — team bulk pricing can go as low as $8 each on large runs. We'll quote you directly.",
      },
      {
        q: "What's the difference between this and a vehicle magnet?",
        a: "Same 30mil material — the difference is size and intent. Vehicle magnets are 12×18\" and larger for car doors. Magnet calendars are sized for fridges, filing cabinets, and office whiteboards.",
      },
      {
        q: "Do they stick to all fridges?",
        a: "They stick to any steel or ferromagnetic surface. Most fridges, filing cabinets, and metal doors work fine. Stainless steel fridges vary — some are non-magnetic. Test with a regular fridge magnet first.",
      },
      {
        q: "What file do I need?",
        a: "PDF or high-res PNG at 150+ DPI at your chosen size. Include 1/8\" bleed on all sides. For calendar templates (month grids, schedule tables), our designer can set these up from $35.",
      },
    ],
    relatedSlugs: ["vehicle-magnets", "coroplast-signs", "flyers"],
    materialInfo: {
      headline: "30mil flexible magnetic sheeting — same as vehicle magnets",
      bullets: [
        "Thick 30mil magnetic base — stays put on fridges and metal surfaces",
        "Full-colour gloss laminate print surface — vivid, durable",
        "Flexible — rolls or folds without cracking",
        "No backing paper — ready to stick right away",
      ],
    },
  },
};

export const PRODUCT_SLUGS = Object.keys(PRODUCTS);

export function getProduct(slug: string): ProductContent | undefined {
  return PRODUCTS[slug];
}
