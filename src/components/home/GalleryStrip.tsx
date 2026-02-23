import Image from "next/image";
import Link from "next/link";

const GALLERY_IMAGES = [
  {
    src: "/images/products/product/coroplast-yard-sign-800x600.webp",
    alt: "Coroplast yard sign — True Color Display Printing Saskatoon",
  },
  {
    src: "/images/products/product/coroplast-fence-construction-800x600.webp",
    alt: "Coroplast fence construction sign — True Color Display Printing Saskatoon",
  },
  {
    src: "/images/products/product/banner-vinyl-colorful-800x600.webp",
    alt: "Colourful vinyl banner — True Color Display Printing Saskatoon",
  },
  {
    src: "/images/products/product/vehicle-magnets-800x600.webp",
    alt: "Vehicle magnets — True Color Display Printing Saskatoon",
  },
  {
    src: "/images/products/product/magnet-truck-construction-800x600.webp",
    alt: "Construction truck magnet — True Color Display Printing Saskatoon",
  },
  {
    src: "/images/products/product/business-cards-800x600.webp",
    alt: "Business cards — True Color Display Printing Saskatoon",
  },
  {
    src: "/images/products/product/acp-aluminum-sign-800x600.webp",
    alt: "ACP aluminum sign — True Color Display Printing Saskatoon",
  },
  {
    src: "/images/products/product/acp-sign-brick-wall-800x600.webp",
    alt: "ACP sign on brick wall — True Color Display Printing Saskatoon",
  },
];

export function GalleryStrip() {
  return (
    <section className="bg-[#1c1712] px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
          Our work speaks for itself
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {GALLERY_IMAGES.map((img) => (
            <div
              key={img.src}
              className="relative h-40 overflow-hidden rounded-lg"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 50vw, 25vw"
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
            href="https://instagram.com/truecolorprinting"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 text-sm hover:text-gray-200 transition-colors"
          >
            Follow @truecolorprinting on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
