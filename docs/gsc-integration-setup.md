# GSC Integration — One-Time Setup

Pulls Google Search Console data into Supabase for the SEO dashboard + skill recommendations.

## Status

| Piece | Where | Built? |
|---|---|---|
| GSC client | `src/lib/seo/gsc-client.ts` | yes |
| Daily sync route | `src/app/api/cron/gsc-sync/route.ts` | yes |
| Historical backfill route | `src/app/api/cron/gsc-backfill/route.ts` | yes |
| Supabase tables | `migrations/add_seo_gsc_snapshots.sql` | migration written, NOT applied |
| GitHub Actions cron | `.github/workflows/cron-gsc-sync.yml` (13:30 UTC daily) | yes |
| Service account on GCP | — | **TODO (manual, see below)** |
| Env vars on Railway | — | **TODO (manual, see below)** |
| Staff dashboard | `/staff/seo` | Wave 2 |

## Step 1 — Apply the Supabase migration

Two ways:

**A. Supabase Studio (easiest):**
1. Open https://supabase.com/dashboard/project/dczbgraekmzirxknjvwe/sql/new
2. Paste contents of `migrations/add_seo_gsc_snapshots.sql`
3. Run

**B. Supabase CLI:**
```bash
cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator"
supabase link --project-ref dczbgraekmzirxknjvwe
supabase db push migrations/add_seo_gsc_snapshots.sql
```

> **Note (2026-05-09):** Service-account auth was tried first but Google Search Console
> rejects service accounts on personal Gmail-owned properties with "email not found".
> We pivoted to OAuth refresh-token auth. Steps 2–4 below describe the OAuth flow.

## Step 2 — Create the Google Cloud service account (~5 min)

1. Open https://console.cloud.google.com/projectcreate
2. Project name: `true-color-seo` → Create
3. Once created, in the new project: open https://console.cloud.google.com/apis/library/searchconsole.googleapis.com → Enable
4. Open https://console.cloud.google.com/iam-admin/serviceaccounts → Create Service Account
   - Name: `gsc-reader`
   - Role: skip (no project roles needed — we grant access on the GSC side)
   - Done
5. Click the new service account → Keys → Add Key → JSON → download
6. The downloaded JSON has `client_email` (looks like `gsc-reader@true-color-seo.iam.gserviceaccount.com`). Copy it.

## Step 3 — Grant the service account access to GSC

1. Open https://search.google.com/search-console
2. Select the `truecolorprinting.ca` property
3. Settings (gear icon) → Users and permissions → Add user
4. Paste the service-account email
5. Permission: **Restricted** (read-only is enough)
6. Add

## Step 4 — Add Railway env vars

```bash
cd "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator"
# Paste the entire JSON file contents as one line. Railway accepts multi-line values
# in its UI, but for the CLI, the JSON must be one line.
railway variables set GOOGLE_SERVICE_ACCOUNT_JSON="$(cat ~/Downloads/true-color-seo-*.json | jq -c .)"
railway variables set GSC_SITE_URL="sc-domain:truecolorprinting.ca"
```

The `sc-domain:` prefix is correct for **Domain** properties. If the GSC property is **URL-prefix** instead, use `https://truecolorprinting.ca/` (with trailing slash). Check the property type at the top of the GSC sidebar.

## Step 5 — Deploy + verify

```bash
git add migrations/add_seo_gsc_snapshots.sql \
        src/lib/seo/gsc-client.ts \
        src/app/api/cron/gsc-sync \
        src/app/api/cron/gsc-backfill \
        .github/workflows/cron-gsc-sync.yml \
        package.json package-lock.json \
        docs/gsc-integration-setup.md
git commit -m "feat(seo): GSC → Supabase pipeline (cron + backfill routes)"
git push
```

After Railway redeploys (~2 min):

```bash
# Test the daily sync (pulls last 7 days)
curl -H "Authorization: Bearer $CRON_SECRET" \
     https://truecolorprinting.ca/api/cron/gsc-sync

# Expect: {"ok":true,"dateFrom":"...","dateTo":"...","rowsPulled":N,"rowsUpserted":N}
```

If that works, run the historical backfill once (16 months of data):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
     "https://truecolorprinting.ca/api/cron/gsc-backfill?days=480"
```

This takes 5–10 min. Watch the Railway logs for `[gsc-backfill]` messages.

## Step 6 — Verify in Supabase

```sql
-- Total rows
SELECT COUNT(*), MIN(snapshot_date), MAX(snapshot_date) FROM seo_gsc_snapshots;

-- Page-2 opportunities (positions 11–20, last 28 days, sorted by impressions)
SELECT query, page, ROUND(AVG(position)::numeric, 1) AS pos,
       SUM(impressions) AS imp, SUM(clicks) AS clicks
FROM seo_gsc_snapshots
WHERE snapshot_date >= CURRENT_DATE - INTERVAL '28 days'
GROUP BY query, page
HAVING AVG(position) BETWEEN 11 AND 20
ORDER BY SUM(impressions) DESC
LIMIT 25;
```

## Cron timing

`.github/workflows/cron-gsc-sync.yml` curls `/api/cron/gsc-sync` at 13:30 UTC daily
(07:30 AM Saskatchewan), matching the existing `cron-keepalive.yml` pattern.

GSC data has a ~2-3 day lag, so the sync targets the 7-day window ending 3 days before today.

The GitHub Action uses the repo secret `CRON_SECRET` (already set — same one used by
`cron-keepalive.yml`). No extra setup needed.

To run on demand: GitHub → Actions → "GSC Daily Sync" → Run workflow.

## Wave 2 (next)

Build `/staff/seo` dashboard with three views:
- Page-2 keywords (positions 11–20, sorted by impressions × CTR-gap)
- High-impression / low-CTR pages → title-rewrite candidates
- Decay alerts → pages dropping rank vs. 30-day baseline

Then a `/tc seo-opportunities` slash command that reads from this data and routes to `/paa-faq`, `/truecolor-page`, or title-rewrite per `seo-protected-pages.md` decay rule.
