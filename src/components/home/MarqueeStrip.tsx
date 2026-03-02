/**
 * MarqueeStrip — infinite scrolling social proof strip.
 * Uses `.marquee-track` CSS animation from globals.css.
 * Pauses on hover. Content duplicated for seamless loop.
 */

const REVIEWS = [
  { text: "Signs were ready same day — incredible quality.", author: "Mike T." },
  { text: "Best price in Saskatoon and staff were super helpful.", author: "Sarah M." },
  { text: "Ordered banners Tuesday, picked them up Wednesday morning.", author: "James R." },
  { text: "Better than Staples and way more personal. We use them for every event.", author: "Lisa K." },
  { text: "Real estate signs look so professional. Always on time.", author: "Raj P." },
  { text: "Ordered 500 flyers — bright colours, sharp printing. Amazing value.", author: "Chen W." },
  { text: "They designed our logo and printed our magnets. Loved the result.", author: "Amanda F." },
  { text: "Same-day rush for our trade show — they made it happen. Lifesavers.", author: "David N." },
];

// Duplicate items so the -50% translateX animation loops seamlessly
const ITEMS = [...REVIEWS, ...REVIEWS];

export function MarqueeStrip() {
  return (
    <div className="bg-[#1c1712] py-3 overflow-hidden select-none">
      <div className="flex marquee-track gap-10 w-max">
        {ITEMS.map((r, i) => (
          <span
            key={i}
            className="flex items-center gap-2 text-sm text-white/70 whitespace-nowrap"
          >
            <span className="text-yellow-400 text-xs tracking-tight shrink-0">★★★★★</span>
            <span className="italic">&ldquo;{r.text}&rdquo;</span>
            <span className="text-white/40 text-xs">— {r.author}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
