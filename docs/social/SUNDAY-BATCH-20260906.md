# Sunday batch scheduling receipt — September 6, 2026

## Scope and exact owner review

Three raw library photos, each to Facebook and Instagram: art print at 09:00, decals at 13:00, storefront banner at 19:00 America/Regina. UTC times are September 6 15:00Z and 19:00Z, and September 7 01:00Z. The owner explicitly approved the revised photos, captions, artwork reuse and schedule in one batch review. The initial business-card choice was rejected as already posted; 97 feed thumbnails and 45 carousel images were compared before replacement. Video interiors and deleted/archived posts were not inspected.

The live batch UI uploaded three JPEGs without an AI call and created six separate delivery drafts in one save. Browser review showed both destinations and all three correct local times. A real staff approval saved all six content fingerprints, actor references, image checksums and rights confirmations. Protected readback confirmed six ready records, exact captions/hashtags, and valid destination approvals. Twelve legacy drafts and the two earlier published pilots remained untouched.

## Runtime verification

- Implementation PR42 merged at `cea2ceca3e51daa83268b86611169e3fb9fb4426`; independent code review approved. Main CI run `34015316084` passed, including app build, unit tests, PostgreSQL contracts and browser contracts. Sixteen Python runner tests passed.
- App deployment `494d3cbf-4c81-4d65-ad15-8b6288668e79` reported SUCCESS.
- Reviewed runner installed on the owner VPS; installed script/unit hashes matched local source. Systemd unit validation completed. The unrelated pre-existing host-unit warning was not changed.
- Scheduler and existing owner Telegram credentials were transferred through protected stdin to root-owned 0600 files. The runner has no Meta or Supabase administrator credential.
- A direct VPS Telegram connection test was acknowledged by Telegram. Scheduled notices include confirmed Facebook/Instagram links and partial/held/uncertain outcomes. This connection test was not a publication receipt.
- Read-only check from the installed dynamic-user service returned `check_waiting`, with six ready records and no hold. This was verified while publishing remained paused.
- Timer was enabled and active; initial installed-service run exited successfully with `before_window`. It runs every minute and survives the Mac being off. The first publishing window begins at 14:55Z; no new publishing calls start at or after September 7 02:00Z.

Completion/expiry prevents further publishing calls. Pending Telegram messages and read-only uncertainty recovery may continue. A held operation never automatically retries Meta. An accepted Telegram message whose acknowledgement is lost can cause a duplicate notice, not a duplicate social post.

Final hosted readback at **06:10:07 UTC** confirmed `publishingEnabled=true`, six ready deliveries, `held=false`, and exactly the three intended UTC slots. Queue totals were 12 legacy drafts, two earlier posted pilots and six ready Sunday deliveries. Configuration deployment `0d558ee4-4b47-4e12-a68a-b1f28ea2d287` reported SUCCESS. VPS journal independently recorded automatic successful `before_window` ticks at 06:08 and 06:09 UTC. The batch is armed; actual timed outcomes remain future evidence.

## Release gate observation

`gh pr merge --auto` merged immediately while checks were pending. Railway also deployed before the full main CI run finished. Do not assume either is a hard completion gate from its label or historical configuration. Publishing stayed paused until full CI passed. Future releases should explicitly wait for exact-commit checks before invoking merge; verify Railway gate behavior separately rather than claiming it enforced this release.

The browser date-fill helper initially changed the DOM value without committing React’s schedule state. Normal date-control keyboard input committed it; rendered local-time summaries and saved server timestamps were verified before approval. A visible input value alone is insufficient scheduling evidence.

## Proof still pending

No scheduled publication has occurred at this checkpoint. Unattended acceptance requires all three timed outcomes, six provider receipts/links without duplicates, Telegram delivery acknowledgements, and the owner’s report that local systems were actually off. A configured timer and successful manual pilot do not establish that proof. Read VPS journal/state, Supabase receipts and Meta after each slot; preserve partial success and reconcile holds manually. The private batch package contains exact artwork, source provenance, draft IDs and readback receipts; it is not copied into this public repository.
