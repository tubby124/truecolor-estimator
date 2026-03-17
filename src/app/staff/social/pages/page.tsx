import { PagesClient } from "./PagesClient";

export const metadata = {
  title: "Pages | Social Studio",
};

// Hardcoded list of SEO landing pages with their topics
const LANDING_PAGES = [
  { slug: "banner-printing-saskatoon", title: "Banner Printing Saskatoon", keyword: "banner printing" },
  { slug: "flyer-printing-saskatoon", title: "Flyer Printing Saskatoon", keyword: "flyer printing" },
  { slug: "business-cards-saskatoon", title: "Business Cards Saskatoon", keyword: "business cards" },
  { slug: "coroplast-signs-saskatoon", title: "Coroplast Signs Saskatoon", keyword: "coroplast signs" },
  { slug: "sign-company-saskatoon", title: "Sign Company Saskatoon", keyword: "custom signs" },
  { slug: "vehicle-magnets-saskatoon", title: "Vehicle Magnets Saskatoon", keyword: "vehicle magnets" },
  { slug: "sticker-printing-saskatoon", title: "Sticker Printing Saskatoon", keyword: "sticker printing" },
  { slug: "vinyl-lettering-saskatoon", title: "Vinyl Lettering Saskatoon", keyword: "vinyl lettering" },
  { slug: "window-decals-saskatoon", title: "Window Decals Saskatoon", keyword: "window decals" },
  { slug: "foamboard-printing-saskatoon", title: "Foamboard Printing Saskatoon", keyword: "foamboard printing" },
  { slug: "retractable-banner-stands-saskatoon", title: "Retractable Banner Stands", keyword: "retractable banners" },
  { slug: "postcard-printing-saskatoon", title: "Postcard Printing Saskatoon", keyword: "postcard printing" },
  { slug: "brochure-printing-saskatoon", title: "Brochure Printing Saskatoon", keyword: "brochure printing" },
  { slug: "acp-signs-saskatoon", title: "ACP Signs Saskatoon", keyword: "aluminum composite signs" },
  { slug: "photo-poster-printing-saskatoon", title: "Photo Poster Printing", keyword: "photo poster printing" },
  { slug: "window-perf-saskatoon", title: "Window Perf Saskatoon", keyword: "window perf" },
  { slug: "magnet-calendar-printing-saskatoon", title: "Magnet Calendar Printing", keyword: "magnet calendars" },
];

export default function PagesPage() {
  return <PagesClient pages={LANDING_PAGES} />;
}
