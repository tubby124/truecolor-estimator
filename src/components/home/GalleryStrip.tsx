import Image from "next/image";
import Link from "next/link";

// Curated best-of real client work for the homepage marquee. All photos are
// published gallery-manifest entries (real jobs, owner-approved). Order mixes
// product categories so no two similar jobs sit side by side.
const GALLERY_PHOTOS = [
  {
    src: "/images/gallery/gallery-coroplast-aw-bogo-promo.webp",
    alt: "A&W restaurant promo sign on coroplast printed by True Color, Saskatoon",
  },
  {
    src: "/images/gallery/gallery-business-cards-exp-premium-black.webp",
    alt: "Premium black eXp Realty business cards printed by True Color, Saskatoon",
  },
  {
    src: "/images/gallery/gallery-vehicle-vinyl-ayotte-plumbing.webp",
    alt: "Van vinyl branding for Ayotte Plumbing, printed by True Color Saskatoon",
  },
  {
    src: "/images/gallery/gallery-retractable-sisters-kitchen.webp",
    alt: "Sister's Kitchen catering retractable banner printed in Saskatoon",
  },
  {
    src: "/images/gallery/gallery-acp-coop-humboldt-platinum.webp",
    alt: "Co-op Humboldt sponsor ACP sign printed by True Color Saskatoon",
  },
  {
    src: "/images/gallery/gallery-window-decal-hutch-barber-storefront.webp",
    alt: "Hutch Barber storefront window decals installed in Saskatoon",
  },
  {
    src: "/images/gallery/gallery-outdoor-banner-best-donairs.webp",
    alt: "Outdoor storefront vinyl banner printed for Best Donairs, Saskatoon",
  },
  {
    src: "/images/gallery/gallery-coroplast-realtor-keyshape.webp",
    alt: "Custom key-shaped coroplast sign for Boyes Group Realtor, Saskatoon",
  },
  {
    src: "/images/gallery/gallery-stickers-crime-stoppers.webp",
    alt: "Saskatoon Crime Stoppers decals printed by True Color",
  },
  {
    src: "/images/gallery/gallery-acp-car-city-installed.webp",
    alt: "Car City Auto sign installed on brick building in Saskatoon",
  },
  {
    src: "/images/gallery/gallery-shop-roland-large-format.webp",
    alt: "Roland TrueVIS large-format printer in action at True Color Display Printing, Saskatoon",
  },
  {
    src: "/images/gallery/gallery-vinyl-lettering-nova-auto-centre.webp",
    alt: "Nova Auto Centre interior wall vinyl lettering installed in Saskatoon",
  },
  {
    src: "/images/gallery/gallery-banner-bbq-junction.webp",
    alt: "BBQ Junction wide vinyl banner printed by True Color Saskatoon",
  },
  {
    src: "/images/gallery/gallery-retractable-express-photography.webp",
    alt: "Express Photography black and gold retractable banner printed in Saskatoon",
  },
];

export function GalleryStrip() {
  return (
    <section data-home-gallery className="bg-[#1c1712] py-12 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <p data-image-provenance="customer-work" className="mb-3 text-sm font-semibold text-[#16C2F3]">Real customer work &amp; our shop</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">
          Our work speaks for itself
        </h2>
        <label className="mb-6 inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-white/30 px-4 text-sm font-semibold text-white">
          <input data-gallery-pause type="checkbox" className="h-5 w-5 accent-[#16C2F3]" />
          Pause gallery
        </label>
      </div>

      {/* Auto-scrolling marquee — pure CSS, pauses on hover, static for reduced-motion */}
      <style>{`
        @keyframes gallery-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .gallery-marquee-track {
          animation: gallery-marquee 70s linear infinite;
          width: max-content;
        }
        [data-home-gallery]:has([data-gallery-pause]:checked) .gallery-marquee-track,
        [data-home-gallery]:focus-within .gallery-marquee-track,
        .gallery-marquee:hover .gallery-marquee-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .gallery-marquee-track { animation: none; }
          .gallery-marquee { overflow-x: auto; }
        }
      `}</style>
      <div className="gallery-marquee overflow-hidden" aria-label="Gallery of real client print jobs">
        <div className="gallery-marquee-track flex gap-4">
          {[...GALLERY_PHOTOS, ...GALLERY_PHOTOS].map((photo, i) => (
            <div
              key={`${photo.src}-${i}`}
              className="relative w-60 sm:w-72 aspect-[4/3] rounded-lg overflow-hidden shrink-0"
              aria-hidden={i >= GALLERY_PHOTOS.length}
            >
              <Image
                src={photo.src}
                alt={i < GALLERY_PHOTOS.length ? photo.alt : ""}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 240px, 288px"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Bottom row: gallery link + Instagram */}
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
          <Link
            href="/gallery"
            className="inline-flex min-h-11 items-center text-white font-semibold text-sm hover:underline"
          >
            See full gallery →
          </Link>
          <a
            href="https://www.instagram.com/truecolorprint"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-gray-300 text-sm hover:text-white transition-colors"
          >
            Follow @truecolorprint on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
