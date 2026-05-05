# Implementation Roadmap

**Date:** 2026-05-05
**Owner:** Hasan
**Stack constraints:** Next.js 16, Tailwind v4, Railway, Supabase. Use existing skills (`/truecolor-page`, `/paa-faq`, `/seo-content`, `/seo-schema`, `/gmb-update`).

## Phase 1 — Foundation (Weeks 1-4)

### Wave A — CTR rescue (Week 1)
Lowest-effort highest-yield. Page-1 zero-click pages.

| Task | File | Action |
|---|---|---|
| Title rewrite — wall-graphics | src/app/wall-graphics-saskatoon/page.tsx | "Wall Graphics Saskatoon \| From $X/sqft \| Roland UV \| True Color" |
| Title rewrite — property-management-signs | src/app/property-management-signs-saskatoon/page.tsx | inject "for lease / for rent" copy |
| Title rewrite — business-cards | src/app/business-cards-saskatoon/page.tsx | "Business Cards Saskatoon \| From $X/100 \| 1-3 Day Turn" |
| Title rewrite — vehicle-decals | src/app/vehicle-decals-saskatoon/page.tsx | price + same-day signal |
| Title rewrite — flyer-printing | src/app/flyer-printing-saskatoon/page.tsx | price floor + bulk pricing |
| Title rewrite — vehicle-magnets | src/app/vehicle-magnets-saskatoon/page.tsx | price + 1-3 day |
| Title rewrite — banner-printing | src/app/banner-printing-saskatoon/page.tsx | confirm "From $8.25/sqft" prominent |

Tool: `/seo-content [page-slug]` per page → returns rewrites.

### Wave B — Lease signage assault (Week 2)
The single highest-ROI new page.

| Task | File | Action |
|---|---|---|
| New page | src/app/for-lease-signs-saskatoon/page.tsx | Use `/truecolor-page for lease signs saskatoon` |
| Content inject | src/app/property-management-signs-saskatoon/page.tsx | Add "For Lease / For Rent" section, schema FAQ |
| Internal link | components/Footer or hub component | Add to footer + sign hub spoke list |
| Sitemap | src/app/sitemap.ts | Register new route |
| GBP post | manual | Product post for "For Lease Signs" |
| Realtor brand | brevo-realtor | Outbound campaign to commercial realtors |

### Wave C — Hub 1 rebuild: Sign Company Saskatoon (Week 3)
The flagship.

| Task | Action |
|---|---|
| Audit current page | `/seo-content sign-company-saskatoon` |
| Content rewrite | 1,500+ words, price grid for every Roland service, Roland UV machine spec callout |
| FAQ injection | `/paa-faq sign company saskatoon` → 10 Q&As with FAQPage schema |
| Internal links DOWN | grid of all 25 sign spokes, categorized (industry, use case, material) |
| Schema | LocalBusiness + Service + BreadcrumbList + FAQPage |
| Photos | 5+ Roland in-action photos, alt-text optimized |
| Build + deploy | Railway auto-deploy |

### Wave D — Hub 2-6 rebuild (Week 4)
Same pattern as Wave C, in parallel via subagents.

```
Agent 1: /banner-printing-saskatoon hub
Agent 2: /coroplast-signs-saskatoon hub
Agent 3: /wall-graphics-saskatoon hub
Agent 4: /large-format-printing-saskatoon hub
```

Vehicle hub (HUB 3) requires decision gate first — not in Phase 1.

### Phase 1 deliverables
- 7 CTR fixes shipped
- /for-lease-signs-saskatoon live + property-management refreshed
- 5 of 6 hubs rebuilt (vehicle pending decision)
- Schema validated on every modified page
- Sitemap regenerated and submitted to GSC

### Phase 1 verification
- [ ] All modified pages pass `/seo-page` audit
- [ ] All modified pages valid in validator.schema.org
- [ ] GSC URL inspection on all 7 CTR fixes (request indexing)
- [ ] Build passes, Railway deploy successful, Core Web Vitals not regressed

---

## Phase 2 — Expansion (Weeks 5-12)

### Vehicle decision gate (Week 5)
Hasan decides A or B:
- **A.** Build full vehicle wraps service + /vehicle-wraps-saskatoon hub
- **B.** Stay decals/lettering, build /vehicle-graphics-saskatoon hub with /vehicle-lettering + /fleet-graphics spokes

Either way: /vehicle-graphics-saskatoon hub gets built. Difference is the wraps subpage.

### Spoke network completion (Weeks 6-8)
| Task | Action |
|---|---|
| Internal link audit | Grep every spoke page for hub link; auto-add via component if missing |
| City page → service hub bridge | Update each city page to link to its 6 service hubs |
| Footer hub block | 6 columns, 4 spokes each |
| Header mega-menu | Replace generic /services with 6-hub dropdown |

### Spoke content depth (Weeks 9-12)
Each spoke audited via `/seo-content [slug]`:
- Word count ≥ 500
- Unique value proposition (not just hub copy duplicated)
- Price block visible above fold
- 3-5 photos
- 5+ FAQ with schema

Run weekly: 6 spokes per week × 4 weeks = 24 spokes audited and refreshed.

### Resource hub launch (Week 8)
- /resources gets a content index
- First 4 blog posts shipped (Q1 weeks 1-4 from CONTENT-CALENDAR.md)
- Article schema + Author bio (Hasan or in-house designer credentials)

### GBP push (Weeks 5-12, ongoing)
- 1 product post / week (8 over phase)
- 1 photo upload / week of Roland job
- Q&A populated for top 10 niches
- Service area expanded to all 14 secondary cities

### Phase 2 deliverables
- Vehicle hub live (A or B path)
- All 6 hubs interconnected with all spokes
- 24 spokes content-refreshed
- Resource hub live with 8 posts (weeks 1-8)
- 8 GBP product posts + 8 weekly photos

---

## Phase 3 — Scale (Weeks 13-24)

### Programmatic depth (Weeks 13-16)
- Build /sign-pricing-calculator (interactive, indexable)
- Build /banner-pricing-calculator (interactive, indexable)
- These are link magnets + GEO/AI citation magnets

### Topical authority (Weeks 17-20)
- Continue 1 blog post / week (Q2 calendar)
- Pitch local press: "Saskatoon print shop runs Roland UV" angle
- Apply for "best of saskatoon" lists (#1 local AI visibility factor per Whitespark 2026)

### Backlink campaign (Weeks 21-24)
- Industry citations: real estate boards, property mgmt associations, local chamber
- Resource pages: link to True Color blog from realtor brand site
- Local directories: NAP consistency on Yelp, Yellow Pages, Apple Maps

### Phase 3 deliverables
- 2 pricing calculators live
- 24+ blog posts total
- 5+ local "best of" lists won
- 15+ new backlinks from authoritative local sources

---

## Phase 4 — Authority (Months 7-12)

### Q3-Q4 content (Weeks 25-52)
- Continue weekly blog cadence (Q3 + Q4 calendar)
- Hub audits: re-do quarterly
- Schema: extend Product schema with offers + AggregateRating

### Geo expansion (Months 9-10)
- Decide: build out Regina + Calgary city hubs OR stay Saskatoon-focused
- If yes: full hub-and-spoke for Regina with same 6 hubs
- If no: deepen Saskatoon dominance

### Review velocity (Months 7-12)
- 2 new GBP reviews / month minimum
- Review responses within 24 hours
- Review snippet "Stories" optimized

### Phase 4 deliverables
- 52 blog posts total
- 6+ local pack rankings achieved
- 100+ GBP reviews (4.7+ avg)
- Domain authority +8 from baseline

---

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Hub rebuilds break existing rankings | Use 301 redirects, preserve URLs, add content rather than replace |
| Vehicle wraps decision delays Phase 2 | Build /vehicle-graphics hub without /vehicle-wraps subpage; ship subpage when decision made |
| Schema errors on validated pages | `/seo-schema [page]` validation gate before deploy |
| Cannibalization between for-lease + property-management | Differentiate intent: /for-lease = SIGN buyers, /property-mgmt = LANDLORD service buyers |
| GSC ranking volatility | Don't panic on 1-2 week dips; only act on 4-week trends |
| Internal team bandwidth | Use parallel agents per `/parallel-agent-workflow.md`; one wave per week is sustainable |

## Resource requirements

- Hasan: ~2 hrs/week strategy + decisions
- Designer: 4 hrs/week new page assets, GBP photos
- Claude/agents: parallel execution per wave
- External: Brevo realtor outbound for lease signs (existing capability)

## Dependencies

- Wave A → none (independent)
- Wave B → /seo-page on existing property-mgmt page first
- Wave C → Wave A complete (CTR-fixed pages link into hub)
- Wave D → Wave C pattern established
- Phase 2 vehicle hub → decision gate
- Phase 3 calculators → Phase 1+2 hubs stable

## Tracking

Weekly:
- GSC click delta vs baseline (70/28d)
- New page indexed count
- Hub audit checklist progress

Monthly:
- Position changes on 6 priority queries
- GBP impression delta
- Review count + rating

Quarterly:
- KPI review against SEO-STRATEGY.md targets
- Content calendar accountability
- Backlink growth
