# Gallery batch three — release receipt

Date: September 10, 2026. This is an intentionally narrow website-display batch for **Window Decals** and **Brochures**. Both `/products/*` routes retain `noindex,follow`; that does not exempt their shared rendering, feeds, sitemap, homepage or Merchant-consumer checks.

## Scope and retained invariants

- Each gallery keeps its existing first hero. The Window Decals hero remains the exact Merchant-cleared offer image `tc-window-decals-dba69897d9ac`; the Brochures hero remains `tc-brochures-862c2c49791a`.
- New files have versioned URLs under `public/images/products/gallery/`; no existing image is overwritten or removed.
- New illustrations are cleared only for this website display placement. They are not cleared for Merchant, feeds, image sitemap, social, ads, GBP or email. The image sitemap must remain empty.
- Product copy, metadata, schema, links, route robots, shared hero data, customer-work galleries, sitemap policy and feeds are outside this change.

## Asset selection and holds

All eight selected retained source images were visually inspected on September 10. Window Decals shows opaque cut/printed graphics on smooth glass; no transparency or perforated-film claim is made. Brochures shows tri-fold or half-fold sheets, not a new stapled-booklet claim. Explicit alt is held in the display registry and is descriptive rather than filename-derived.

Product Labels was reviewed but deliberately held: its fictional food-package artwork needs a more specific factual/public-context review before a public product example is added. Coil-bound booklets, photo posters, business cards, coroplast material-detail, postcard overview and retractable-banner material-detail remain held as recorded in the retained catalogue or earlier receipts.

## Release evidence and limits

[PR 82](https://github.com/tubby124/truecolor-estimator/pull/82) merged at `f1f7109285919f7c25d0391bfc8773a042963b86`. Its required `lint-test` jobs completed successfully. Fresh production HTTP reads returned both product pages with their five-image galleries and exact explicit alt text; checked served bytes for the Brochures and Window Decals overview images matched the delivery hashes in the asset receipt. A production browser read verified Brochures selection plus modal open/close controls.

This closes the merge and live-delivery evidence for the bounded display binding. It does not claim a field-performance sample, indexation/ranking result, conversion result, or permission to distribute these illustrations through Merchant, feeds, sitemap, social, ads, GBP or email. The original heroes, their Merchant bindings, and all shared/indexed consumers remain the rollback sources. The tracker names the next safe wave only after each new asset has independent factual and rights clearance.

## Rollback

Remove only these two display-registry cases and their new public files after reconciling any later references. Leave all existing hero, Merchant and previous-gallery entries intact; do not reset the site to an older repository revision.
