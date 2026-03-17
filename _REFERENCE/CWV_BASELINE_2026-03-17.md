# Core Web Vitals Baseline — 2026-03-17

Measured via Lighthouse CLI (mobile emulation, headless Chrome).
Run before Phase 18 code changes to establish pre-Wave-2 baseline.

## Results (Mobile)

| Page | Perf | A11y | LCP | CLS | TBT | FCP |
|------|------|------|-----|-----|-----|-----|
| `/` (homepage) | 59 | 90 | 3.9s | 0 | 1,580ms | 2.0s |
| `/banner-printing-saskatoon` | 67 | 96 | 4.4s | 0 | 680ms | 1.1s |
| `/flyer-printing-saskatoon` | 86 | 96 | 3.0s | 0 | 360ms | 1.0s |
| `/coroplast-signs-saskatoon` | 55 | 96 | 4.1s | 0 | 1,800ms | 1.2s |
| `/business-cards-saskatoon` | 89 | 96 | 2.1s | 0 | 390ms | 1.7s |
| `/sign-company-saskatoon` | 84 | 96 | 3.5s | 0 | 290ms | 1.6s |
| `/products/coroplast-signs` | 72 | 96 | 7.1s | 0 | 230ms | 1.6s |

## Key Observations

- **CLS: 0 across all pages** — no layout shift issues. Excellent.
- **LCP range: 2.1s–7.1s** — product page is slowest (7.1s), likely due to image loading. Homepage and banner page need improvement (3.9s, 4.4s). Google threshold: <2.5s good, 2.5–4.0s needs improvement, >4.0s poor.
- **TBT range: 230ms–1,800ms** — coroplast and homepage have heavy JS blocking. Google threshold: <200ms good.
- **Accessibility: 90–96** — homepage slightly lower (90), landing pages all 96.
- **Best performer:** `/business-cards-saskatoon` (89 perf, 2.1s LCP)
- **Worst performer:** `/coroplast-signs-saskatoon` (55 perf, 4.1s LCP, 1,800ms TBT)

## Thresholds for Regression Detection

After any content or code change, re-run and compare:
- If any page drops >10 points performance → investigate before shipping
- If LCP increases >1s on any ranking page → rollback
- If CLS moves above 0.1 → rollback immediately
- If accessibility drops below 90 → fix before shipping

## Next Measurement

Re-measure after Phase 18 schema/alt-text deploy (same 7 pages).
Schedule monthly re-measurement on SEO check dates.
