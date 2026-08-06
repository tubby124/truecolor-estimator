import { NextResponse } from "next/server";

const BASE = "https://truecolorprinting.ca";
const IMG = `${BASE}/images/products/product`;
const GAL = `${BASE}/images/gallery`;
const IND = `${BASE}/images/industries`;
const SEA = `${BASE}/images/seasonal`;
const ABT = `${BASE}/images/about`;

const PAGES = [
  // ══════════════════════════════════════════════════════════════════════════
  // HOMEPAGE
  // ══════════════════════════════════════════════════════════════════════════
  {
    loc: BASE,
    images: [
      {
        loc: `${IMG}/coroplast-yard-sign-800x600.webp`,
        title: "Coroplast yard signs Saskatoon — True Color Display Printing",
        caption: "Custom coroplast yard signs printed in-house in Saskatoon, SK by True Color Display Printing at 216 33rd St W",
      },
      {
        loc: `${IMG}/vehicle-magnets-800x600.webp`,
        title: "Vehicle magnets Saskatoon — 30mil full colour",
        caption: "30mil vehicle magnets printed in Saskatoon by True Color Display Printing — removable and reusable",
      },
      {
        loc: `${IMG}/banner-vinyl-colorful-800x600.webp`,
        title: "Custom vinyl banner printing Saskatoon 13oz scrim",
        caption: "Full-colour 13oz vinyl banners printed at True Color Display Printing, Saskatoon SK",
      },
      {
        loc: `${IMG}/acp-aluminum-sign-800x600.webp`,
        title: "Aluminum composite ACP signs Saskatoon",
        caption: "3mm aluminum composite panel signs printed in Saskatoon — 10+ year outdoor lifespan",
      },
      {
        loc: `${IMG}/business-cards-800x600.webp`,
        title: "Business card printing Saskatoon 14pt gloss",
        caption: "Business cards on 14pt gloss stock — 250 double-sided from $45 at True Color, Saskatoon",
      },
      {
        loc: `${IMG}/retractable-stand-600x900.webp`,
        title: "Retractable banner stand Saskatoon trade show",
        caption: "Retractable pull-up banner stand with full-colour print — True Color Display Printing, Saskatoon",
      },
      {
        loc: `${ABT}/shop-exterior.webp`,
        title: "True Color Display Printing storefront 216 33rd St W Saskatoon",
        caption: "True Color Display Printing shop exterior at 216 33rd St W, Saskatoon SK — local print shop",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PRODUCT SEO PAGES
  // ══════════════════════════════════════════════════════════════════════════
  {
    loc: `${BASE}/coroplast-signs-saskatoon`,
    images: [
      {
        loc: `${IMG}/coroplast-yard-sign-800x600.webp`,
        title: "Coroplast yard signs Saskatoon from $8/sqft",
        caption: "Custom coroplast yard signs printed in Saskatoon by True Color Display Printing — from $8/sqft",
      },
      {
        loc: `${IMG}/coroplast-fence-construction-800x600.webp`,
        title: "Coroplast construction fence signs Saskatoon job site",
        caption: "Job site coroplast signs on construction fence — printed in Saskatoon, Saskatchewan",
      },
      {
        loc: `${IMG}/coroplast-job-site-800x600.webp`,
        title: "Coroplast job site signs Saskatoon contractor",
        caption: "Coroplast job site signage for contractors — printed in Saskatoon by True Color Display Printing",
      },
      {
        loc: `${IND}/coroplast/sign-real-estate.webp`,
        title: "Coroplast real estate yard sign Saskatoon — 18×24 for sale",
        caption: "18×24 coroplast for sale yard sign on H-stake — printed in Saskatoon by True Color Display Printing",
      },
      {
        loc: `${IND}/coroplast/sign-job-site.webp`,
        title: "Coroplast job site sign Saskatoon — under construction authorized personnel",
        caption: "24×36 coroplast job site sign on chain-link construction fence — True Color, Saskatoon SK",
      },
      {
        loc: `${IND}/coroplast/sign-election.webp`,
        title: "Coroplast election yard sign Saskatoon — city council campaign",
        caption: "Coroplast election campaign yard sign 18×24 on H-stake — printed in Saskatoon, Saskatchewan",
      },
      {
        loc: `${IND}/coroplast/sign-hoarding.webp`,
        title: "Coroplast construction hoarding panel Saskatoon downtown — Coming Summer 2026",
        caption: "4×8 coroplast construction hoarding panels with building rendering on downtown Saskatoon street — True Color Display Printing",
      },
      {
        loc: `${IND}/coroplast/sign-event-directional.webp`,
        title: "Coroplast event parking directional sign Saskatoon — 18×24 PARKING arrow on H-stake",
        caption: "18×24 coroplast PARKING directional sign on H-stake at Saskatchewan summer event entrance — True Color Display Printing",
      },
      {
        loc: `${IND}/coroplast/sign-contractor.webp`,
        title: "Coroplast contractor sign Saskatoon — 4×8 chain-link fence residential build",
        caption: "4×8 coroplast contractor sign zip-tied to chain-link construction fence at Saskatoon residential build — True Color Display Printing",
      },
    ],
  },
  {
    loc: `${BASE}/banner-printing-saskatoon`,
    images: [
      {
        loc: `${IMG}/banner-13oz-1200x400.webp`,
        title: "Vinyl banner printing Saskatoon 13oz scrim from $8.25/sqft",
        caption: "13oz scrim vinyl banner printed in Saskatoon by True Color Display Printing — from $8.25/sqft",
      },
      {
        loc: `${IMG}/banner-vinyl-colorful-800x600.webp`,
        title: "Custom vinyl banners Saskatoon full colour any size",
        caption: "Full-colour vinyl banners for events, storefronts, and trade shows — True Color, Saskatoon SK",
      },
      {
        loc: `${IND}/banners/banner-grand-opening.webp`,
        title: "Grand opening vinyl banner Saskatoon — storefront full colour",
        caption: "Grand opening vinyl banner hung above storefront entrance — printed in Saskatoon by True Color Display Printing",
      },
      {
        loc: `${IND}/banners/banner-trade-show.webp`,
        title: "Trade show vinyl banner Saskatoon — convention centre booth display",
        caption: "Trade show banner on pipe-and-drape system at convention centre — True Color Display Printing, Saskatoon",
      },
      {
        loc: `${IND}/banners/banner-fence-outdoor.webp`,
        title: "Mesh fence banner Saskatoon — outdoor construction site coming soon",
        caption: "Mesh vinyl fence banner zip-tied to construction chain-link fence — printed in Saskatoon, Saskatchewan",
      },
      {
        loc: `${IND}/banners/retractable-premium.webp`,
        title: "Premium retractable banner stand Saskatoon — double-sided aluminum 33×79",
        caption: "Premium double-sided retractable banner stand with brushed aluminum base — from $219 at True Color, Saskatoon",
      },
      {
        loc: `${IND}/banners/retractable-economy.webp`,
        title: "Economy retractable banner stand Saskatoon — pull-up full colour",
        caption: "Economy retractable pull-up banner stand with full-colour print — True Color Display Printing, Saskatoon SK",
      },
    ],
  },
  {
    loc: `${BASE}/business-cards-saskatoon`,
    images: [
      {
        loc: `${IMG}/business-cards-800x600.webp`,
        title: "Business card printing Saskatoon 14pt gloss 250 for $45",
        caption: "Business cards printed in Saskatoon on 14pt gloss stock — 250 double-sided from $45 at True Color",
      },
      {
        loc: `${IND}/business-cards/card-realtor.webp`,
        title: "Realtor business cards Saskatoon — 14pt gloss REALTOR® design",
        caption: "Realtor business cards with headshot layout on 14pt gloss stock — True Color Display Printing, Saskatoon",
      },
      {
        loc: `${IND}/business-cards/card-contractor.webp`,
        title: "Contractor business cards Saskatoon — general contractor trades 14pt gloss",
        caption: "General contractor business cards on 14pt gloss stock — printed in Saskatoon by True Color",
      },
      {
        loc: `${IND}/business-cards/card-restaurant.webp`,
        title: "Restaurant business cards Saskatoon — elegant dark gloss finish",
        caption: "Restaurant business cards with elegant burgundy design on 14pt gloss — True Color, Saskatoon SK",
      },
      {
        loc: `${IND}/business-cards/finish-gloss.webp`,
        title: "UV gloss vs matte business card finish comparison Saskatoon",
        caption: "UV gloss vs matte laminate finish comparison on business cards — True Color Display Printing, Saskatoon",
      },
      {
        loc: `${IND}/business-cards/finish-matte.webp`,
        title: "Matte finish business cards Saskatoon — 14pt charcoal architect design",
        caption: "Matte finish 14pt business cards stacked on walnut desk, no glare — True Color Display Printing, Saskatoon SK",
      },
    ],
  },
  {
    loc: `${BASE}/flyer-printing-saskatoon`,
    images: [
      {
        loc: `${IMG}/flyers-stack-800x600.webp`,
        title: "Flyer printing Saskatoon 80lb gloss from $45",
        caption: "Flyers printed in Saskatoon on 80lb gloss stock — 100 double-sided from $45 at True Color",
      },
      {
        loc: `${IND}/flyers/flyer-restaurant-promo.webp`,
        title: "Restaurant promo flyer Saskatoon — 8.5×11 80lb gloss special offer",
        caption: "Restaurant promotional flyer on 80lb gloss stock — 100 full-colour flyers from $45 at True Color, Saskatoon",
      },
      {
        loc: `${IND}/flyers/size-letter.webp`,
        title: "Letter size flyer stack Saskatoon — 8.5×11 80lb gloss full colour",
        caption: "Stack of letter-size 8.5×11 full-colour flyers on 80lb gloss — printed in Saskatoon by True Color",
      },
      {
        loc: `${IND}/flyers/flyer-grand-opening.webp`,
        title: "Grand opening retail flyer Saskatoon — 8.5×11 80lb gloss full colour stack",
        caption: "Stack of grand opening retail flyers on 80lb gloss stock — 100 from $45 at True Color Display Printing, Saskatoon",
      },
      {
        loc: `${IND}/flyers/size-half-letter.webp`,
        title: "Half-letter flyer Saskatoon — 5.5×8.5 menu insert versus 8.5×11 size comparison",
        caption: "Half-letter 5.5×8.5 restaurant menu insert flyers next to letter-size flyers — True Color Display Printing, Saskatoon SK",
      },
      {
        loc: `${IND}/flyers/flyer-open-house.webp`,
        title: "Real estate open house flyer Saskatoon — 8.5×11 80lb gloss listing print",
        caption: "Real estate open house flyer on kitchen island countertop with keys and coffee mug — True Color Display Printing, Saskatoon SK",
      },
    ],
  },
  {
    loc: `${BASE}/sign-company-saskatoon`,
    images: [
      {
        loc: `${IND}/sign-company/acp-storefront.webp`,
        title: "ACP aluminum composite storefront sign Saskatoon — business fascia signage",
        caption: "Aluminum composite panel fascia sign installed above storefront — True Color Display Printing, Saskatoon SK",
      },
      {
        loc: `${IND}/sign-company/sign-yard-real-estate.webp`,
        title: "Premium aluminum post-and-panel real estate sign Saskatoon — for sale",
        caption: "Premium aluminum post-and-panel real estate sign system on residential lawn — True Color, Saskatoon SK",
      },
      {
        loc: `${IND}/sign-company/acp-hoarding.webp`,
        title: "ACP aluminum hoarding panel Saskatoon — construction site future home dental clinic",
        caption: "4×8 ACP aluminum composite hoarding panel with building rendering at Saskatoon construction site — True Color Display Printing",
      },
      {
        loc: `${IND}/sign-company/acp-office-directory.webp`,
        title: "ACP office tenant directory panel Saskatoon — brushed aluminum lobby signage",
        caption: "Brushed aluminum ACP tenant directory panel in modern Saskatoon office lobby — True Color Display Printing",
      },
      {
        loc: `${IND}/sign-company/sign-event-directional.webp`,
        title: "Coroplast festival entrance directional sign Saskatoon — community event sponsor logos",
        caption: "Coroplast festival entrance arrow sign on H-stake at Saskatoon community event — True Color Display Printing",
      },
      {
        loc: `${IND}/sign-company/sign-job-site.webp`,
        title: "Coroplast contractor job site sign Saskatoon — Project In Progress residential build",
        caption: "4×8 coroplast job site sign on wood frame at Saskatoon residential new-build — True Color Display Printing",
      },
    ],
  },
  {
    loc: `${BASE}/aluminum-signs-saskatoon`,
    images: [
      {
        loc: `${IMG}/acp-aluminum-sign-800x600.webp`,
        title: "Aluminum composite ACP sign printing Saskatoon from $13/sqft",
        caption: "3mm ACP aluminum composite signs printed in Saskatoon — outdoor-rated, 10+ year lifespan",
      },
      {
        loc: `${IMG}/acp-sign-brick-wall-800x600.webp`,
        title: "ACP sign mounted on brick wall Saskatoon storefront",
        caption: "Aluminum composite panel sign installed on brick wall storefront, Saskatoon SK",
      },
    ],
  },
  {
    loc: `${BASE}/vehicle-magnets-saskatoon`,
    images: [
      {
        loc: `${IMG}/vehicle-magnets-800x600.webp`,
        title: "Vehicle magnets Saskatoon 30mil from $24/sqft",
        caption: "30mil vehicle magnets printed in Saskatoon — removable, reusable, full colour",
      },
      {
        loc: `${IMG}/magnet-truck-construction-800x600.webp`,
        title: "Truck door magnet sign Saskatoon construction company",
        caption: "Custom truck door magnets for Saskatoon construction company — True Color Display Printing",
      },
    ],
  },
  {
    loc: `${BASE}/retractable-banners-saskatoon`,
    images: [
      {
        loc: `${IMG}/retractable-stand-600x900.webp`,
        title: "Retractable banner stand Saskatoon from $219",
        caption: "Retractable pull-up banner stand with full-colour print — from $219 at True Color, Saskatoon",
      },
    ],
  },
  {
    loc: `${BASE}/foamboard-printing-saskatoon`,
    images: [
      {
        loc: `${IMG}/foamboard-display-800x600.webp`,
        title: "Foamboard display printing Saskatoon events trade shows",
        caption: "Foamboard displays for events and trade shows — printed in Saskatoon by True Color Display Printing",
      },
    ],
  },
  {
    loc: `${BASE}/sticker-printing-saskatoon`,
    images: [
      {
        loc: `${IMG}/stickers-800x600.webp`,
        title: "Custom sticker printing Saskatoon die-cut vinyl",
        caption: "Custom die-cut vinyl stickers printed in Saskatoon by True Color Display Printing",
      },
      {
        loc: `${IMG}/sticker-diecut-truecolor-logo-800x600.webp`,
        title: "Die-cut logo sticker Saskatoon custom shape",
        caption: "Die-cut logo sticker with custom shape — printed in Saskatoon, Saskatchewan",
      },
      {
        loc: `${IMG}/sticker-custom-sheet-800x600.webp`,
        title: "Custom sticker sheet printing Saskatoon",
        caption: "Custom sticker sheets with multiple designs — True Color Display Printing, Saskatoon SK",
      },
      {
        loc: `${IMG}/sticker-laptop-waterbottle-800x600.webp`,
        title: "Laptop and water bottle stickers Saskatoon",
        caption: "Vinyl stickers on laptop and water bottle — printed in Saskatoon by True Color",
      },
    ],
  },
  {
    loc: `${BASE}/postcard-printing-saskatoon`,
    images: [
      {
        loc: `${IMG}/postcards-800x600.webp`,
        title: "Postcard printing Saskatoon 14pt gloss",
        caption: "Postcards printed in Saskatoon on 14pt gloss stock — True Color Display Printing",
      },
      {
        loc: `${IMG}/postcard-mailing-stack-800x600.webp`,
        title: "Direct mail postcards Saskatoon bulk printing",
        caption: "Direct mail postcard stack ready for mailing — printed in Saskatoon, Saskatchewan",
      },
      {
        loc: `${IMG}/postcard-restaurant-promo-800x600.webp`,
        title: "Restaurant promotional postcard Saskatoon",
        caption: "Restaurant promotional postcard with menu specials — True Color, Saskatoon SK",
      },
      {
        loc: `${IMG}/postcard-realtor-justlisted-800x600.webp`,
        title: "Realtor just listed postcard Saskatoon real estate",
        caption: "Realtor just listed postcard for Saskatoon real estate marketing — True Color Display Printing",
      },
    ],
  },
  {
    loc: `${BASE}/brochure-printing-saskatoon`,
    images: [
      {
        loc: `${IMG}/brochures-800x600.webp`,
        title: "Brochure printing Saskatoon tri-fold half-fold",
        caption: "Professional brochures printed in Saskatoon — tri-fold and half-fold options at True Color",
      },
      {
        loc: `${IMG}/brochure-trifold-open-800x600.webp`,
        title: "Tri-fold brochure open layout Saskatoon printing",
        caption: "Tri-fold brochure with open layout — printed on 80lb gloss stock in Saskatoon",
      },
      {
        loc: `${IMG}/brochure-halffold-spread-800x600.webp`,
        title: "Half-fold brochure spread Saskatoon",
        caption: "Half-fold brochure spread showing inside panels — True Color Display Printing, Saskatoon SK",
      },
      {
        loc: `${IMG}/brochure-acrylic-rack-lobby-800x600.webp`,
        title: "Brochure display rack lobby Saskatoon business",
        caption: "Brochures in acrylic display rack in business lobby — printed in Saskatoon by True Color",
      },
    ],
  },
  {
    loc: `${BASE}/window-decals-saskatoon`,
    images: [
      {
        loc: `${IMG}/vinyl-window-decal-storefront-800x600.webp`,
        title: "Window decal storefront Saskatoon business signage",
        caption: "Custom window decals for Saskatoon storefronts — True Color Display Printing",
      },
      {
        loc: `${IMG}/vinyl-decal-car-rear-800x600.webp`,
        title: "Car rear window decal Saskatoon custom vinyl",
        caption: "Custom car rear window decal — vinyl printing in Saskatoon by True Color",
      },
    ],
  },
  {
    loc: `${BASE}/window-perf-saskatoon`,
    images: [
      {
        loc: `${IMG}/window-perf-800x600.webp`,
        title: "Perforated window vinyl Saskatoon see-through graphics",
        caption: "Perforated window vinyl with see-through graphics — printed in Saskatoon, Saskatchewan",
      },
      {
        loc: `${IMG}/perf-vinyl-storefront-exterior-800x600.webp`,
        title: "Perforated vinyl storefront exterior Saskatoon",
        caption: "Perforated window vinyl on storefront exterior — full colour graphics visible from outside",
      },
      {
        loc: `${IMG}/perf-vinyl-interior-seethrough-800x600.webp`,
        title: "Perforated vinyl interior see-through view Saskatoon",
        caption: "Interior view through perforated window vinyl — maintains visibility while displaying graphics",
      },
      {
        loc: `${IMG}/perf-vinyl-closeup-texture-800x600.webp`,
        title: "Perforated vinyl closeup texture pattern Saskatoon",
        caption: "Closeup of perforated window vinyl hole pattern — True Color Display Printing, Saskatoon",
      },
    ],
  },
  {
    loc: `${BASE}/vinyl-lettering-saskatoon`,
    images: [
      {
        loc: `${IMG}/vinyl-lettering-800x600.webp`,
        title: "Vinyl lettering Saskatoon custom cut letters",
        caption: "Custom cut vinyl lettering — printed and cut in Saskatoon by True Color Display Printing",
      },
      {
        loc: `${IMG}/vinyl-lettering-shop-window-800x600.webp`,
        title: "Shop window vinyl lettering Saskatoon storefront",
        caption: "Vinyl lettering applied to shop window storefront in Saskatoon, Saskatchewan",
      },
      {
        loc: `${IMG}/vinyl-lettering-vehicle-door-800x600.webp`,
        title: "Vehicle door vinyl lettering Saskatoon",
        caption: "Custom vinyl lettering on vehicle door — True Color Display Printing, Saskatoon SK",
      },
      {
        loc: `${IMG}/vinyl-lettering-office-wall-800x600.webp`,
        title: "Office wall vinyl lettering Saskatoon business",
        caption: "Vinyl lettering on office wall for Saskatoon business branding — True Color",
      },
    ],
  },
  {
    loc: `${BASE}/photo-poster-printing-saskatoon`,
    images: [
      {
        loc: `${IMG}/photo-posters-800x600.webp`,
        title: "Photo poster printing Saskatoon large format",
        caption: "Large format photo posters printed in Saskatoon by True Color Display Printing",
      },
      {
        loc: `${IMG}/poster-event-easel-800x600.webp`,
        title: "Event poster on easel Saskatoon",
        caption: "Event poster on display easel — printed in Saskatoon, Saskatchewan",
      },
      {
        loc: `${IMG}/poster-sports-team-800x600.webp`,
        title: "Sports team poster Saskatoon large format",
        caption: "Sports team poster large format print — True Color Display Printing, Saskatoon",
      },
      {
        loc: `${IMG}/poster-framed-gallery-wall-800x600.webp`,
        title: "Framed poster gallery wall Saskatoon",
        caption: "Framed photo poster on gallery wall display — printed in Saskatoon by True Color",
      },
    ],
  },
  // ══════════════════════════════════════════════════════════════════════════
  // ABOUT PAGE
  // ══════════════════════════════════════════════════════════════════════════
  {
    loc: `${BASE}/about`,
    images: [
      {
        loc: `${ABT}/shop-exterior.webp`,
        title: "True Color Display Printing shop exterior 216 33rd St W Saskatoon",
        caption: "True Color Display Printing storefront at 216 33rd St W, Saskatoon SK — local print shop since 2019",
      },
      {
        loc: `${ABT}/truecolor-shop-interior-800x600.webp`,
        title: "True Color print shop interior Saskatoon production floor",
        caption: "Inside True Color Display Printing — production floor with Roland and Konica Minolta equipment, Saskatoon",
      },
      {
        loc: `${ABT}/printer-roland-truvis.webp`,
        title: "Roland TrueVIS UV printer Saskatoon in-house",
        caption: "Roland TrueVIS wide-format UV printer — in-house at True Color Display Printing, Saskatoon SK",
      },
      {
        loc: `${ABT}/printer-konica-minolta.webp`,
        title: "Konica Minolta production press Saskatoon True Color",
        caption: "Konica Minolta production press for business cards, flyers, and brochures — True Color, Saskatoon",
      },
      {
        loc: `${ABT}/lamination-machine.webp`,
        title: "Lamination machine Saskatoon print finishing",
        caption: "Lamination machine for print finishing — True Color Display Printing, Saskatoon SK",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GALLERY — REAL CLIENT WORK (strongest E-E-A-T signal)
  // ══════════════════════════════════════════════════════════════════════════
  {
    loc: `${BASE}/gallery`,
    images: [
      // Behind the scenes
      {
        loc: `${GAL}/gallery-shop-roland-large-format.webp`,
        title: "Roland TrueVIS large format printer Saskatoon in-house production",
        caption: "Roland TrueVIS large format printer in action at True Color Display Printing, Saskatoon SK",
      },
      {
        loc: `${GAL}/gallery-shop-roland-ag-banner.webp`,
        title: "Roland printing agricultural banner Saskatoon production",
        caption: "Printing an agricultural banner on the Roland TrueVIS — True Color Display Printing, Saskatoon",
      },
      // Signs
      {
        loc: `${GAL}/gallery-coroplast-realtor-keyshape.webp`,
        title: "Custom key-shape realtor sign Saskatoon Boyes Group",
        caption: "Custom die-cut key-shape coroplast sign for Boyes Group REALTOR — printed in Saskatoon by True Color",
      },
      {
        loc: `${GAL}/gallery-coroplast-remax-openhouse.webp`,
        title: "RE/MAX open house coroplast sign Saskatoon real estate",
        caption: "RE/MAX open house coroplast sign printed in Saskatoon — True Color Display Printing",
      },
      {
        loc: `${GAL}/gallery-coroplast-71st-storage.webp`,
        title: "Directional coroplast sign 71st Street Storage Saskatoon",
        caption: "Roadside directional coroplast sign for 71st Street Storage — printed in Saskatoon",
      },
      {
        loc: `${GAL}/gallery-coroplast-parking-signs.webp`,
        title: "Private parking signs batch order Saskatoon",
        caption: "Batch order of private parking coroplast signs — True Color Display Printing, Saskatoon SK",
      },
      {
        loc: `${GAL}/gallery-acp-cargem-auto-sales.webp`,
        title: "ACP aluminum sign CARGEM Auto Sales Saskatoon",
        caption: "ACP aluminum composite sign for CARGEM Auto Sales — printed in Saskatoon by True Color",
      },
      {
        loc: `${GAL}/gallery-acp-mia-casa-construction.webp`,
        title: "ACP sign Mia Casa Construction Saskatoon",
        caption: "ACP aluminum sign for Mia Casa Construction — True Color Display Printing, Saskatoon",
      },
      // Banners
      {
        loc: `${GAL}/gallery-outdoor-banner-best-donairs.webp`,
        title: "Outdoor storefront banner Best Donairs Saskatoon",
        caption: "Outdoor vinyl storefront banner for Best Donairs — printed in Saskatoon by True Color",
      },
      {
        loc: `${GAL}/gallery-vinyl-banner-windshield-masters.webp`,
        title: "Vinyl banner Windshield Masters Saskatoon",
        caption: "Custom vinyl banner for Windshield Masters — True Color Display Printing, Saskatoon SK",
      },
      {
        loc: `${GAL}/gallery-banner-habesha-convenience.webp`,
        title: "Storefront banner Habesha Convenience Store Saskatoon",
        caption: "Storefront vinyl banner for Habesha Convenience Store — printed in Saskatoon",
      },
      {
        loc: `${GAL}/gallery-banner-ericsson-5g.webp`,
        title: "Large format event banner Ericsson 5G Saskatoon",
        caption: "Large format event banner for Ericsson 5G — printed in Saskatoon by True Color",
      },
      {
        loc: `${GAL}/gallery-banner-karuna-vitamin.webp`,
        title: "Trade show backdrop banner Karuna Skincare Saskatoon",
        caption: "Trade show backdrop banner for Karuna Skincare — True Color Display Printing, Saskatoon",
      },
      // Retractable
      {
        loc: `${GAL}/gallery-retractable-borna-realtor.webp`,
        title: "Retractable banner stand Borna Development Saskatoon realtor",
        caption: "Retractable banner stand for Borna Development REALTOR — printed in Saskatoon",
      },
      {
        loc: `${GAL}/gallery-retractable-two-men-truck.webp`,
        title: "Retractable banner Two Men and a Truck Saskatoon",
        caption: "Retractable banner stand for Two Men and a Truck — True Color, Saskatoon SK",
      },
      {
        loc: `${GAL}/gallery-retractable-lilians-hair.webp`,
        title: "Retractable banner Lilian's Hair Studio Saskatoon",
        caption: "Retractable banner stand for Lilian's Hair Studio — printed in Saskatoon",
      },
      // Vehicle
      {
        loc: `${GAL}/gallery-vehicle-vinyl-ayotte-plumbing.webp`,
        title: "Van vinyl branding Ayotte Plumbing Saskatoon",
        caption: "Full van vinyl branding for Ayotte Plumbing — True Color Display Printing, Saskatoon SK",
      },
      {
        loc: `${GAL}/gallery-vehicle-decal-windshield-masters.webp`,
        title: "Door magnet Windshield Masters Saskatoon vehicle signage",
        caption: "Vehicle door magnet for Windshield Masters — printed in Saskatoon by True Color",
      },
      {
        loc: `${GAL}/gallery-vehicle-vinyl-south-stream.webp`,
        title: "Truck wrap South Stream Seafood Saskatoon",
        caption: "Truck vinyl wrap for South Stream Seafood — True Color Display Printing, Saskatoon",
      },
      // Window & Vinyl
      {
        loc: `${GAL}/gallery-window-decal-swiss-barber.webp`,
        title: "Window decals Swiss Barber Saskatoon storefront",
        caption: "Custom window decals for Swiss Barber storefront — printed in Saskatoon by True Color",
      },
      {
        loc: `${GAL}/gallery-vinyl-lettering-cowry-kitchen.webp`,
        title: "Storefront vinyl lettering Cowry Cabinets Saskatoon",
        caption: "Custom vinyl lettering for Cowry Cabinets storefront — True Color, Saskatoon SK",
      },
      // Cards & Print
      {
        loc: `${GAL}/gallery-business-cards-bd-deep-cleaning.webp`,
        title: "Business cards BD Deep Cleaning Saskatoon",
        caption: "Business cards for BD Deep Cleaning on 14pt gloss — printed in Saskatoon by True Color",
      },
      {
        loc: `${GAL}/gallery-business-cards-nofal-barber.webp`,
        title: "Business cards Nofal Barber Shop Saskatoon",
        caption: "Business cards for Nofal Barber Shop — True Color Display Printing, Saskatoon SK",
      },
      {
        loc: `${GAL}/gallery-flyers-boxed-marketing.webp`,
        title: "Marketing flyers boxed order Saskatoon printing",
        caption: "Boxed order of marketing flyers — printed in Saskatoon by True Color Display Printing",
      },
      {
        loc: `${GAL}/gallery-postcards-oxenfree-crafts.webp`,
        title: "Postcards Oxenfree Crafts Saskatoon",
        caption: "Custom postcards for Oxenfree Crafts — printed in Saskatoon on 14pt gloss by True Color",
      },
      {
        loc: `${GAL}/gallery-stickers-dyck-farms.webp`,
        title: "Sticker sheets Dyck Farms Saskatchewan agriculture",
        caption: "Custom sticker sheets for Dyck Farms — printed in Saskatoon by True Color Display Printing",
      },
      // Magnets
      {
        loc: `${GAL}/gallery-magnet-calendar-shuttle.webp`,
        title: "Calendar magnet Prairie Path Shuttle Saskatoon",
        caption: "Fridge magnet calendar for Prairie Path Shuttle — True Color Display Printing, Saskatoon",
      },
      {
        loc: `${GAL}/gallery-magnet-calendar-lyndell-concrete.webp`,
        title: "Calendar magnet Lyndell Concrete Supply Saskatoon",
        caption: "Fridge magnet calendar for Lyndell Concrete Supply — True Color Display Printing, Saskatoon",
      },
      // Missing gallery images — added 2026-03-13
      {
        loc: `${GAL}/gallery-shop-roland-saskatoon-cabs.webp`,
        title: "Roland printing Saskatoon Cabs vehicle decals",
        caption: "Printing Saskatoon Cabs decals on the Roland TrueVIS — True Color Display Printing",
      },
      {
        loc: `${GAL}/gallery-coroplast-circle-made-in-canada.webp`,
        title: "Custom circle coroplast sign Made in Canada Saskatoon",
        caption: "Custom circle die-cut coroplast sign — Made in Canada, printed in Saskatoon by True Color",
      },
      {
        loc: `${GAL}/gallery-coroplast-retail-zaks-pricing.webp`,
        title: "Retail pricing signs Zaks Saskatoon coroplast",
        caption: "Retail pricing coroplast signs for Zak's — printed in Saskatoon by True Color Display Printing",
      },
      {
        loc: `${GAL}/gallery-design-retail-weve-moving.webp`,
        title: "We're Moving announcement sign Saskatoon retail",
        caption: "We're Moving announcement sign for retail business — True Color Display Printing, Saskatoon",
      },
      {
        loc: `${GAL}/gallery-coroplast-bjm-graduation.webp`,
        title: "Graduation yard sign Bishop James Mahoney Saskatoon",
        caption: "Graduation yard sign for Bishop James Mahoney — printed in Saskatoon by True Color",
      },
      {
        loc: `${GAL}/gallery-banner-colorful-nails-spa.webp`,
        title: "Salon banner Colorful Nails Spa Saskatoon",
        caption: "Vinyl salon banner for Colorful Nails & Spa — True Color Display Printing, Saskatoon SK",
      },
      {
        loc: `${GAL}/gallery-banner-hello-warman-petshop.webp`,
        title: "Large format banner Hello Warman Pet Shop Saskatchewan",
        caption: "Large format vinyl banner for Hello Warman Pet Shop — printed in Saskatoon by True Color",
      },
      {
        loc: `${GAL}/gallery-retractable-banner-financial-office.webp`,
        title: "Retractable banner stand financial services Saskatoon",
        caption: "Retractable banner stand for financial services office — True Color, Saskatoon SK",
      },
      {
        loc: `${GAL}/gallery-retractable-banner-client-office.webp`,
        title: "Retractable banner client delivery Saskatoon",
        caption: "Retractable banner stand delivered to client office — True Color Display Printing, Saskatoon",
      },
      {
        loc: `${GAL}/gallery-retractable-shammi-realtor.webp`,
        title: "Retractable banner Divine Kreation Realty Saskatoon",
        caption: "Retractable banner stand for Divine Kreation Realty — printed in Saskatoon by True Color",
      },
      {
        loc: `${GAL}/gallery-retractable-wfg-insurance.webp`,
        title: "Retractable banner WFG Insurance Saskatoon",
        caption: "Retractable banner stand for WFG Insurance agent — True Color, Saskatoon SK",
      },
      {
        loc: `${GAL}/gallery-vehicle-vinyl-ayotte-full-side.webp`,
        title: "Full side vinyl wrap Ayotte Service Van Saskatoon",
        caption: "Full side vinyl wrap on Ayotte service van — True Color Display Printing, Saskatoon",
      },
      {
        loc: `${GAL}/gallery-vinyl-lettering-skbk-trailer.webp`,
        title: "Trailer vinyl lettering SKBK Construction Saskatoon",
        caption: "Vinyl lettering on trailer for SKBK Construction — True Color Display Printing, Saskatoon SK",
      },
      {
        loc: `${GAL}/gallery-window-decal-pact-agriculture.webp`,
        title: "Office window decals PACT agriculture Saskatoon",
        caption: "Office window decals for PACT agriculture — printed in Saskatoon by True Color",
      },
      {
        loc: `${GAL}/gallery-window-decal-skull-car.webp`,
        title: "Custom die-cut window decal skull design Saskatoon",
        caption: "Custom die-cut skull car window decal — True Color Display Printing, Saskatoon SK",
      },
      {
        loc: `${GAL}/gallery-vinyl-lettering-mags.webp`,
        title: "Large cut vinyl letters MAGS Saskatoon",
        caption: "Large custom cut vinyl letters for MAGS — True Color Display Printing, Saskatoon",
      },
      {
        loc: `${GAL}/gallery-loyalty-card-prairie-cannabis.webp`,
        title: "Loyalty card Prairie Cannabis Saskatoon",
        caption: "Loyalty punch card for Prairie Cannabis — printed on 14pt stock in Saskatoon by True Color",
      },
      {
        loc: `${GAL}/gallery-business-cards-lilians-hair.webp`,
        title: "Business cards Lilian's Hair Studio Saskatoon",
        caption: "Business cards for Lilian's Hair Studio — True Color Display Printing, Saskatoon SK",
      },
      {
        loc: `${GAL}/gallery-flyer-pulse-strategies.webp`,
        title: "Professional flyer Pulse Strategies CPA Saskatoon",
        caption: "Professional flyer for Pulse Strategies CPA — printed in Saskatoon by True Color",
      },
      {
        loc: `${GAL}/gallery-large-format-realtor-poster.webp`,
        title: "Large format print Kevin Appl REALTOR Saskatoon",
        caption: "Large format print for Kevin Appl REALTOR — True Color Display Printing, Saskatoon SK",
      },
      {
        loc: `${GAL}/gallery-flyer-nissen-ramen.webp`,
        title: "Restaurant flyer Nissen Dim Sum Ramen Saskatoon",
        caption: "Restaurant flyer for Nissen Dim Sum Ramen — printed in Saskatoon by True Color",
      },
      {
        loc: `${GAL}/gallery-flyer-sprayright-agri.webp`,
        title: "Agricultural flyer SprayRight Saskatchewan",
        caption: "Agricultural flyer for SprayRight — printed in Saskatoon by True Color Display Printing",
      },
      {
        loc: `${GAL}/gallery-flyer-axis-health.webp`,
        title: "Rack cards Axis Health Center Saskatoon",
        caption: "Rack cards for Axis Health Center — True Color Display Printing, Saskatoon SK",
      },
      // 2026-08-06 proof-of-work wave (batches 1+2)
      {
        loc: `${GAL}/gallery-coroplast-aw-bogo-promo.webp`,
        title: "Promo Sign — A&W Restaurant — printed by True Color Saskatoon",
        caption: "Full-colour coroplast promo sign printed for an A&W restaurant campaign.",
      },
      {
        loc: `${GAL}/gallery-retractable-sisters-kitchen.webp`,
        title: "Retractable Banner — Sister's Kitchen — printed by True Color Saskatoon",
        caption: "Food catering retractable banner with full photo collage, printed and assembled in-house.",
      },
      {
        loc: `${GAL}/gallery-stickers-crime-stoppers.webp`,
        title: "Decals — Saskatoon Crime Stoppers — printed by True Color Saskatoon",
        caption: "Printed and cut decal sets for Saskatoon Crime Stoppers alongside service-dog notice stickers.",
      },
      {
        loc: `${GAL}/gallery-coroplast-telemiracle-shield.webp`,
        title: "Custom-Shape Sign — TeleMiracle 50 — printed by True Color Saskatoon",
        caption: "Contour-cut TeleMiracle 50 Kinsmen Kinettes shield, printed and cut on the in-house Roland.",
      },
      {
        loc: `${GAL}/gallery-window-decal-hutch-barber-storefront.webp`,
        title: "Storefront Windows — Hutch Barber — printed by True Color Saskatoon",
        caption: "Perforated and cut window graphics installed across the Hutch Barber storefront on Idylwyld Drive.",
      },
      {
        loc: `${GAL}/gallery-flyer-madina-spice.webp`,
        title: "Grocery Flyers — Madina Spice — printed by True Color Saskatoon",
        caption: "Full-colour weekly grocery flyers printed in volume for Madina Spice.",
      },
      {
        loc: `${GAL}/gallery-magnet-calendar-ramadan-prayers.webp`,
        title: "Prayer Calendars — First Choice — printed by True Color Saskatoon",
        caption: "Ramadan prayer and iqama time calendar magnets printed for First Choice.",
      },
      {
        loc: `${GAL}/gallery-magnet-calendar-hague-trucking.webp`,
        title: "Wall Calendars — Trucking Company — printed by True Color Saskatoon",
        caption: "Custom photo wall calendars for a Hague, SK trucking company — fleet photos and full-year layout.",
      },
      {
        loc: `${GAL}/gallery-photo-poster-kevin-appl.webp`,
        title: "Framed Poster — Kevin Appl, REAL — printed by True Color Saskatoon",
        caption: "Client-appreciation photo poster printed for realtor Kevin Appl.",
      },
      {
        loc: `${GAL}/gallery-flyers-event-show-run.webp`,
        title: "Event Show Flyers — Studio Run — printed by True Color Saskatoon",
        caption: "Vibrant event show flyers fresh off the digital press — colour that pops straight off the stack.",
      },
      {
        loc: `${GAL}/gallery-banner-dee-bee-shoppe.webp`,
        title: "Vinyl Banner — Dee Bee Shoppe — printed by True Color Saskatoon",
        caption: "Cotton candy vendor banner printed on 13oz scrim vinyl for the Dee Bee Shoppe.",
      },
      {
        loc: `${GAL}/gallery-acp-coop-humboldt-platinum.webp`,
        title: "ACP Panel — Co-op Humboldt — printed by True Color Saskatoon",
        caption: "Platinum sponsor recognition panel printed on aluminum composite for Co-op Humboldt.",
      },
      {
        loc: `${GAL}/gallery-acp-car-city-auto.webp`,
        title: "Dealership Sign — Car City Auto — printed by True Color Saskatoon",
        caption: "Appointment-only dealership sign printed in full colour on rigid panel for Car City Auto.",
      },
      {
        loc: `${GAL}/gallery-acp-pet-planet-parking.webp`,
        title: "Parking Sign — Pet Planet — printed by True Color Saskatoon",
        caption: "Customer parking directional sign printed for Pet Planet — clean layout, tow-notice fine print.",
      },
      {
        loc: `${GAL}/gallery-window-graphics-axis-health.webp`,
        title: "Storefront Graphics — Axis Health — printed by True Color Saskatoon",
        caption: "Service-menu window graphics installed across the Axis Health Centre storefront.",
      },
      {
        loc: `${GAL}/gallery-vinyl-lettering-nova-auto-centre.webp`,
        title: "Wall Lettering — Nova Auto Centre — printed by True Color Saskatoon",
        caption: "Large interior wall lettering cut and installed for the Nova Auto Centre showroom.",
      },
      {
        loc: `${GAL}/gallery-install-saap-building-sign.webp`,
        title: "Building Sign Install — SAAP — printed by True Color Saskatoon",
        caption: "On-site building sign installation with boom lift — print, produce, and install handled end to end.",
      },
      {
        loc: `${GAL}/gallery-banner-windshield-hub-building.webp`,
        title: "Building Banner — Windshield Hub — printed by True Color Saskatoon",
        caption: "Exterior building banner printed and mounted for Windshield Hub's Saskatoon location.",
      },
      {
        loc: `${GAL}/gallery-banner-bbq-junction.webp`,
        title: "Long-Format Banner — BBQ Junction — printed by True Color Saskatoon",
        caption: "Extra-wide restaurant banner printed edge to edge for BBQ Junction.",
      },
      {
        loc: `${GAL}/gallery-retractable-express-photography.webp`,
        title: "Retractable — Express Photography — printed by True Color Saskatoon",
        caption: "Black-and-gold retractable banner printed for Express Photography — premium studio look.",
      },
      {
        loc: `${GAL}/gallery-booklets-ten31-property.webp`,
        title: "Coil Booklets — Ten31 Property — printed by True Color Saskatoon",
        caption: "Coil-bound business tracker booklets printed and bound in-house for Ten31 Property.",
      },
      {
        loc: `${GAL}/gallery-vehicle-decal-xray-roofing.webp`,
        title: "Truck Decals — X-Ray Roofing — printed by True Color Saskatoon",
        caption: "Cut vinyl truck decals applied to the X-Ray Roofing work truck — number readable across a job site.",
      },
      {
        loc: `${GAL}/gallery-stickers-rock-water-brewing.webp`,
        title: "Sticker Sheets — Rock Water — printed by True Color Saskatoon",
        caption: "Die-cut logo sticker sheets printed and kiss-cut for Rock Water Brewing.",
      },
      {
        loc: `${GAL}/gallery-custom-shape-drywall-starburst.webp`,
        title: "Retail Starbursts — Die-Cut — printed by True Color Saskatoon",
        caption: "Die-cut starburst shelf signs for a retail drywall promo — contour cut to shape in-house.",
      },
      {
        loc: `${GAL}/gallery-coroplast-exp-open-house.webp`,
        title: "Open House Sign — eXp Realty — printed by True Color Saskatoon",
        caption: "Directional open house sign printed on coroplast for an eXp Realty team.",
      },
      {
        loc: `${GAL}/gallery-flyers-wiens-campaign.webp`,
        title: "Campaign Flyers — Ward Seven — printed by True Color Saskatoon",
        caption: "Municipal campaign flyers printed in volume stacks for a Saskatoon ward candidate.",
      },
      {
        loc: `${GAL}/gallery-business-cards-exp-premium-black.webp`,
        title: "Premium Cards — eXp Realty — printed by True Color Saskatoon",
        caption: "Premium black business cards with photo panel and QR code for an eXp Realty agent.",
      },
      {
        loc: `${GAL}/gallery-poster-roxy-super8-event.webp`,
        title: "Event Poster — Roxy Theatre — printed by True Color Saskatoon",
        caption: "Illustrated event posters printed for the One Take Super 8 screening at the Roxy Theatre.",
      },
      {
        loc: `${GAL}/gallery-aframe-cafe-sidewalk-sign.webp`,
        title: "A-Frame Sidewalk Sign — Café — printed by True Color Saskatoon",
        caption: "Sidewalk A-frame insert printed for a café promo — coroplast insert sized for a standard frame.",
      },
      {
        loc: `${GAL}/gallery-custom-shape-sasknation.webp`,
        title: "Custom-Shape Sign — SaskNation — printed by True Color Saskatoon",
        caption: "Contour-cut SaskNation arrow sign printed and cut in-house.",
      },
      {
        loc: `${GAL}/gallery-foamboard-branding-panels.webp`,
        title: "Rigid Display Panels — Branding Set — printed by True Color Saskatoon",
        caption: "Dark-theme rigid display panels printed as a coordinated branding set with QR codes.",
      },
      {
        loc: `${GAL}/gallery-coroplast-bid-on-me-auction.webp`,
        title: "Auction Signs — Bid On Me — printed by True Color Saskatoon",
        caption: "QR-coded equipment auction signs printed on coroplast for a consignment sale.",
      },
      {
        loc: `${GAL}/gallery-banner-strength-nation-champions.webp`,
        title: "Team Banner — Strength Nation — printed by True Color Saskatoon",
        caption: "U11 hockey champions banner coming off the Roland wide-format printer.",
      },
      {
        loc: `${GAL}/gallery-postcards-zaks-home-hardware.webp`,
        title: "Promo Cards — Zak's Home Hardware — printed by True Color Saskatoon",
        caption: "Engraving promo cards printed in volume for Zak's Home Hardware.",
      },
      {
        loc: `${GAL}/gallery-stickers-scott-lake-lodge.webp`,
        title: "Decals — Scott Lake Lodge — printed by True Color Saskatoon",
        caption: "Large die-cut logo decals printed for Scott Lake Lodge in the Northwest Territories.",
      },
      {
        loc: `${GAL}/gallery-retractable-dee-bee-shoppe.webp`,
        title: "Retractable — Dee Bee Shoppe — printed by True Color Saskatoon",
        caption: "Cotton candy vendor retractable banner printed and assembled for the Dee Bee Shoppe.",
      },
      {
        loc: `${GAL}/gallery-business-cards-allied-infrastructure.webp`,
        title: "Business Cards — Allied Infrastructure — printed by True Color Saskatoon",
        caption: "Clean corporate business cards printed for Allied Infrastructure.",
      },
      {
        loc: `${GAL}/gallery-window-graphics-logistics-storefront.webp`,
        title: "Window Graphics — Logistics Office — printed by True Color Saskatoon",
        caption: "Full storefront window graphics installed for a Saskatoon logistics and finance office.",
      },
      {
        loc: `${GAL}/gallery-window-lettering-cowry-storefront.webp`,
        title: "Storefront Sale Lettering — Cowry — printed by True Color Saskatoon",
        caption: "Multi-window sale lettering installed across the Cowry Kitchen & Bathroom Cabinets storefront.",
      },
      {
        loc: `${GAL}/gallery-coroplast-mint-dental-sponsor.webp`,
        title: "Sponsor Sign — Mint Dental Centre — printed by True Color Saskatoon",
        caption: "Gold-tier sponsor recognition sign printed for Mint Dental Centre.",
      },
      {
        loc: `${GAL}/gallery-coroplast-borna-development-site.webp`,
        title: "Site Sign — Borna Development — printed by True Color Saskatoon",
        caption: "For-sale development site sign printed for Borna Development Inc.",
      },
      {
        loc: `${GAL}/gallery-window-decal-namaste-door.webp`,
        title: "Door Decal — Namaste — printed by True Color Saskatoon",
        caption: "Etched-style welcome decal installed on a glass entry door.",
      },
      {
        loc: `${GAL}/gallery-vinyl-lettering-prairie-timber.webp`,
        title: "Cut Lettering — Prairie Timber Homes — printed by True Color Saskatoon",
        caption: "Large-format cut lettering produced for Prairie Timber Homes.",
      },
      {
        loc: `${GAL}/gallery-poster-paved-arts-concoction.webp`,
        title: "Event Poster — PAVED Arts — printed by True Color Saskatoon",
        caption: "Concert poster printed for the PAVED Arts Concoction event.",
      },
      {
        loc: `${GAL}/gallery-banner-baydo-golf-tour.webp`,
        title: "Event Banner — Baydo Golf Tour — printed by True Color Saskatoon",
        caption: "Golf tour event banner printed for Baydo Express Business Travel.",
      },
      {
        loc: `${GAL}/gallery-coroplast-k-realty-for-sale.webp`,
        title: "For Sale Sign — K Realty — printed by True Color Saskatoon",
        caption: "Realtor for-sale sign with photo panel printed on coroplast for K Realty.",
      },
      {
        loc: `${GAL}/gallery-brochure-saddle-stitched-booklet.webp`,
        title: "Saddle-Stitched Booklet — printed by True Color Saskatoon",
        caption: "Multi-page saddle-stitched booklet printed and finished in-house.",
      },
      {
        loc: `${GAL}/gallery-foamboard-chatime-drink-poster.webp`,
        title: "Drink Poster — Chatime — printed by True Color Saskatoon",
        caption: "Menu promo board printed for a Chatime iced americano campaign.",
      },
      {
        loc: `${GAL}/gallery-signs-service-dogs-batch.webp`,
        title: "Facility Signs — Batch Order — printed by True Color Saskatoon",
        caption: "Service-dogs-welcome facility signs printed as a repeat batch order.",
      },
      {
        loc: `${GAL}/gallery-coroplast-kids-fest-bouncy-castle.webp`,
        title: "Event Sign — October Kids Fest — printed by True Color Saskatoon",
        caption: "Colourful bouncy castle event sign printed for a kids fest.",
      },
      {
        loc: `${GAL}/gallery-vehicle-decal-radio-cabs.webp`,
        title: "Door Decals — Saskatoon Radio Cabs — printed by True Color Saskatoon",
        caption: "Oval door decals printed and cut for the Saskatoon Radio Cabs fleet.",
      },
      {
        loc: `${GAL}/gallery-coroplast-exp-land-for-sale.webp`,
        title: "Development Sign — Land For Sale — printed by True Color Saskatoon",
        caption: "Multi-lot land-for-sale development sign with floor plans and pricing detail.",
      },
      {
        loc: `${GAL}/gallery-vinyl-lettering-wedding-gold.webp`,
        title: "Wedding Lettering — Gold Script — printed by True Color Saskatoon",
        caption: "Gold script wedding lettering cut for a ceremony backdrop.",
      },
      {
        loc: `${GAL}/gallery-rack-card-bengali-realtors.webp`,
        title: "Rack Cards — Realtor Team — printed by True Color Saskatoon",
        caption: "Tall-format rack cards printed for a Calgary realtor team's seminar campaign.",
      },
      {
        loc: `${GAL}/gallery-sticker-tc-zebra-die-cut.webp`,
        title: "Die-Cut Sticker — Shop Mascot — printed by True Color Saskatoon",
        caption: "Our own die-cut zebra shop sticker — full-colour print with contour cut.",
      },
      {
        loc: `${GAL}/gallery-poster-morris-minor-art.webp`,
        title: "Art Print — Morris Minor — printed by True Color Saskatoon",
        caption: "Vintage Morris Minor art reproduction printed on the wide-format press.",
      },
      {
        loc: `${GAL}/gallery-business-cards-fade-city.webp`,
        title: "Business Cards — Fade City — printed by True Color Saskatoon",
        caption: "Bold photo business cards printed for the Fade City barber studio.",
      },
      {
        loc: `${GAL}/gallery-vehicle-decal-hyundai-stripes.webp`,
        title: "Accent Stripes — Hyundai N — printed by True Color Saskatoon",
        caption: "Red accent rocker stripes cut and installed on a Hyundai N sport model.",
      },
      {
        loc: `${GAL}/gallery-acp-car-city-installed.webp`,
        title: "Installed Sign — Car City Auto — printed by True Color Saskatoon",
        caption: "Car City Auto dealership sign mounted and lit on the brick storefront.",
      },
      {
        loc: `${GAL}/gallery-window-decal-jae-kim-photography.webp`,
        title: "Door Decal — Jae Kim Photography — printed by True Color Saskatoon",
        caption: "Gold logo door decal installed for the Jae Kim Photography studio entrance.",
      },
      {
        loc: `${GAL}/gallery-postcards-wedding-stationery.webp`,
        title: "Wedding Stationery Suite — printed by True Color Saskatoon",
        caption: "Ceremony cards, signage inserts, and welcome stationery printed as a wedding suite.",
      },
      {
        loc: `${GAL}/gallery-shop-storefront-lightbox.webp`,
        title: "Our Shop — 216 33rd St W — printed by True Color Saskatoon",
        caption: "The True Color storefront and lightbox sign at 216 33rd St W, Saskatoon.",
      },
      {
        loc: `${GAL}/gallery-flyers-grand-opening-stacks.webp`,
        title: "Grand Opening Flyers — Volume Run — printed by True Color Saskatoon",
        caption: "Grand-opening flyer stacks cut and boxed for an auto glass shop launch.",
      },
      {
        loc: `${GAL}/gallery-sticker-stonecraft-packaging.webp`,
        title: "Packaging Label — Stonecraft — printed by True Color Saskatoon",
        caption: "Brand label printed and applied to product packaging for a stone veneer company.",
      },
    ],
  },
  {
    loc: `${BASE}/printing-prices-saskatoon`,
    images: [
      { loc: `${GAL}/gallery-coroplast-aw-bogo-promo.webp`, title: "Coroplast promo sign Saskatoon from $8/sqft — A&W", caption: "A&W promo sign on coroplast — real job matched to published Saskatoon printing prices" },
      { loc: `${GAL}/gallery-banner-bbq-junction.webp`, title: "Vinyl banner Saskatoon from $66 — BBQ Junction", caption: "BBQ Junction wide vinyl banner — real job matched to published Saskatoon printing prices" },
      { loc: `${GAL}/gallery-business-cards-exp-premium-black.webp`, title: "Business cards Saskatoon 250 from $45 — eXp Realty", caption: "Premium black eXp Realty business cards — real job at published Saskatoon prices" },
      { loc: `${GAL}/gallery-flyer-madina-spice.webp`, title: "Flyer printing Saskatoon 100 from $45 — Madina Spice", caption: "Madina Spice grocery flyers — real job at published Saskatoon prices" },
      { loc: `${GAL}/gallery-retractable-express-photography.webp`, title: "Retractable banner Saskatoon from $219 — Express Photography", caption: "Express Photography retractable banner — real job at published Saskatoon prices" },
      { loc: `${GAL}/gallery-acp-coop-humboldt-platinum.webp`, title: "ACP aluminum sign Saskatoon from $13/sqft — Co-op", caption: "Co-op Humboldt ACP sponsor sign — real job at published Saskatoon prices" },
    ],
  },
  {
    loc: `${BASE}/large-format-printing-saskatoon`,
    images: [
      { loc: `${GAL}/gallery-install-saap-building-sign.webp`, title: "Large format building sign install Saskatchewan — boom lift", caption: "On-site building sign installation by True Color — large format printing Saskatoon" },
      { loc: `${GAL}/gallery-banner-windshield-hub-building.webp`, title: "Large format building banner Saskatoon — Windshield Hub", caption: "Exterior building banner printed and mounted in Saskatoon — large format printing" },
      { loc: `${GAL}/gallery-acp-car-city-installed.webp`, title: "Large format dealership sign installed Saskatoon — Car City Auto", caption: "Car City Auto sign installed on brick storefront — large format printing Saskatoon" },
      { loc: `${GAL}/gallery-vinyl-lettering-prairie-timber.webp`, title: "Large format cut lettering Saskatoon — Prairie Timber Homes", caption: "Large-format cut lettering produced in-house — True Color Saskatoon" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SEASONAL PAGES
  // ══════════════════════════════════════════════════════════════════════════
  {
    loc: `${BASE}/graduation-banners-saskatoon`,
    images: [
      {
        loc: `${SEA}/graduation/banner-school-colors.webp`,
        title: "Graduation banner school colours Saskatoon Class of 2026",
        caption: "Graduation banner in school colours — Class of 2026, printed in Saskatoon by True Color",
      },
      {
        loc: `${SEA}/graduation/banner-gold-classic.webp`,
        title: "Classic gold graduation banner Saskatoon congratulations",
        caption: "Classic navy and gold graduation banner — Congratulations Class of 2026, True Color Saskatoon",
      },
      {
        loc: `${SEA}/graduation/hero.webp`,
        title: "Retractable graduation banner stand Saskatoon step and repeat",
        caption: "Retractable graduation banner stand — step-and-repeat backdrop, True Color Display Printing Saskatoon",
      },
    ],
  },
  // ══════════════════════════════════════════════════════════════════════════
  // INDUSTRY PAGES
  // ══════════════════════════════════════════════════════════════════════════
  {
    loc: `${BASE}/healthcare-signs-saskatoon`,
    images: [
      {
        loc: `${IND}/healthcare/banner-clinical-professional.webp`,
        title: "Clinic entrance vinyl banner Saskatchewan healthcare",
        caption: "Professional clinic entrance vinyl banner — printed in Saskatoon for Saskatchewan healthcare",
      },
      {
        loc: `${IND}/healthcare/banner-health-campaign.webp`,
        title: "Flu shot campaign banner Saskatchewan clinic",
        caption: "Flu shot clinic campaign vinyl banner — True Color Display Printing, Saskatoon SK",
      },
      {
        loc: `${IND}/healthcare/banner-new-patients-welcome.webp`,
        title: "New patients welcome banner Saskatchewan medical clinic",
        caption: "New patients welcome vinyl banner for Saskatchewan medical clinic — True Color Saskatoon",
      },
      {
        loc: `${IND}/healthcare/display-lobby-directory.webp`,
        title: "Lobby directory panel ACP clinic Saskatchewan",
        caption: "ACP lobby directory panel for Saskatchewan clinic — True Color Display Printing",
      },
      {
        loc: `${IND}/healthcare/display-acp-permanent.webp`,
        title: "ACP permanent clinic directory sign Saskatchewan",
        caption: "Permanent ACP clinic directory sign — printed in Saskatoon by True Color Display Printing",
      },
      {
        loc: `${IND}/healthcare/foamboard-know-your-numbers.webp`,
        title: "Patient education foamboard display Saskatchewan healthcare",
        caption: "Patient education foamboard display for Saskatchewan healthcare — True Color Saskatoon",
      },
      {
        loc: `${IND}/healthcare/retractable-health-fair.webp`,
        title: "Health fair retractable banner stand Saskatchewan",
        caption: "Retractable banner stand for Saskatchewan health fair — True Color Display Printing",
      },
      {
        loc: `${IND}/healthcare/retractable-reception-welcome.webp`,
        title: "Reception welcome retractable stand Saskatchewan clinic",
        caption: "Reception welcome retractable banner stand for Saskatchewan clinic — True Color Saskatoon",
      },
    ],
  },
  {
    loc: `${BASE}/agriculture-signs-saskatoon`,
    images: [
      {
        loc: `${IND}/agriculture/sign-farm-gate.webp`,
        title: "Coroplast farm gate sign Saskatchewan agriculture",
        caption: "Coroplast farm gate sign with ranch name — printed in Saskatoon for Saskatchewan farmers",
      },
      {
        loc: `${IND}/agriculture/sign-plot-marker.webp`,
        title: "Crop plot marker sign Saskatchewan field trial",
        caption: "Coroplast crop plot marker sign — Saskatchewan field research, True Color Saskatoon",
      },
      {
        loc: `${IND}/agriculture/sign-biosecurity.webp`,
        title: "Biosecurity restricted access sign Saskatchewan livestock",
        caption: "Biosecurity area coroplast sign at Saskatchewan livestock operation — True Color Saskatoon",
      },
      {
        loc: `${IND}/agriculture/banner-trade-show.webp`,
        title: "Agriculture trade show vinyl banner Saskatchewan expo",
        caption: "Vinyl trade show banner for Saskatchewan agriculture expo — True Color Display Printing",
      },
      {
        loc: `${IND}/agriculture/banner-seasonal-sale.webp`,
        title: "Spring seeding sale banner Saskatchewan agriculture",
        caption: "Spring seeding sale vinyl banner for Saskatchewan ag dealer — True Color Saskatoon",
      },
      {
        loc: `${IND}/agriculture/banner-farm-event.webp`,
        title: "Farm open day event banner Saskatchewan",
        caption: "Farm open day welcome vinyl banner — Saskatchewan agriculture, True Color Display Printing",
      },
      {
        loc: `${IND}/agriculture/magnet-farm-truck.webp`,
        title: "Farm truck vehicle magnet Saskatchewan branding",
        caption: "Vehicle magnet on farm truck door with ranch branding — Saskatchewan, True Color Saskatoon",
      },
      {
        loc: `${IND}/agriculture/magnet-equipment-dealer.webp`,
        title: "Equipment dealer vehicle magnet Saskatchewan agriculture",
        caption: "Vehicle magnet for agricultural equipment dealer — Saskatchewan, True Color Saskatoon",
      },
    ],
  },
  {
    loc: `${BASE}/agribusiness-signs-saskatchewan`,
    images: [
      {
        loc: `${IND}/agribusiness/sign-dealer-fascia.webp`,
        title: "ACP fascia sign Saskatchewan farm equipment dealer",
        caption: "ACP aluminum fascia sign on Saskatchewan farm equipment dealership — True Color Saskatoon",
      },
      {
        loc: `${IND}/agribusiness/sign-warehouse-id.webp`,
        title: "Warehouse identification sign grain elevator Saskatchewan",
        caption: "ACP warehouse identification sign for grain elevator — printed in Saskatoon by True Color",
      },
      {
        loc: `${IND}/agribusiness/sign-storefront.webp`,
        title: "Retail storefront ACP sign Saskatchewan ag supply",
        caption: "ACP storefront sign for Saskatchewan agricultural supply retail — True Color Saskatoon",
      },
      {
        loc: `${IND}/agribusiness/retractable-trade-show.webp`,
        title: "Trade show retractable banner Saskatchewan agriculture",
        caption: "Retractable banner stand at Saskatchewan agriculture trade show — True Color, Saskatoon SK",
      },
      {
        loc: `${IND}/agribusiness/retractable-dealer-showroom.webp`,
        title: "Dealer showroom retractable stand Saskatchewan equipment",
        caption: "Retractable banner stand in Saskatchewan equipment dealer showroom — True Color Saskatoon",
      },
      {
        loc: `${IND}/agribusiness/flyer-product-sheet.webp`,
        title: "Product specification flyer agricultural equipment Saskatchewan",
        caption: "Product specification flyer for agricultural equipment dealer — printed in Saskatoon",
      },
      {
        loc: `${IND}/agribusiness/flyer-seasonal-promo.webp`,
        title: "Seasonal promotion flyer Saskatchewan ag supply",
        caption: "Seasonal promotion flyer for Saskatchewan ag supply — printed in Saskatoon by True Color",
      },
      {
        loc: `${IND}/agribusiness/postcard-direct-mail.webp`,
        title: "Direct mail postcard Saskatchewan agricultural supply",
        caption: "Direct mail postcard for Saskatchewan agricultural supply — 14pt gloss, True Color Saskatoon",
      },
    ],
  },
  {
    loc: `${BASE}/mothers-day-printing-saskatoon`,
    images: [
      {
        loc: `${IND}/mothers-day/banner-floral-brunch.webp`,
        title: "Mother's Day restaurant brunch vinyl banner Saskatoon",
        caption: "Mother's Day brunch vinyl banner for Saskatoon restaurant patio — True Color Display Printing",
      },
      {
        loc: `${IND}/mothers-day/banner-spa-wellness.webp`,
        title: "Mother's Day spa promotion vinyl banner Saskatoon",
        caption: "Mother's Day spa and wellness promotion banner — sage green, printed in Saskatoon by True Color",
      },
      {
        loc: `${IND}/mothers-day/banner-gift-shop.webp`,
        title: "Mother's Day gift shop entrance banner Saskatoon",
        caption: "Mother's Day gift shop entrance vinyl banner — rose and cream, True Color Display Printing Saskatoon",
      },
      {
        loc: `${IND}/mothers-day/photo-portrait-poster.webp`,
        title: "Mother's Day photo portrait poster large format Saskatoon",
        caption: "Large format Mother's Day photo portrait poster on display easel — True Color, Saskatoon SK",
      },
      {
        loc: `${IND}/mothers-day/photo-family-collage.webp`,
        title: "Mother's Day family photo collage print Saskatoon",
        caption: "Family photo collage print for Mother's Day — True Color Display Printing, Saskatoon SK",
      },
      {
        loc: `${IND}/mothers-day/photo-greeting-postcard.webp`,
        title: "Mother's Day photo greeting postcard Saskatoon printing",
        caption: "Mother's Day photo greeting postcard stack — printed on 14pt gloss in Saskatoon by True Color",
      },
      {
        loc: `${IND}/mothers-day/flyer-brunch-menu.webp`,
        title: "Mother's Day brunch menu flyer Saskatoon restaurant",
        caption: "Mother's Day prix fixe brunch menu flyer — 80lb gloss, printed in Saskatoon by True Color",
      },
      {
        loc: `${IND}/mothers-day/flyer-salon-promo.webp`,
        title: "Mother's Day salon promotion flyer Saskatoon",
        caption: "Mother's Day salon promotion flyer for Saskatoon hair studio — True Color Display Printing",
      },
      {
        loc: `${IND}/mothers-day/decal-floral-accent.webp`,
        title: "Mother's Day floral window decal Saskatoon storefront",
        caption: "Pastel pink floral vine window decal on Saskatoon retail storefront — True Color",
      },
    ],
  },
  {
    loc: `${BASE}/poster-printing-saskatoon`,
    images: [
      {
        loc: `${IND}/poster-printing/poster-concert-music.webp`,
        title: "Concert event poster printing Saskatoon music venue",
        caption: "Concert poster for Midnight Rebel at The Roxy Theatre Saskatoon — printed by True Color Display Printing",
      },
      {
        loc: `${IND}/poster-printing/poster-fundraiser-gala.webp`,
        title: "Fundraiser gala event poster Saskatoon foamboard display",
        caption: "Annual gala poster on easel at Delta Bessborough hotel Saskatoon — True Color Display Printing",
      },
      {
        loc: `${IND}/poster-printing/poster-sports-tournament.webp`,
        title: "Sports tournament poster printing Saskatoon hockey arena",
        caption: "Saskatoon Minor Hockey spring tournament poster on arena corkboard — True Color Display Printing",
      },
      {
        loc: `${IND}/poster-printing/display-restaurant-specials.webp`,
        title: "Restaurant daily specials menu display poster Saskatoon",
        caption: "Daily specials foamboard menu display on easel in Saskatoon restaurant — True Color Display Printing",
      },
      {
        loc: `${IND}/poster-printing/display-retail-promotion.webp`,
        title: "Retail sale promotion poster display Saskatoon store",
        caption: "Spring savings sale poster display in Saskatoon retail store — True Color Display Printing",
      },
      {
        loc: `${IND}/poster-printing/display-open-house.webp`,
        title: "Real estate open house display poster Saskatoon realtor",
        caption: "Realtor open house property display with floor plan on tabletop stand — True Color, Saskatoon SK",
      },
      {
        loc: `${IND}/poster-printing/retractable-nonprofit-event.webp`,
        title: "Nonprofit event retractable banner Saskatoon community",
        caption: "Saskatoon Community Outreach retractable banner stand at charity event — True Color Display Printing",
      },
      {
        loc: `${IND}/poster-printing/retractable-trade-show-display.webp`,
        title: "Trade show retractable banner display Saskatoon printing",
        caption: "True Color Display Printing retractable banner at Saskatoon trade show — signs, banners, and business cards",
      },
    ],
  },
];

function escape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildXml(): string {
  const items = PAGES.map((page) => {
    const imgs = page.images
      .map(
        (img) => `
    <image:image>
      <image:loc>${escape(img.loc)}</image:loc>
      <image:title>${escape(img.title)}</image:title>
      <image:caption>${escape(img.caption)}</image:caption>
    </image:image>`
      )
      .join("");
    return `  <url>\n    <loc>${escape(page.loc)}</loc>${imgs}\n  </url>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${items}
</urlset>`;
}

export async function GET() {
  return new NextResponse(buildXml(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
