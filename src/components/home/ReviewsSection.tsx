const GOOGLE_REVIEW_URL = "https://g.page/r/CZH6HlbNejQAEAE/review";
// Google Maps place page — opens to the reviews tab
const GOOGLE_ALL_REVIEWS_URL =
  "https://www.google.com/maps/place/?q=place_id:ChIJ96tVovr3BFMRkfoeVs16NAA";

// ── Widget — 3-column grid (layout 16), used for both desktop and mobile ─────
const WIDGET_URL =
  "https://cdn.trustindex.io/widgets/c1/c1b158266dfc004a71264ccddfe/content.html";
// data-layout-id="16", data-set-id="light-background", data-css-version="2"
const WIDGET_CSS_URL =
  "https://cdn.trustindex.io/assets/widget-presetted-css/v2/16-light-background.css";
// Sprite sheet: all reviewer profile photos stacked vertically, 40px per row
const WIDGET_SPRITE_URL =
  "https://cdn.trustindex.io/widgets/c1/c1b158266dfc004a71264ccddfe/sprite.jpg";

// On mobile (<768px): 1-column, show 3 reviews (always text — see sort below).
// Layout 5 (slider) was dropped — it requires JS to set card heights at runtime;
// without loader.js the ti-reviews-container-wrapper collapses to zero height.
const MOBILE_RESPONSIVE_CSS = `
@media (max-width:767px){
  .ti-widget[data-layout-id='16'] .ti-col-3 .ti-review-item{flex:0 0 100%!important;max-width:100%!important}
  .ti-widget[data-layout-id='16'] .ti-review-item:nth-child(n+4){display:none!important}
  .ti-widget[data-layout-id='16'] .ti-load-more-reviews-container{display:none!important}
  .ti-widget[data-layout-id='16'] .ti-reviews-container .ti-reviews-container-wrapper{margin-bottom:0!important}
}`;

// Reorder review items so text reviews always come first.
// Trustindex sorts by date — rating-only reviews (no written text) can appear
// anywhere and would waste mobile nth-child slots with blank cards.
// Strategy: split on the ti-review-item boundary, check each chunk for real
// text content in the ti-review-text-container, float those to the top.
// nth-child(n+4) on mobile then always picks 3 reviews that have actual text.
function sortTextReviewsFirst(html: string): string {
  const MARKER = '<div class="ti-review-item ';
  const parts = html.split(MARKER);
  if (parts.length <= 1) return html;

  const prefix = parts[0]; // everything before the first review item
  const items  = parts.slice(1); // each chunk begins right after MARKER

  const hasText = (chunk: string): boolean => {
    const idx = chunk.indexOf('class="ti-review-text-container');
    if (idx === -1) return false;
    // Strip HTML tags from the content area and look for substantive text.
    // Threshold of 10 chars filters out whitespace-only or empty containers.
    const plain = chunk.slice(idx).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return plain.length > 10;
  };

  const withText    = items.filter(hasText);
  const withoutText = items.filter((i) => !hasText(i));
  return prefix + [...withText, ...withoutText].map((i) => MARKER + i).join('');
}

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

    // Float text reviews to the top so the mobile nth-child slice always
    // shows reviews with actual written content, not rating-only blanks.
    const widgetSorted = sortTextReviewsFirst(widgetWithSprites);

    // Inline base CSS first, then widget HTML, then our overrides last.
    // Overrides must come AFTER the widget HTML because content.html embeds an
    // inline <style class="scss-content"> at its end with !important rules —
    // putting our CSS after ensures we win the cascade regardless of specificity.
    return `<style>${css}</style>\n${widgetSorted}${extraCss ? `\n<style>${extraCss}</style>` : ""}`;
  } catch {
    return null;
  }
}

export async function ReviewsSection() {
  const widgetHtml = await fetchWidgetHtml(
    WIDGET_URL,
    WIDGET_CSS_URL,
    WIDGET_SPRITE_URL,
    MOBILE_RESPONSIVE_CSS,
  );

  return (
    <section className="bg-white border-b border-gray-100 py-8 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-6">
        {/* Reviews widget — 3-col grid on desktop, 1-col top-3-text reviews on mobile */}
        {widgetHtml && (
          <div dangerouslySetInnerHTML={{ __html: widgetHtml }} />
        )}

        {/* Mobile only — see all reviews link (widget shows top 3 text reviews) */}
        <div className="md:hidden mt-4 text-center">
          <a
            href={GOOGLE_ALL_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
          >
            <GoogleIcon />
            <span>See all 27 reviews on Google</span>
          </a>
        </div>

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
