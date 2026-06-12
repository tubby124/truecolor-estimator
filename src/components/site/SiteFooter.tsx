import Link from "next/link";
import Image from "next/image";
import { REVIEW_COUNT } from "@/lib/reviews";

export function SiteFooter() {
  return (
    <footer className="bg-[#1c1712] text-gray-400 mt-16">
      {/* Pre-footer CTA band */}
      <div className="border-b border-white/10 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white font-bold text-xl">Ready to print? See your exact price now.</p>
          <Link
            href="/products"
            className="bg-[#16C2F3] text-white font-bold px-7 py-3.5 rounded-full hover:bg-[#0fb0dd] transition-colors whitespace-nowrap shrink-0"
          >
            Get a Price →
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Col 1: Brand */}
          <div>
            <Link href="/">
              <Image
                src="/truecolorlogo.webp"
                alt="True Color Display Printing"
                width={140}
                height={40}
                className="h-8 w-auto object-contain mb-4"
              />
            </Link>
            <p className="text-sm leading-relaxed">
              Saskatoon&apos;s print shop for signs, banners, magnets, cards, and flyers.
              Transparent pricing. In-house designer. Local pickup.
            </p>
            <p className="text-xs text-gray-500 mt-4">5.0 ★ on Google · {REVIEW_COUNT} reviews</p>
          </div>

          {/* Col 2: Contact + address */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Find Us</h3>
            <div className="space-y-2 text-sm">
              <a
                href="https://maps.google.com/?q=216+33rd+St+W+Saskatoon+SK+S7L+0V1"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-white transition-colors"
              >
                216 33rd St W (upstairs)<br />
                Saskatoon, SK S7L 0V1
              </a>
              <p className="text-gray-400">Mon–Fri 9 AM – 5 PM</p>
              <a href="tel:+13069548688" className="block hover:text-white transition-colors">
                (306) 954-8688
              </a>
              <a
                href="https://www.instagram.com/truecolorprint"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-white transition-colors"
              >
                Instagram @truecolorprint
              </a>
              <a href="mailto:info@true-color.ca" className="block hover:text-white transition-colors">
                info@true-color.ca
              </a>
            </div>
          </div>

          {/* Col 3: Products & Services */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Products & Services</h3>
            <div className="grid grid-cols-2 gap-x-4 text-sm">
              <div className="space-y-2">
                <Link href="/products" className="block hover:text-white transition-colors">Get a Price</Link>
                <Link href="/printing-prices-saskatoon" className="block hover:text-white transition-colors">2026 Price Guide</Link>
                <Link href="/sign-company-saskatoon" className="block hover:text-white transition-colors">Sign Company</Link>
                <Link href="/coroplast-signs-saskatoon" className="block hover:text-white transition-colors">Coroplast Signs</Link>
                <Link href="/banner-printing-saskatoon" className="block hover:text-white transition-colors">Vinyl Banners</Link>
                <Link href="/business-cards-saskatoon" className="block hover:text-white transition-colors">Business Cards</Link>
                <Link href="/flyer-printing-saskatoon" className="block hover:text-white transition-colors">Flyer Printing</Link>
                <Link href="/brochure-printing-saskatoon" className="block hover:text-white transition-colors">Brochure Printing</Link>
                <Link href="/booklet-printing-saskatoon" className="block hover:text-white transition-colors">Booklet Printing</Link>
                <Link href="/sticker-printing-saskatoon" className="block hover:text-white transition-colors">Sticker Printing</Link>
                <Link href="/postcard-printing-saskatoon" className="block hover:text-white transition-colors">Postcard Printing</Link>
                <Link href="/photo-poster-printing-saskatoon" className="block hover:text-white transition-colors">Photo Posters</Link>
                <Link href="/poster-printing-saskatoon" className="block hover:text-white transition-colors">Poster Printing</Link>
              </div>
              <div className="space-y-2">
                <Link href="/vehicle-magnets-saskatoon" className="block hover:text-white transition-colors">Vehicle Magnets</Link>
                <Link href="/vehicle-decals-saskatoon" className="block hover:text-white transition-colors">Vehicle Decals</Link>
                <Link href="/retractable-banners-saskatoon" className="block hover:text-white transition-colors">Retractable Banners</Link>
                <Link href="/window-decals-saskatoon" className="block hover:text-white transition-colors">Window Decals</Link>
                <Link href="/window-perf-saskatoon" className="block hover:text-white transition-colors">Window Perf</Link>
                <Link href="/wall-graphics-saskatoon" className="block hover:text-white transition-colors">Wall Graphics</Link>
                <Link href="/vinyl-lettering-saskatoon" className="block hover:text-white transition-colors">Vinyl Lettering</Link>
                <Link href="/aluminum-signs-saskatoon" className="block hover:text-white transition-colors">Aluminum Signs</Link>
                <Link href="/foamboard-printing-saskatoon" className="block hover:text-white transition-colors">Foamboard Printing</Link>
                <Link href="/large-format-printing-saskatoon" className="block hover:text-white transition-colors">Large Format</Link>
                <Link href="/same-day-printing-saskatoon" className="block hover:text-white transition-colors">Same-Day Printing</Link>
                <Link href="/graphic-design-saskatoon" className="block hover:text-white transition-colors">Graphic Design</Link>
                <Link href="/trade-show-displays-saskatoon" className="block hover:text-white transition-colors">Trade Shows</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Industries We Serve — full-width grid for all industry pages */}
        <div className="mt-10 pt-8 border-t border-white/5">
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Industries We Serve</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-3 md:gap-y-2 text-sm">
            <Link href="/agriculture-signs-saskatoon" className="hover:text-white transition-colors">Agriculture</Link>
            <Link href="/agribusiness-signs-saskatchewan" className="hover:text-white transition-colors">Agribusiness</Link>
            <Link href="/brewery-saskatoon" className="hover:text-white transition-colors">Breweries</Link>
            <Link href="/car-dealership-signs-saskatoon" className="hover:text-white transition-colors">Car Dealerships</Link>
            <Link href="/chiropractor-signs-saskatoon" className="hover:text-white transition-colors">Chiropractors</Link>
            <Link href="/church-banners-saskatoon" className="hover:text-white transition-colors">Churches</Link>
            <Link href="/construction-signs-saskatoon" className="hover:text-white transition-colors">Construction</Link>
            <Link href="/commercial-signs-saskatoon" className="hover:text-white transition-colors">Commercial Signs</Link>
            <Link href="/community-printing-saskatoon" className="hover:text-white transition-colors">Community Printing</Link>
            <Link href="/daycare-signs-saskatoon" className="hover:text-white transition-colors">Daycares</Link>
            <Link href="/dental-office-signs-saskatoon" className="hover:text-white transition-colors">Dental Offices</Link>
            <Link href="/education-signs-saskatoon" className="hover:text-white transition-colors">Education</Link>
            <Link href="/banner-printing-saskatoon" className="hover:text-white transition-colors">Event Banners</Link>
            <Link href="/for-lease-signs-saskatoon" className="hover:text-white transition-colors">For-Lease Signs</Link>
            <Link href="/gym-fitness-signs-saskatoon" className="hover:text-white transition-colors">Gym & Fitness</Link>
            <Link href="/graduation-banners-saskatoon" className="hover:text-white transition-colors">Graduation</Link>
            <Link href="/healthcare-signs-saskatoon" className="hover:text-white transition-colors">Healthcare</Link>
            <Link href="/hotel-signs-saskatoon" className="hover:text-white transition-colors">Hotels</Link>
            <Link href="/law-office-signs-saskatoon" className="hover:text-white transition-colors">Law Offices</Link>
            <Link href="/non-profit-signs-saskatoon" className="hover:text-white transition-colors">Non-Profits</Link>
            <Link href="/pharmacy-signs-saskatoon" className="hover:text-white transition-colors">Pharmacies</Link>
            <Link href="/property-management-signs-saskatoon" className="hover:text-white transition-colors">Property Management</Link>
            <Link href="/real-estate-signs-saskatoon" className="hover:text-white transition-colors">Real Estate</Link>
            <Link href="/restaurant-signs-saskatoon" className="hover:text-white transition-colors">Restaurants</Link>
            <Link href="/retail-signs-saskatoon" className="hover:text-white transition-colors">Retail Stores</Link>
            <Link href="/salon-signs-saskatoon" className="hover:text-white transition-colors">Salons</Link>
            <Link href="/school-signs-saskatoon" className="hover:text-white transition-colors">Schools & Sports</Link>
            <Link href="/construction-signs-saskatoon" className="hover:text-white transition-colors">Trade Contractors</Link>
            <Link href="/election-signs" className="hover:text-white transition-colors">Election Signs</Link>
            <Link href="/mothers-day-printing-saskatoon" className="hover:text-white transition-colors">Mother&apos;s Day</Link>
          </div>
        </div>

        {/* Quick links row */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/gallery" className="hover:text-white transition-colors">Our Work</Link>
            <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link href="/services" className="hover:text-white transition-colors">Services</Link>
            <Link href="/resources" className="hover:text-white transition-colors">Resources</Link>
            <Link href="/quote" className="hover:text-white transition-colors">Custom Quote</Link>
            <a
              href="https://g.page/r/CZH6HlbNejQAEAE/review"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              ★ Leave a Review
            </a>
          </div>
        </div>

        {/* Saskatchewan cities */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Also serving Saskatchewan</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/banner-printing-regina" className="hover:text-white transition-colors">Regina</Link>
            <Link href="/signs-prince-albert-sk" className="hover:text-white transition-colors">Prince Albert</Link>
            <Link href="/printing-lloydminster-sk" className="hover:text-white transition-colors">Lloydminster</Link>
            <Link href="/signs-moose-jaw-sk" className="hover:text-white transition-colors">Moose Jaw</Link>
            <Link href="/printing-swift-current-sk" className="hover:text-white transition-colors">Swift Current</Link>
            <Link href="/coroplast-signs-regina" className="hover:text-white transition-colors">Regina Signs</Link>
            <Link href="/signs-north-battleford-sk" className="hover:text-white transition-colors">North Battleford</Link>
            <Link href="/signs-yorkton-sk" className="hover:text-white transition-colors">Yorkton</Link>
            <Link href="/printing-estevan-sk" className="hover:text-white transition-colors">Estevan</Link>
            <Link href="/printing-weyburn-sk" className="hover:text-white transition-colors">Weyburn</Link>
          </div>
        </div>

        {/* Popular city product pages */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Popular City Products</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
            <Link href="/vehicle-magnets-regina" className="hover:text-white transition-colors">Vehicle Magnets Regina</Link>
            <Link href="/business-cards-regina" className="hover:text-white transition-colors">Business Cards Regina</Link>
            <Link href="/flyer-printing-regina" className="hover:text-white transition-colors">Flyers Regina</Link>
            <Link href="/coroplast-signs-moose-jaw-sk" className="hover:text-white transition-colors">Coroplast Moose Jaw</Link>
            <Link href="/banner-printing-moose-jaw-sk" className="hover:text-white transition-colors">Banners Moose Jaw</Link>
            <Link href="/vehicle-magnets-moose-jaw-sk" className="hover:text-white transition-colors">Magnets Moose Jaw</Link>
            <Link href="/business-cards-moose-jaw-sk" className="hover:text-white transition-colors">Cards Moose Jaw</Link>
            <Link href="/flyer-printing-moose-jaw-sk" className="hover:text-white transition-colors">Flyers Moose Jaw</Link>
            <Link href="/coroplast-signs-prince-albert-sk" className="hover:text-white transition-colors">Coroplast Prince Albert</Link>
            <Link href="/banner-printing-prince-albert-sk" className="hover:text-white transition-colors">Banners Prince Albert</Link>
            <Link href="/vehicle-magnets-prince-albert-sk" className="hover:text-white transition-colors">Magnets Prince Albert</Link>
            <Link href="/business-cards-prince-albert-sk" className="hover:text-white transition-colors">Cards Prince Albert</Link>
            <Link href="/flyer-printing-prince-albert-sk" className="hover:text-white transition-colors">Flyers Prince Albert</Link>
            <Link href="/coroplast-signs-yorkton-sk" className="hover:text-white transition-colors">Coroplast Yorkton</Link>
            <Link href="/banner-printing-yorkton-sk" className="hover:text-white transition-colors">Banners Yorkton</Link>
            <Link href="/vehicle-magnets-yorkton-sk" className="hover:text-white transition-colors">Magnets Yorkton</Link>
            <Link href="/business-cards-yorkton-sk" className="hover:text-white transition-colors">Cards Yorkton</Link>
            <Link href="/flyer-printing-yorkton-sk" className="hover:text-white transition-colors">Flyers Yorkton</Link>
          </div>
        </div>

        {/* Custom Labels & Stickers */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Custom Labels & Stickers</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
            <Link href="/labels-saskatoon" className="hover:text-white transition-colors">Custom Labels Saskatoon</Link>
            <Link href="/candle-jar-labels-saskatoon" className="hover:text-white transition-colors">Candle Jar Labels</Link>
            <Link href="/cosmetic-labels-saskatoon" className="hover:text-white transition-colors">Cosmetic Labels</Link>
            <Link href="/freezer-labels-saskatoon" className="hover:text-white transition-colors">Freezer Labels</Link>
            <Link href="/product-labels-saskatoon" className="hover:text-white transition-colors">Product Labels</Link>
            <Link href="/roll-labels-saskatoon" className="hover:text-white transition-colors">Roll Labels</Link>
            <Link href="/candle-jar-labels-regina" className="hover:text-white transition-colors">Candle Labels Regina</Link>
            <Link href="/cosmetic-labels-regina" className="hover:text-white transition-colors">Cosmetic Labels Regina</Link>
            <Link href="/freezer-labels-regina" className="hover:text-white transition-colors">Freezer Labels Regina</Link>
            <Link href="/product-labels-regina" className="hover:text-white transition-colors">Product Labels Regina</Link>
            <Link href="/candle-jar-labels-moose-jaw-sk" className="hover:text-white transition-colors">Candle Labels Moose Jaw</Link>
            <Link href="/cosmetic-labels-moose-jaw-sk" className="hover:text-white transition-colors">Cosmetic Labels Moose Jaw</Link>
            <Link href="/freezer-labels-moose-jaw-sk" className="hover:text-white transition-colors">Freezer Labels Moose Jaw</Link>
            <Link href="/product-labels-moose-jaw-sk" className="hover:text-white transition-colors">Product Labels Moose Jaw</Link>
            <Link href="/candle-jar-labels-prince-albert-sk" className="hover:text-white transition-colors">Candle Labels Prince Albert</Link>
            <Link href="/cosmetic-labels-prince-albert-sk" className="hover:text-white transition-colors">Cosmetic Labels Prince Albert</Link>
            <Link href="/freezer-labels-prince-albert-sk" className="hover:text-white transition-colors">Freezer Labels Prince Albert</Link>
            <Link href="/product-labels-prince-albert-sk" className="hover:text-white transition-colors">Product Labels Prince Albert</Link>
          </div>
        </div>

        {/* AI Design Services */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">AI Design Services</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
            <Link href="/logo-vectorization-saskatoon" className="hover:text-white transition-colors">Logo Vectorization</Link>
            <Link href="/image-upscale-saskatoon" className="hover:text-white transition-colors">Image Upscale</Link>
            <Link href="/logo-vectorization-regina" className="hover:text-white transition-colors">Logo Vec Regina</Link>
            <Link href="/image-upscale-regina" className="hover:text-white transition-colors">Image Upscale Regina</Link>
            <Link href="/logo-vectorization-moose-jaw-sk" className="hover:text-white transition-colors">Logo Vec Moose Jaw</Link>
            <Link href="/image-upscale-moose-jaw-sk" className="hover:text-white transition-colors">Image Upscale Moose Jaw</Link>
            <Link href="/logo-vectorization-prince-albert-sk" className="hover:text-white transition-colors">Logo Vec Prince Albert</Link>
            <Link href="/image-upscale-prince-albert-sk" className="hover:text-white transition-colors">Image Upscale Prince Albert</Link>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-xs text-gray-600 flex flex-col sm:flex-row justify-between gap-2">
          <p>© 2026 True Color Display Printing Ltd. All prices in CAD · GST added at checkout.</p>
          <p>
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy</Link>
            {" · "}
            <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
