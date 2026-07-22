import { TRUSTINDEX_LOADER_URL } from "@/lib/trustindex";

const GOOGLE_ALL_REVIEWS_URL =
  "https://www.google.com/maps/place/?q=place_id:ChIJ96tVovr3BFMRkfoeVs16NAA";

export function GET() {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Customer Reviews | True Color Display Printing</title><style>body{margin:0;padding:24px;background:#f8f6f2;font-family:system-ui,-apple-system,sans-serif;color:#1c1712}main{max-width:1180px;margin:0 auto}h1{margin:0 0 20px;font-size:28px;line-height:1.2}a{color:#087fa1}</style></head><body><main><h1>Customer reviews</h1><script type="application/ld+json" data-trustindex="1">{"@context":"https://schema.org","@graph":[]}</script><script defer async src="${TRUSTINDEX_LOADER_URL}"></script><noscript><p>JavaScript is required for the review slider. <a href="${GOOGLE_ALL_REVIEWS_URL}">Read our reviews on Google.</a></p></noscript></main></body></html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Content-Security-Policy": "default-src 'none'; script-src https://cdn.trustindex.io https://*.trustindex.io; style-src 'unsafe-inline' https://cdn.trustindex.io https://*.trustindex.io; img-src data: https:; connect-src https://cdn.trustindex.io https://*.trustindex.io; font-src data: https://cdn.trustindex.io https://*.trustindex.io;",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
