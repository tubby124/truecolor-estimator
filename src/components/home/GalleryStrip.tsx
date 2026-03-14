import Image from "next/image";
import Link from "next/link";

const GALLERY_PHOTOS = [
  {
    src: "/images/gallery/gallery-shop-roland-large-format.webp",
    alt: "Roland TrueVIS large-format printer in action at True Color Display Printing, Saskatoon",
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
    src: "/images/gallery/gallery-vehicle-vinyl-ayotte-plumbing.webp",
    alt: "Van vinyl branding for Ayotte Plumbing, printed by True Color Saskatoon",
  },
  {
    src: "/images/gallery/gallery-business-cards-bd-deep-cleaning.webp",
    alt: "Business cards printed for BD Deep Cleaning, Saskatoon",
  },
  {
    src: "/images/gallery/gallery-retractable-two-men-truck.webp",
    alt: "Retractable banner stand for Two Men and a Truck, Saskatoon",
  },
];

export function GalleryStrip() {
  return (
    <section className="bg-[#1c1712] px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
          Our work speaks for itself
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {GALLERY_PHOTOS.map((photo) => (
            <div
              key={photo.src}
              className="relative aspect-[4/3] rounded-lg overflow-hidden"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
            </div>
          ))}
        </div>

        {/* Bottom row: gallery link + Instagram */}
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
          <Link
            href="/gallery"
            className="text-white font-semibold text-sm hover:underline"
          >
            See full gallery →
          </Link>
          <a
            href="https://www.instagram.com/truecolorprint"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 text-sm hover:text-gray-200 transition-colors"
          >
            Follow @truecolorprint on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
