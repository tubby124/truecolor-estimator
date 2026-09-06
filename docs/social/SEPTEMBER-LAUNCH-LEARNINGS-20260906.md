# September launch: working lessons and checkpoint

Checkpoint: September 6, 2026, 23:07 UTC. This is a working record, updated before launch completion.

## Verified state

The owner approved the exact September 7–30 storyboard: 24 creatives, each destined for Facebook and Instagram. All 24 branded images uploaded successfully and all 48 destination drafts were saved. Independent server readback matched the approved captions, dates, business scope and all 24 final media SHA-256 hashes, with zero failures. No September destination has been approved on the server yet: the review screen reports a product-fingerprint mismatch. Investigate that mismatch before approval; do not bypass the check or silently rewrite approved copy.

Branding implementation PR54 and scheduler/monitor PR55 are merged. Merge is not proof of deployed scheduler activation. Integration owns the VPS transition after the final Sunday pilot pair is reconciled; the launch task owns September content saves and exact approvals. Private receipts retain IDs, source files and media hashes; customer artwork is not committed here.

## What worked

- A transparent TRUECOLOR / PRINTING.CA wordmark in a reviewed corner made branding feel part of the composition and exposed the website. Dark and light variants accommodate different backgrounds. Preserve the original company logo.
- Deterministic composition preserves customer artwork; inspect each corner rather than forcing one position onto every image.
- A private visual storyboard made the whole month reviewable before upload. Keep September approval separate from unscheduled October ideas.
- A plan with image hashes catches wrong files before upload. Independent readback of final uploaded bytes catches resizing or encoding differences before approval.
- Chunked saving successfully persisted all 48 destinations; retain batch IDs and resume existing work rather than recreating it.

## Friction and improvements

- The first white-footer treatment was rejected. Do not reuse it as the default branding treatment.
- Browser file selection initially failed because the extension lacked file-URL access. After the user adjusted the permission and the connection was reacquired, the documented file-chooser flow worked. Do not recreate batches because browser handles become stale.
- Local product-fact validation passed, but live approval reports different fingerprints. Local success alone is insufficient: fingerprints include runtime environment and source-model inputs. Root cause remains under investigation at this checkpoint.
- The archive caption intentionally has no sales CTA. A generic marketing-quality suggestion to add one is advisory and should not override this editorial choice.

## Still required

Resolve the fact mismatch without changing the approved creative package, record exact server approvals, hand the exact destination allowlist to integration, verify the final pilot pair, and verify the installed ongoing scheduler plus real Telegram delivery reporting. Do not call the month live or the Mac-independent workflow complete until those checks pass.
