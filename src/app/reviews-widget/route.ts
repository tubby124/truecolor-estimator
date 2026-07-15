const WIDGET_URL =
  "https://cdn.trustindex.io/widgets/c1/c1b158266dfc004a71264ccddfe/content.html";
const WIDGET_CSS_URL =
  "https://cdn.trustindex.io/assets/widget-presetted-css/v2/16-light-background.css";

const RESPONSIVE_CSS = `
body{margin:0;padding:12px;background:#fff;font-family:Arial,sans-serif;color:#1c1712}
h1{max-width:1180px;margin:4px auto 16px;font-size:24px;line-height:1.2}
@media (max-width:767px){
  .ti-widget[data-layout-id='16'] .ti-col-3 .ti-review-item{flex:0 0 100%!important;max-width:100%!important}
  .ti-widget[data-layout-id='16'] .ti-review-item:nth-child(n+4){display:none!important}
  .ti-widget[data-layout-id='16'] .ti-load-more-reviews-container{display:none!important}
  .ti-widget[data-layout-id='16'] .ti-reviews-container .ti-reviews-container-wrapper{margin-bottom:0!important}
  .ti-widget[data-layout-id='16'] .ti-review-item .ti-review-image{display:none!important}
  .ti-widget[data-layout-id='16'] .ti-review-item .ti-review-text-container{width:100%!important;max-width:100%!important}
}`;

export async function GET() {
  try {
    const [widgetResponse, cssResponse] = await Promise.all([
      fetch(WIDGET_URL, { next: { revalidate: 3600 } }),
      fetch(WIDGET_CSS_URL, { next: { revalidate: 86400 } }),
    ]);
    if (!widgetResponse.ok) throw new Error(`Trustindex widget returned ${widgetResponse.status}`);

    const [widgetHtml, css] = await Promise.all([
      widgetResponse.text(),
      cssResponse.ok ? cssResponse.text() : Promise.resolve(""),
    ]);

    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Customer Reviews | True Color Display Printing</title><base href="https://cdn.trustindex.io/"><style>${css}\n${RESPONSIVE_CSS}</style></head><body><main><h1>Customer reviews</h1>${widgetHtml}</main></body></html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline' https://cdn.trustindex.io; img-src data: https:; font-src data: https:;",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch {
    return new Response("Reviews are temporarily unavailable.", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }
}
