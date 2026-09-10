# Promoted image-search release — harness receipt

Release date: September 10, 2026. This is the sanitized, after-release receipt for the seven owner-selected catalogue images that were made visible on matching indexable Saskatoon service pages and listed in the image sitemap. It is not evidence that Google has indexed, ranked or generated sales from any image.

## Scope and channel boundary

PR [#86](https://github.com/tubby124/truecolor-estimator/pull/86) promoted the seven display leads on their existing noindex product routes. PR [#87](https://github.com/tubby124/truecolor-estimator/pull/87) separately made the same already-approved images visible on their matching canonical service page, added a source-hash-bound `site` + `imageSitemap` permission, and added the visible page/image pairs to the image sitemap.

The release deliberately leaves original product heroes, Merchant/feed image links, product data, titles, meta descriptions, H1s, URLs, canonicals, robots, structured data, prices, CTAs, internal links and sitemap `lastModified` values unchanged. The new page alts say `Illustrative`; they do not claim customer work or a completed installation.

| Service page | Asset | Source file | Raw WebP bytes | SHA-256 verified locally and live |
|---|---|---:|---:|---|
| `/aluminum-signs-saskatoon` | ACP application | 1200×900 | 162,126 | yes |
| `/business-cards-saskatoon` | Business-cards application | 1200×900 | 53,964 | yes |
| `/flyer-printing-saskatoon` | Flyers application | 1200×900 | 111,512 | yes |
| `/foamboard-printing-saskatoon` | Foamboard application | 1200×900 | 64,852 | yes |
| `/vehicle-magnets-saskatoon` | Vehicle-magnets application | 1200×900 | 47,670 | yes |
| `/banner-printing-saskatoon` | Vinyl-banners application | 1200×900 | 166,520 | yes |
| `/vinyl-lettering-saskatoon` | Vinyl-lettering overview | 1200×900 | 87,078 | yes |

All seven source files are descriptive, lowercase, hyphenated WebP files. Their raw source sizes are below the 200 KB content-image warning threshold; Next's live 256w variants were 6,140–11,947 bytes.

## Image harness readback

The exact main CI for commit `09335be24fbe11e79a8b89532a8bf723414d6941` passed: `lint-test` and `postgres-outbox-regression`; production smoke is policy-skipped. Railway deployment `dccf2d6d-ef3e-41a0-a222-21e049cccfc3` reached `SUCCESS`.

Focused application checks passed: 66 tests across image-sitemap, display-gallery and image-rights contracts; TypeScript strict check and `git diff --check` also passed. The full gallery validator has one pre-existing, unrelated failure: `gallery-vehicle-vinyl-ayotte-plumbing` records 1200×900 while the stored file is 900×1200. It neither references nor blocks any of these seven assets, but remains open rather than being hidden by this receipt.

Production browser readback at 375px, 768px and 1440px verified all seven promoted images with:

- matching descriptive alt text (all 70–85 characters, within the 10–125 character contract);
- `loading="lazy"` and `decoding="async"`, appropriate because each is below the page hero and not an LCP candidate;
- responsive `srcset` and `sizes="(max-width: 640px) 50vw, 25vw"`;
- stable 4:3 reserved boxes, with each image decoded after scroll at every checked viewport;
- 256w delivery at 375px and 768px, and 384w delivery at 1440px, matching the rendered grid width at DPR 1.

The public `image-sitemap.xml` returned exactly seven `image:image` records and each matching canonical page returned its declared image. This is live delivery and discovery-signal evidence only. No five-cold/one-warm lab LCP/CLS comparison was recreated after the already-live release, so this receipt does not make a field- or lab-performance claim. Any future image-search wave must capture that comparison before release, as required by `GALLERY-ASSURANCE.md`.

## Observation and rollback

Observe Google Search Console image data separately from web search, page traffic and commercial outcomes. Sitemap inclusion does not prove indexing. Preserve the existing single organic-experiment gate; do not bundle another indexed-page SEO mutation into this image-distribution observation.

Rollback is narrowly reversible: remove only the seven `galleryImages` bindings, their seven image-sitemap page/image entries and their exact rights entries, then verify the sitemap returns to zero records for this wave. Do not reset shared history or change original Merchant heroes.
