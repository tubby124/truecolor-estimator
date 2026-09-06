# Full-month review, image concepts and campaign planning — September 6, 2026

Owner accepted a mix of studio treatments and authentic product/process/installation photographs. A pristine white background is an option, not a uniform requirement. This package completes the previously prepared September14–October11 four-week example with eight creative selections and16Facebook/Instagram captions. Two new GPT sample concepts are optional replacements, not additional scheduled posts. No new publication or production database write was performed by this task.

## Reviewable package

Private review: `/Users/owner/Documents/Codex/2026-09-06/truecolor-first-meta-month-private/full-month-20260906/REVIEW.html`. Source artwork, selected media hashes, exact generation prompts, fact snapshots, copy checks and the import ZIP remain outside this public repository. The page allows image/caption variant selection, local copy/date edits, matching JSON export and a clearly marked workflow rehearsal. Local edits do not record server approvals. Original source files are copied without editing; uploaded final derivatives remain a separate exact review.

Eight selections combine six authentic source photographs with two manually accepted studio revisions. The new optional generated concepts demonstrate a restaurant Thanksgiving flyer and an autumn retail window treatment. They include sample-design wording and their captions identify them as AI-generated concepts. They are not presented as completed customer jobs. The previously rejected label-sheet revision remains excluded because small printed text changed. A card slot was replaced by a genuine programme/booklet; a banner slot uses a complete freestanding display. Product bindings and copy were corrected to match the actual observed products.

The review window crosses calendar months: September contains5creatives/10destinations; October contains3/6. The API correctly saves them as separate Regina-month batches. Their shared private planning package connects the four-week review; there is no cross-month batch bypass.

## Implemented bridge into the existing app

- `/staff/social/monthly` accepts a version1`truecolor-month-plan` JSON and separately selected image files in an empty preparation. Parsing is local and does not upload. The explicit upload action verifies every selected-month file SHA-256 before any network request, retains acknowledged uploads on partial retry, then loads captions, product configuration/fingerprint and Regina dates. It does not generate, save, approve or schedule automatically. Preparation still uses existing stable chunk-save and exact destination review.
- Opt-in monthly uploads add white margins to meet platform aspect bounds without cropping or repainting the product. EXIF orientation is applied before framing, metadata is stripped, and output is JPEG. Final integer rounding is corrected with margins. Legacy upload behavior is unchanged unless`fitForSocial=1`is supplied. The source hash verifies the chosen input; approval checks the final uploaded derivative independently.
- Saved monthly review now displays read-only delivery progress, complete destination counts, a last-successful-refresh time, held errors and safe returned receipt links. It refreshes every15seconds while visible and supports manual refresh. Failed refresh preserves the prior snapshot with a stale warning. It cannot reset approval checkboxes or mutate posts. A missing or truncated database snapshot fails visibly rather than understating totals.
- Profilev4 instructs a varied month with authentic photos and studio treatments. Existing product-fidelity, rights, source-completeness and exact approval rules remain.

A lost upload response can leave an unused storage copy; it cannot create a post. Partial upload receipts live in the tab until preparation completes; completed preparation uses the existing browser persistence. Saved drafts and approvals are durable server records once activation is complete.

## Campaign planning and GPT generation

The monthly planning record should bind occasion/date/jurisdiction/source, audience, product/configuration, objective, service or offer angle, image mode, reference assets, exact prompt, generated asset provenance, proposed dates, per-channel copy and review decisions. Separate modes are KEEP original, REVISE background with fidelity check, and GENERATE illustrative concept. A reject/hold is a first-class outcome; no automatic repair of unverified artwork, QR codes or missing product edges.

Rotate across retail, restaurants, trades/construction, real estate, events/tourism, nonprofits, schools, professional services, agriculture, healthcare, sports/clubs and cultural/faith groups. Use only actual offered products and relevant campaigns; broad audience coverage does not require posting to every segment every month. New openings, seasonal menus, trade shows, registration and community events are useful non-holiday triggers. Never infer discounts, shop closures, hours, installation inclusion or guaranteed turnaround from a date or image.

Verify Saskatchewan statutory holidays separately from federal holidays and observances. September30and Boxing Day are not Saskatchewan statutory holidays merely because they are federal holidays. Remembrance Day and reconciliation-related observances default to respectful, non-sales decisions. Promotional dates should precede the event by a configurable planning lead time, not an invented production promise. Sources checked September6,2026: [Saskatchewan public holidays](https://www.saskatchewan.ca/business/employment-standards/public-statutory-holidays/list-of-saskatchewan-public-holidays), [federal general holidays](https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/vacations-holidays.html), [Saskatchewan public-service designated dates](https://taskroom.saskatchewan.ca/employee-resources/709-designated-holidays). Public-service observed/floating days are not general private-business rules.

The private calendar covers September2026–September2027 with verified statutory/observance classifications and a reusable sector matrix. This is planning data, not a live automatic campaign selector. Two concept outputs were generated with the built-in GPT image tool. The website's prior workflow uses prepared prompts/manual image handoff; this task did not discover or deploy a hosted image-generation executable.

## End-to-end monthly operating cycle

1. About three weeks before the next month, refresh product/service facts, verified dates and recent post history. Choose relevant audiences and objectives, avoiding recent image/copy repeats. Keep the planning lead time separate from actual order turnaround.
2. Assemble a complete draft calendar. Choose reusable real photos first where they fit; request a studio revision or new concept when it adds a clear purpose. Retain source/prompt/hash and quality decisions. Never classify a generated concept as a photographed customer job.
3. Prepare per-channel copy. Facebook/Instagram may share a creative with adapted captions. Select Google Business Profile deliberately for relevant offers once account access is verified; it has its own caption, destination and approval. Current JSON import selects Meta only; existing monthly UI supports deliberate Google selection.
4. Review the whole package privately, then upload the chosen images into preparation. Review the final JPEGs and save the month in durable chunks. Approve the exact image/caption/account/date per destination.
5. One VPS runner dispatches only approved due versions. Editing approval-relevant fields returns a draft to review. Uncertain/failed outcomes remain held for reconciliation; automatic retries do not guess whether a provider published.
6. During the month, monitor complete delivery state and verify returned public links. Receipt status does not prove reach or engagement. At month end, reconcile deliveries and combine available platform metrics and enquiry evidence to inform the next draft month.

## Remaining implementation and activation

The latest read-only production checkpoint at21:33UTC found business scoping and ongoing scheduling disabled, with new social REST tables unavailable. That is a REST visibility observation, not direct proof of physical table absence. The bounded Sunday pilot remains separately authorized and owned by integration.

1. Obtain exact production approval and apply the already prepared [migration package](MIGRATION-RELEASE-20260906.md), verify operator membership and activate business scope. This package also includes a structured-quote tax-policy migration; approval should not conceal that scope. No additional migration was introduced here.
2. Import and save the reviewed creative package, verify final media/destinations, then record exact approvals. Preserve existing Sunday deliveries and reconcile all six before integration replaces the pilot timer with one ongoing runner.
3. Implement a portable hosted image worker with explicit generation requests, bounded cost/concurrency, source references, durable job/output records, manual uncertainty handling and quality/owner review. A Codex image-tool demonstration is not a VPS image service. Confirm provider/model/API budget before activation; do not hide paid calls in a scheduler.
4. Connect verified holiday/audience planning to automatic monthly draft assembly. Keep publication separate from draft generation. Add end-of-month engagement/enquiry reporting once data sources are connected; no such metrics are invented by the present progress panel.

## Verification

All1,461unit tests passed locally, including32focused parser/media/monthly-API cases. TypeScript passed. Three new browser contracts passed with loopback authentication and mocked staff APIs: file-hash failure/no writes, partial-upload retry/persistence, and progress refresh/stale state without losing approval confirmations. Independent code/security review found one landscape rounding defect; fixed with a1910×1000regression. Private preview checked8cards, both concept switches, local edit persistence, matching exported filenames, workflow rehearsal,390px layout and zero external requests/errors. Required PR/main CI and exact Railway readback are recorded in release evidence after shipping.
