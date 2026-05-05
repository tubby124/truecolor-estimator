# Site Structure — Hub-and-Spoke Reorg

**Date:** 2026-05-05
**Current state:** 95 public pages, flat structure, weak hub gravity
**Target:** 6 flagship hubs + organized spokes, every spoke links up

## Hub map

```
/
├── /sign-company-saskatoon        (HUB 1: all signs)
│   ├── /aluminum-signs-saskatoon
│   ├── /coroplast-signs-saskatoon
│   ├── /commercial-signs-saskatoon
│   ├── /retail-signs-saskatoon          [NEW]
│   ├── /event-signs-saskatoon
│   ├── /property-management-signs-saskatoon
│   ├── /for-lease-signs-saskatoon       [NEW]
│   ├── /real-estate-signs-saskatoon
│   ├── /agriculture-signs-saskatoon
│   ├── /agribusiness-signs-saskatchewan
│   ├── /construction-signs-saskatoon
│   ├── /trades-signs-saskatoon
│   ├── /healthcare-signs-saskatoon
│   ├── /chiropractor-signs-saskatoon
│   ├── /dental-office-signs-saskatoon
│   ├── /law-office-signs-saskatoon
│   ├── /pharmacy-signs-saskatoon
│   ├── /education-signs-saskatoon
│   ├── /daycare-signs-saskatoon
│   ├── /gym-fitness-signs-saskatoon
│   ├── /restaurant-signs-saskatoon
│   ├── /hotel-signs-saskatoon
│   ├── /non-profit-signs-saskatoon
│   ├── /car-dealership-signs-saskatoon  [VERIFY EXISTS]
│   └── /election-signs
│
├── /banner-printing-saskatoon     (HUB 2: all banners)
│   ├── /event-banners
│   ├── /retractable-banners-saskatoon
│   ├── /graduation-banners-saskatoon
│   ├── /church-banners-saskatoon
│   ├── /ramadan-eid-banners-saskatoon
│   └── /trade-show-displays-saskatoon
│
├── /vehicle-graphics-saskatoon    (HUB 3: NEW — all vehicle)
│   ├── /vehicle-decals-saskatoon
│   ├── /vehicle-magnets-saskatoon
│   ├── /vehicle-lettering-saskatoon     [NEW]
│   ├── /fleet-graphics-saskatoon        [NEW]
│   └── /vehicle-wraps-saskatoon         [NEW — pending decision A/B]
│
├── /coroplast-signs-saskatoon     (HUB 4: lawn/yard/outdoor)
│   ├── /for-lease-signs-saskatoon       [shared spoke with HUB 1]
│   ├── /real-estate-signs-saskatoon     [shared spoke with HUB 1]
│   ├── /election-signs                  [shared spoke with HUB 1]
│   ├── /event-signs-saskatoon           [shared spoke with HUB 1]
│   └── /lawn-signs-saskatoon            [NEW]
│
├── /wall-graphics-saskatoon       (HUB 5: walls + windows)
│   ├── /window-perf-saskatoon
│   ├── /window-decals-saskatoon         [VERIFY]
│   └── /custom-wall-murals-saskatoon    [NEW]
│
├── /large-format-printing-saskatoon (HUB 6: posters + foam)
│   ├── /poster-printing-saskatoon
│   ├── /photo-poster-printing-saskatoon
│   ├── /foamboard-printing-saskatoon
│   └── /trade-show-displays-saskatoon  [shared with HUB 2]
│
├── /sticker-printing-saskatoon    (existing strong page — own track)
│
├── /products                       (e-commerce / quote tool)
├── /services                       (overview, link to all 6 hubs)
├── /gallery
├── /resources                      (blog)
├── /about
├── /contact
└── /quote
```

## City spokes (separate axis)

Cities each get a city-page that links DOWN to specific service spokes for that city. Already exist:

```
/signs-yorkton-sk
/signs-prince-albert-sk
/signs-moose-jaw-sk
/signs-north-battleford-sk
/coroplast-signs-prince-albert-sk
/coroplast-signs-moose-jaw-sk
/banner-printing-prince-albert-sk
/banner-printing-moose-jaw-sk
/vehicle-magnets-prince-albert-sk
/vehicle-magnets-regina
/vehicle-magnets-moose-jaw-sk
/vehicle-magnets-yorkton-sk
/business-cards-regina
/business-cards-prince-albert-sk
/business-cards-moose-jaw-sk
/flyer-printing-regina
/flyer-printing-prince-albert-sk
/flyer-printing-moose-jaw-sk
/printing-lloydminster-sk
/printing-swift-current-sk
/printing-estevan-sk
```

**Rule:** every city page must link to its parent service hub AND to the Saskatoon flagship of the same service. Currently broken on most.

## Internal linking rules

1. **Every spoke links UP to its hub** (1 link, in copy, anchor text = hub name)
2. **Every hub links DOWN to all its spokes** (in a categorized grid component)
3. **City pages link UP to service hub AND ACROSS to sister city pages** (max 4)
4. **Footer:** one block per hub with top 4 spokes
5. **Header nav:** drop "Services" generic, replace with 6 hub mega-menu

## Pages to create

| Slug | Hub | Priority | Why |
|---|---|---|---|
| /vehicle-graphics-saskatoon | NEW HUB 3 | P0 | No parent for decal/magnet/wrap orphan pages |
| /for-lease-signs-saskatoon | HUB 1+4 | P0 | "lease signage saskatchewan" 94 imp pos 8.56 |
| /vehicle-wraps-saskatoon | HUB 3 | P0 (pending decision) | Sharp Auto Trim gap |
| /vehicle-lettering-saskatoon | HUB 3 | P1 | Pos 1 query, no dedicated page |
| /fleet-graphics-saskatoon | HUB 3 | P1 | Underserved B2B niche |
| /lawn-signs-saskatoon | HUB 4 | P1 | "yard signs near me" pos 7, no page |
| /retail-signs-saskatoon | HUB 1 | P1 | Pos 14, 11 imp |
| /custom-wall-murals-saskatoon | HUB 5 | P2 | "custom wall murals saskatoon" pos 14 |

## Pages to consolidate or kill

| Slug | Action | Reason |
|---|---|---|
| /st-patricks-day-printing-saskatoon | 301 → /resources or kill | Seasonal, zero impressions |
| /mothers-day-printing-saskatoon | 301 → /resources or kill | Seasonal, zero impressions |
| /brewery-saskatoon | Demote to spoke or 301 → /products | 28 imp, pos 26 — too narrow |
| /community-printing-saskatoon | Merge into /non-profit-signs-saskatoon | Overlap |

## Schema deployment matrix

| Page type | Schema |
|---|---|
| Homepage | LocalBusiness + Organization + Service[6 hubs] |
| Hub | LocalBusiness + Service + BreadcrumbList + FAQPage |
| Service spoke | Service + Product (with offers) + BreadcrumbList + FAQPage |
| City page | LocalBusiness (areaServed) + BreadcrumbList |
| Resources / blog | Article + BreadcrumbList |
| Gallery | ImageGallery + BreadcrumbList |
| Contact | ContactPage + LocalBusiness |
