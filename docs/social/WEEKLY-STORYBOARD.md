# Weekly storyboard preparation

`/staff/social/weekly` is a local planning layer above the existing monthly import and exact approval flow. Choose a seven-day Regina window and only the intended posting days. Each day has a theme, audience, objective and optional catalogue offer intent. No cadence is assumed and no queue, database, scheduler or existing approval is changed.

Download the weekly JSON before leaving or reloading. It preserves the brief and completed creative metadata; it contains no image bytes. Opening another weekly file replaces the tab's plan. Keep completed business/client files private. This initial staff UI is explicitly True Color; the pure planning schema binds a business key but does not establish tenant authorization or client onboarding.

The private weekly desk's `hasan-editorial-weekly-desk` v1 True Color export can be imported directly. Choose the first date to match its first proposed day. Themes, working headlines, image approach, notes and cadence are retained. Audience, objective, catalogue offer choice and completed media still require preparation; no approval is imported. Explicit dates must match the selected seven-day window in order. Other businesses' desk exports are rejected. This bridges planning into the app without retyping the recovered themes or creating posts.

Attach an existing `truecolor-month-plan` v1 JSON containing only this week's dates, after confirming its business provenance. The old format has no business identity, so this confirmation is an operator check rather than a cryptographic binding. Attaching a replacement clears planning review. Imported weekly review flags also reset in the UI. Review the attached captions, source and matching day before export.

Export for monthly review is atomic: every enabled day must have a complete brief, planning review, and valid completed creative. Catalogue offer intent additionally requires its configuration/fact fingerprint. Missing files or facts are never replaced with fake values. Duplicate assets/dates and mismatched Regina dates are rejected. Disabled days remain in the planning JSON but are absent from the month export.

This local compiler validates structure; it does not inspect images, verify account IDs or refresh catalogue facts. Use the existing monthly importer with the real image files for hash verification, then the existing server exact review/approval for current catalogue fingerprint, media, caption, destination and date checks. A planning checkbox is not publishing approval. Cross-month weeks remain grouped by Regina month using the existing importer. The single existing scheduler remains unchanged.

The weekly brief is kept in the separate weekly file. The compatible month export retains all fields in the existing creative contract and deliberately carries no editorial metadata into scheduler records. Automated campaign assembly, engagement import and multi-business deployment remain separate work.

## Local verification — September 9, 2026

Weekly/monthly parser tests: 32 passed. Scoped ESLint, full TypeScript and project-record checks passed. Chromium contract passed for held incomplete export, completed creative export, review invalidation after brief edit, mobile width and zero staff-API mutations. A separate private local browser rehearsal downloaded the real owner desk's True Color JSON, imported all seven themes into the app and confirmed all seven remain held without creative assets. That private input/test is excluded from Git. Browser tests used loopback authentication fixtures and webpack dev mode because a shared local dependency symlink is unsupported by Turbopack. No production account, migration, queue, scheduled delivery or deployment was tested.
