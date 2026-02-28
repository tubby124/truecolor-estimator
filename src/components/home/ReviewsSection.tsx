const GOOGLE_REVIEW_URL = "https://g.page/r/CZH6HlbNejQAEAE/review";

// ── Desktop widget — 3-column grid (layout 16) ───────────────────────────────
const DESKTOP_WIDGET_URL =
  "https://cdn.trustindex.io/widgets/c1/c1b158266dfc004a71264ccddfe/content.html";
// CSS URL: getCDNUrl() + "assets/widget-presetted-css/v{cssVersion}/{layoutId}-{setId}.css"
// data-layout-id="16", data-set-id="light-background", data-css-version="2"
const DESKTOP_CSS_URL =
  "https://cdn.trustindex.io/assets/widget-presetted-css/v2/16-light-background.css";
// Sprite sheet: all reviewer profile photos stacked vertically, 40px per row
const DESKTOP_SPRITE_URL =
  "https://cdn.trustindex.io/widgets/c1/c1b158266dfc004a71264ccddfe/sprite.jpg";

// ── Mobile widget — slider (layout 5) ────────────────────────────────────────
// loader.js?3924add66dce01062296d322f53 — path prefix is first 2 chars ("39")
const MOBILE_WIDGET_URL =
  "https://cdn.trustindex.io/widgets/39/3924add66dce01062296d322f53/content.html";
// data-layout-id="5", data-set-id="light-background", data-css-version="2"
const MOBILE_CSS_URL =
  "https://cdn.trustindex.io/assets/widget-presetted-css/v2/5-light-background.css";
const MOBILE_SPRITE_URL =
  "https://cdn.trustindex.io/widgets/39/3924add66dce01062296d322f53/sprite.jpg";

// Override Trustindex slider to be swipeable with zero JS (native scroll-snap).
// loader.js normally drives slide transitions via JS transforms; without it the
// flex wrapper stays static and overflows. We flip overflow→auto + add
// scroll-snap so touch users can swipe naturally between cards.
const MOBILE_SCROLL_SNAP_CSS = `
.ti-widget[data-layout-id='5'] .ti-reviews-container-wrapper{overflow-x:auto!important;overflow-y:hidden!important;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.ti-widget[data-layout-id='5'] .ti-reviews-container-wrapper::-webkit-scrollbar{display:none}
.ti-widget[data-layout-id='5'] .ti-review-item{flex:0 0 100%!important;max-width:100%!important;scroll-snap-align:start}
.ti-widget[data-layout-id='5'] .ti-controls{display:none!important}
`;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

async function fetchWidgetHtml(
  widgetUrl: string,
  cssUrl: string,
  spriteUrl: string,
  extraCss = "",
): Promise<string | null> {
  try {
    const [widgetRes, cssRes] = await Promise.all([
      fetch(widgetUrl, { next: { revalidate: 3600 } }),
      fetch(cssUrl,    { next: { revalidate: 86400 } }), // CSS rarely changes
    ]);
    if (!widgetRes.ok) return null;

    const [widgetHtml, css] = await Promise.all([
      widgetRes.text(),
      cssRes.ok ? cssRes.text() : Promise.resolve(""),
    ]);

    // Inject sprite background-positions server-side.
    // loader.js normally does this in JS: querySelectorAll(".ti-profile-img-sprite")
    // then sets style.background = url(sprite.jpg) at 0 -(index*40)px per reviewer.
    // CSS confirms height:40px for this layout. We replicate that here.
    let spriteIdx = 0;
    const widgetWithSprites = widgetHtml.replace(
      /(<div[^>]+class="[^"]*ti-profile-img-sprite[^"]*"[^>]*)(>)/g,
      (_match, tag, close) => {
        const bg = `background:url('${spriteUrl}') 0 -${spriteIdx * 40}px no-repeat`;
        spriteIdx++;
        return `${tag} style="${bg}"${close}`;
      }
    );

    // Inline CSS (+ any overrides) + sprite-injected widget HTML
    return `<style>${css}${extraCss}</style>\n${widgetWithSprites}`;
  } catch {
    return null;
  }
}

export async function ReviewsSection() {
  const [desktopHtml, mobileHtml] = await Promise.all([
    fetchWidgetHtml(DESKTOP_WIDGET_URL, DESKTOP_CSS_URL, DESKTOP_SPRITE_URL),
    fetchWidgetHtml(MOBILE_WIDGET_URL, MOBILE_CSS_URL, MOBILE_SPRITE_URL, MOBILE_SCROLL_SNAP_CSS),
  ]);

  return (
    <section className="bg-white border-b border-gray-100 py-8 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-6">
        {/* Desktop — 3-column grid, hidden on mobile */}
        {desktopHtml && (
          <div className="hidden md:block" dangerouslySetInnerHTML={{ __html: desktopHtml }} />
        )}

        {/* Mobile — CSS scroll-snap slider, hidden on desktop */}
        {mobileHtml && (
          <div className="md:hidden" dangerouslySetInnerHTML={{ __html: mobileHtml }} />
        )}

        {/* Leave a review CTA */}
        <div className="mt-5 text-center">
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#1c1712] transition-colors"
          >
            <GoogleIcon />
            <span>Happy with your order? Leave us a review →</span>
          </a>
        </div>
      </div>
    </section>
  );
}
