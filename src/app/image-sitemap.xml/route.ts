import { NextResponse } from "next/server";

const BASE = "https://truecolorprinting.ca";
const IMG = `${BASE}/images/products/product`;

const PAGES = [
  {
    loc: `${BASE}/coroplast-signs-saskatoon`,
    images: [
      {
        loc: `${IMG}/coroplast-yard-sign-800x600.webp`,
        title: "Coroplast yard signs Saskatoon",
        caption: "Custom coroplast yard signs printed in Saskatoon by True Color Display Printing",
      },
      {
        loc: `${IMG}/coroplast-fence-construction-800x600.webp`,
        title: "Coroplast construction fence signs Saskatoon",
        caption: "Job site coroplast signs on construction fence, Saskatoon",
      },
      {
        loc: `${IMG}/coroplast-job-site-800x600.webp`,
        title: "Coroplast job site signs Saskatoon",
        caption: "Coroplast job site signage printed in Saskatoon by True Color Display Printing",
      },
    ],
  },
  {
    loc: `${BASE}/banner-printing-saskatoon`,
    images: [
      {
        loc: `${IMG}/banner-13oz-1200x400.webp`,
        title: "Vinyl banner printing Saskatoon 13oz scrim",
        caption: "13oz scrim vinyl banner printed in Saskatoon by True Color Display Printing",
      },
      {
        loc: `${IMG}/banner-vinyl-colorful-800x600.webp`,
        title: "Custom vinyl banners Saskatoon full colour",
        caption: "Full-colour vinyl banners printed at True Color Display Printing, Saskatoon",
      },
    ],
  },
  {
    loc: `${BASE}/business-cards-saskatoon`,
    images: [
      {
        loc: `${IMG}/business-cards-800x600.webp`,
        title: "Business card printing Saskatoon 14pt gloss",
        caption: "Business cards printed in Saskatoon on 14pt gloss stock — True Color Display Printing",
      },
    ],
  },
  {
    loc: `${BASE}/flyer-printing-saskatoon`,
    images: [
      {
        loc: `${IMG}/flyers-stack-800x600.webp`,
        title: "Flyer printing Saskatoon 80lb gloss",
        caption: "Flyers printed in Saskatoon on 80lb gloss stock — True Color Display Printing",
      },
    ],
  },
  {
    loc: `${BASE}/aluminum-signs-saskatoon`,
    images: [
      {
        loc: `${IMG}/acp-aluminum-sign-800x600.webp`,
        title: "Aluminum composite ACP sign Saskatoon",
        caption: "3mm ACP aluminum signs printed in Saskatoon — True Color Display Printing",
      },
      {
        loc: `${IMG}/acp-sign-brick-wall-800x600.webp`,
        title: "ACP sign mounted on brick wall Saskatoon",
        caption: "Aluminum composite panel sign installed on brick wall, Saskatoon",
      },
    ],
  },
  {
    loc: `${BASE}/vehicle-magnets-saskatoon`,
    images: [
      {
        loc: `${IMG}/vehicle-magnets-800x600.webp`,
        title: "Vehicle magnets Saskatoon 30mil",
        caption: "30mil vehicle magnets printed in Saskatoon — True Color Display Printing",
      },
      {
        loc: `${IMG}/magnet-truck-construction-800x600.webp`,
        title: "Truck door magnet sign Saskatoon construction",
        caption: "Custom truck door magnets for construction company, Saskatoon",
      },
    ],
  },
  {
    loc: `${BASE}/retractable-banners-saskatoon`,
    images: [
      {
        loc: `${IMG}/retractable-stand-600x900.webp`,
        title: "Retractable banner stand Saskatoon pull-up",
        caption: "Retractable pull-up banner stand printed in Saskatoon — True Color Display Printing",
      },
    ],
  },
  {
    loc: `${BASE}/foamboard-printing-saskatoon`,
    images: [
      {
        loc: `${IMG}/foamboard-display-800x600.webp`,
        title: "Foamboard display printing Saskatoon",
        caption: "Foamboard displays for events and trade shows, Saskatoon — True Color Display Printing",
      },
    ],
  },
  {
    loc: `${BASE}/agriculture-signs-saskatoon`,
    images: [
      {
        loc: `${BASE}/images/industries/agriculture/sign-farm-gate.webp`,
        title: "Coroplast farm gate sign Saskatchewan agriculture",
        caption: "Coroplast farm gate sign with ranch name and no trespassing warning — Saskatchewan prairie",
      },
      {
        loc: `${BASE}/images/industries/agriculture/sign-plot-marker.webp`,
        title: "Crop plot marker sign Saskatchewan field trial",
        caption: "Coroplast crop plot marker sign with variety name — Saskatchewan field research",
      },
      {
        loc: `${BASE}/images/industries/agriculture/sign-biosecurity.webp`,
        title: "Biosecurity restricted access sign Saskatchewan livestock",
        caption: "Biosecurity area coroplast sign at Saskatchewan livestock operation entrance",
      },
      {
        loc: `${BASE}/images/industries/agriculture/banner-trade-show.webp`,
        title: "Agriculture trade show vinyl banner Saskatchewan",
        caption: "Vinyl trade show banner for Saskatchewan agriculture expo booth backdrop",
      },
      {
        loc: `${BASE}/images/industries/agriculture/banner-seasonal-sale.webp`,
        title: "Seasonal farm sale banner Saskatchewan seed dealer",
        caption: "Seasonal farm sale vinyl banner with pricing for Saskatchewan dealer day event",
      },
      {
        loc: `${BASE}/images/industries/agriculture/banner-farm-event.webp`,
        title: "Farm open day event banner Saskatchewan",
        caption: "Farm open day event banner welcoming visitors to Saskatchewan acreage",
      },
      {
        loc: `${BASE}/images/industries/agriculture/magnet-farm-truck.webp`,
        title: "Farm truck vehicle magnet Saskatchewan",
        caption: "Vehicle magnet on farm truck door with ranch branding — Saskatchewan gravel road",
      },
      {
        loc: `${BASE}/images/industries/agriculture/magnet-equipment-dealer.webp`,
        title: "Ag equipment dealer vehicle magnet Saskatchewan",
        caption: "Vehicle magnet on ag equipment dealer service vehicle with company branding",
      },
    ],
  },
  {
    loc: `${BASE}/agribusiness-signs-saskatchewan`,
    images: [
      {
        loc: `${BASE}/images/industries/agribusiness/sign-dealer-fascia.webp`,
        title: "ACP fascia sign Saskatchewan farm equipment dealer",
        caption: "ACP aluminum fascia sign on Saskatchewan farm equipment dealership exterior",
      },
      {
        loc: `${BASE}/images/industries/agribusiness/sign-warehouse-id.webp`,
        title: "Warehouse identification sign grain elevator Saskatchewan",
        caption: "ACP warehouse identification sign for grain elevator or agricultural supply building",
      },
      {
        loc: `${BASE}/images/industries/agribusiness/sign-storefront.webp`,
        title: "Agricultural retail storefront sign Saskatchewan",
        caption: "ACP storefront sign for agricultural retail supply store in Saskatchewan town",
      },
      {
        loc: `${BASE}/images/industries/agribusiness/retractable-trade-show.webp`,
        title: "Trade show retractable banner stand Saskatchewan agriculture",
        caption: "Retractable banner stand at Saskatchewan agriculture trade show booth display",
      },
      {
        loc: `${BASE}/images/industries/agribusiness/retractable-dealer-showroom.webp`,
        title: "Dealer showroom retractable banner farm equipment",
        caption: "Retractable banner stand in farm equipment dealer showroom promoting new product line",
      },
      {
        loc: `${BASE}/images/industries/agribusiness/flyer-product-sheet.webp`,
        title: "Product specification flyer agricultural equipment dealer",
        caption: "Product specification flyer for agricultural equipment dealer on 80lb gloss stock",
      },
      {
        loc: `${BASE}/images/industries/agribusiness/flyer-seasonal-promo.webp`,
        title: "Spring seeding promotion flyer Saskatchewan seed retailer",
        caption: "Spring seeding promotion flyer for Saskatchewan seed retailer with pricing",
      },
      {
        loc: `${BASE}/images/industries/agribusiness/postcard-direct-mail.webp`,
        title: "Direct mail postcard Saskatchewan agricultural supply",
        caption: "Direct mail postcard for Saskatchewan agricultural supply company on 14pt gloss",
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
