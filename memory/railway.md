# Railway Deploy Runbook — truecolor-estimator

Last updated: 2026-05-20

## Deploy basics

| Setting | Value |
|---------|-------|
| Platform | Railway (project `98b1de15-4b40-4891-a2d2-fbb2086a1fe7`) |
| Environment | `truecolordisplayprinting / production` (env id `23b4a39b-4b98-487e-97b0-0dd2c02963b6`) |
| Trigger | Auto-deploy on push to `main` (~2 min normal, up to 7 min under load) |
| Builder | Nixpacks (`railway.json`) |
| Build cmd | `npm run build` |
| Start cmd | `next start -p ${PORT:-3000}` |
| Healthcheck | `/api/health` returns `{"ok": true}` — 120s timeout, max 3 retries |
| Custom domain | `truecolorprinting.ca` → Cloudflare orange cloud → CNAME `cc0c74ro.up.railway.app` |
| Edge region | `railway/us-west2` (visible in `x-railway-edge` response header) |

## Env vars (set via `railway variables` — never commit)

Authoritative list — sync with Railway dashboard, do not hardcode anywhere.

```
NEXT_PUBLIC_SITE_URL            https://truecolorprinting.ca
NEXT_PUBLIC_SUPABASE_URL        https://dczbgraekmzirxknjvwe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   (anon, client-safe)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  (same as anon, used by middleware Edge runtime)
NEXT_PUBLIC_GST_NUMBER          731454914RT0001
SUPABASE_SECRET_KEY             (service role, server-only)
BREVO_API_KEY                   (email send via Brevo REST)
CLOVER_ECOMM_PRIVATE_KEY        (creates Clover checkout sessions)
CLOVER_MERCHANT_ID              (Clover merchant ID)
CLOVER_ENVIRONMENT              production
CLOVER_WEBHOOK_SECRET           (?k= query param on /api/webhooks/clover — fail-CLOSED if unset since 2026-05-20 e8c73a4)
PAYMENT_TOKEN_SECRET            (64 hex chars — signs HMAC payment gateway tokens)
STAFF_EMAIL                     info@true-color.ca (staff middleware gate)
WAVE_BUSINESS_ID                (Wave accounting integration)
WAVE_FULL_ACCESS_TOKEN          (Wave API)
CRON_SECRET                     (Authorization Bearer header for /api/cron/*)
RESEND_API_KEY                  (only if Resend is wired — currently NOT in use here)
N8N_WEBHOOK_SECRET              (fail-closed on social pipeline webhooks)
SMTP_BCC                        hasan.sharif.realtor@gmail.com,albert@true-color.ca
```

To fetch live: `cd /Users/owner/Downloads/TRUE\ COLOR\ PRICING\ /truecolor-estimator && railway variables --json` (requires `railway login`).

## Deploy state monitoring (no Railway CLI auth required)

Railway publishes deployment status to GitHub via the `railway-app[bot]` deployments API. Faster than the Railway dashboard for monitoring CI from the terminal.

```bash
# Recent deploys (sha + state + timing)
gh api "repos/tubby124/truecolor-estimator/deployments?per_page=5" | python3 -c "
import sys, json, subprocess
for dep in json.load(sys.stdin):
    s = json.loads(subprocess.check_output(['gh','api',f'repos/tubby124/truecolor-estimator/deployments/{dep[\"id\"]}/statuses']).decode())
    print(f'  sha={dep[\"sha\"][:7]} {s[0][\"state\"] if s else \"pending\"} created={dep[\"created_at\"]}')
"

# Watch a specific deploy until terminal state
DEP_ID=$(gh api "repos/tubby124/truecolor-estimator/deployments?per_page=1" | python3 -c "import sys,json;print(json.load(sys.stdin)[0]['id'])")
while true; do
  state=$(gh api "repos/tubby124/truecolor-estimator/deployments/$DEP_ID/statuses" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d[0]['state'] if d else 'pending')")
  echo "$(date +%H:%M:%S) $state"
  case "$state" in success|failure|error) break;; esac
  sleep 30
done
```

## DURABLE RULE — never use `next/font/google` (locked 2026-05-20)

**Self-host all webfonts via `next/font/local` with WOFF2 files committed to the repo.**

Why: `next/font/google` fetches WOFF2 from `fonts.googleapis.com` AT BUILD TIME via Turbopack. When that fetch fails for any reason — Google Fonts rate-limit, edge-CDN issue, Railway egress hiccup — the Railway build dies with:

```
next/font: error:
Failed to fetch `<Font Name>` from Google Fonts.
> Build error occurred
```

No amount of empty-commit retries reliably resolves this — three consecutive deploys on 2026-05-20 (9f0e72e, 7afb2a4, 22fbc46) all failed this way over the course of an afternoon, leaving the live site stuck on a 7-hour-old deploy.

The fix (shipped in `90661b7`): bundle the variable WOFF2 files under `src/app/fonts/` and use:

```ts
import localFont from "next/font/local";

const geistSans = localFont({
  src: "./fonts/Geist-wght.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});
```

Source files: [github.com/vercel/geist-font](https://github.com/vercel/geist-font) (OFL-licensed). Variable WOFF2 paths:
- `fonts/Geist/webfonts/Geist[wght].woff2`
- `fonts/GeistMono/webfonts/GeistMono[wght].woff2`

Both are variable-axis (weights 100-900 in a single file). Approximately 68KB + 70KB each.

This rule applies to **every Next.js app on Railway**, not just this one. Carry it forward into new projects from day one.

## Common deploy failures + fixes

| Failure pattern | Cause | Fix |
|----------------|-------|-----|
| `Failed to fetch <Font> from Google Fonts.` | `next/font/google` build-time fetch | Switch to `next/font/local` — see durable rule above |
| Failed in <30s with empty description | Railway infra glitch (queue eviction, source fetch fail) | Push an empty commit to retry: `git commit --allow-empty -m "retry"` |
| Failed at 6+ min — healthcheck timeout | `/api/health` not responding within 120s × 3 retries | Check Supabase/external API timeouts at startup; verify env vars set on Railway |
| Build succeeds but routes 404 / serve stale | Cloudflare cached HTML referencing old chunk hashes | Force-purge Cloudflare cache for `/`, `/staff/*`, or affected route |
| `tsc` error on uncommitted file | Working tree has stale edit not yet committed | `git status` — confirm broken file is uncommitted; my next commit is safe |

## Pre-deploy checklist (for non-trivial PRs)

- [ ] `npm run build` passes locally clean (warnings OK, errors not)
- [ ] `npx tsc --noEmit` passes
- [ ] No `.env*` files staged (`git status` — look for `.env*` in staged list)
- [ ] No hardcoded secrets in changed files (`grep -E "(sk_live|sb_secret|whsec_|re_)" src/`)
- [ ] If touching pricing CSVs: ran `/pricing-health` first
- [ ] If touching ranking SEO pages: checked `.claude/rules/seo-protected-pages.md`
- [ ] If touching webhooks/auth/payment: ran `tc-code-reviewer` agent
- [ ] No `next/font/google` introduced (use `next/font/local` only)

## Rollback

Railway → project dashboard → Deployments tab → previous successful deploy → "Redeploy". No CLI command for one-click rollback as of 2026-05-20. Alternative: `git revert <bad-sha> && git push`.
