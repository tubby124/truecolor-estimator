/**
 * True Color Social Studio — Hashtag library + campaign templates
 * Sourced from memory/instagram-content-system.md
 */

import type { HashtagTemplate } from "@/lib/types/social";

export const LOCAL_HASHTAGS = ['#Saskatoon', '#SaskatoonBusiness', '#SaskatoonPrinting', '#YXE'];

export const CAMPAIGN_HASHTAGS: Record<string, HashtagTemplate> = {
  'ramadan-2026': {
    local: LOCAL_HASHTAGS,
    product: ['#VinylBanners', '#PrintShop', '#CustomSigns', '#WideFormatPrint'],
    seasonal: ['#RamadanMubarak', '#EidMubarak', '#RamadanSaskatoon', '#EidSaskatoon', '#HalalBusinesses', '#MuslimBusiness'],
    audience: ['#SaskatoonRestaurants', '#SaskatoonBusiness'],
  },
  'st-patricks-2026': {
    local: LOCAL_HASHTAGS,
    product: ['#VinylBanners', '#PrintShop', '#CustomSigns', '#WideFormatPrint'],
    seasonal: ['#StPatricksDay', '#StPatricksDaySaskatoon', '#IrishPub', '#SaskatoonBars', '#GreenBanners'],
    audience: ['#SaskatoonRestaurants', '#SaskatoonBars'],
  },
  'easter-2026': {
    local: LOCAL_HASHTAGS,
    product: ['#VinylBanners', '#CoroplastSigns', '#PrintShop', '#CustomSigns'],
    seasonal: ['#HappyEaster', '#EasterSaskatoon', '#EasterBanners', '#SpringPrinting', '#EasterEvent'],
    audience: ['#SaskatoonRestaurants', '#SaskatoonRetail'],
  },
  'mothers-day-2026': {
    local: LOCAL_HASHTAGS,
    product: ['#VinylBanners', '#Flyers', '#PrintShop', '#CustomSigns'],
    seasonal: ['#MothersDay', '#HappyMothersDay', '#MothersDaySaskatoon', '#GiftIdeas', '#SaskatoonMoms'],
    audience: ['#SaskatoonRestaurants', '#SaskatoonRetail'],
  },
  'graduation-2026': {
    local: LOCAL_HASHTAGS,
    product: ['#VinylBanners', '#RetractableBanners', '#PrintShop', '#CustomSigns'],
    seasonal: ['#Graduation2026', '#GradBanners', '#ClassOf2026', '#GradSaskatoon', '#CongratsGrad', '#SaskatoonGrad'],
    audience: ['#SaskatoonBusiness', '#SaskatoonRetail'],
  },
  'agriculture-2026': {
    local: ['#Saskatchewan', '#Saskatoon', '#SaskatchewanAg', '#PrairieAg'],
    product: ['#VinylBanners', '#CoroplastSigns', '#ACPSigns', '#PrintShop'],
    seasonal: ['#AgricultureSK', '#FarmLife', '#GrainFarmer', '#AgEquipment', '#HarvestSeason'],
    audience: ['#SaskFarmers', '#SKAgricultural'],
  },
  'canada-day-2026': {
    local: LOCAL_HASHTAGS,
    product: ['#VinylBanners', '#CoroplastSigns', '#PrintShop', '#CustomSigns'],
    seasonal: ['#CanadaDay', '#HappyCanadaDay', '#CanadaDay2026', '#SaskatoonCelebration', '#CanadianPride'],
    audience: ['#SaskatoonRestaurants', '#SaskatoonRetail'],
  },
  'cfl-2026': {
    local: LOCAL_HASHTAGS,
    product: ['#VinylBanners', '#CoroplastSigns', '#PrintShop', '#CustomSigns'],
    seasonal: ['#GoRiders', '#RiderPride', '#CFL', '#Roughriders', '#GreenAndWhite', '#SaskatoonFootball'],
    audience: ['#SaskatoonRestaurants', '#SaskatoonBars'],
  },
  'back-to-school-2026': {
    local: LOCAL_HASHTAGS,
    product: ['#VinylBanners', '#CoroplastSigns', '#Flyers', '#PrintShop'],
    seasonal: ['#BackToSchool', '#BackToSchool2026', '#SaskatoonSchools', '#NewSchoolYear', '#ClassroomSigns'],
    audience: ['#SaskatoonBusiness', '#SaskatoonRetail'],
  },
};

export function getHashtagsForCampaign(slug: string): string {
  const tpl = CAMPAIGN_HASHTAGS[slug];
  if (!tpl) {
    return LOCAL_HASHTAGS.join(' ') + ' #PrintShop #VinylBanners #CustomSigns #WideFormatPrint';
  }
  const all = [...tpl.local, ...tpl.product, ...tpl.seasonal.slice(0, 5), ...tpl.audience];
  return all.slice(0, 15).join(' ');
}

// Suggested image URL pattern for each campaign + post type
export function getSuggestedImageUrl(campaignSlug: string, postType: 'launch' | 'mid' | 'last-call'): string {
  const base = 'https://truecolorprinting.ca/images/seasonal';
  // Clean slug to folder name
  const folder = campaignSlug.replace(/-2026$/, '').replace('st-patricks', 'st-patricks').replace('mothers-day', 'mothers-day');
  const fileMap: Record<string, string> = {
    launch: 'banner-traditional.png',
    mid: 'banner-modern.png',
    'last-call': 'email-header-main.png',
  };
  return `${base}/${folder}/${fileMap[postType]}`;
}

// Campaign color map (matches seed data)
export const CAMPAIGN_COLORS: Record<string, string> = {
  'ramadan-2026':         '#7c3aed',
  'st-patricks-2026':     '#16a34a',
  'graduation-2026':      '#4f46e5',
  'easter-2026':          '#ca8a04',
  'mothers-day-2026':     '#db2777',
  'agriculture-2026':     '#92400e',
  'canada-day-2026':      '#e63020',
  'cfl-2026':             '#16a34a',
  'back-to-school-2026':  '#2563eb',
};

// Full business context for AI — used in all caption generation
const TC_BUSINESS_CONTEXT = `
ABOUT TRUE COLOR DISPLAY PRINTING:
Local print shop in Saskatoon, SK (216 33rd St W). Been serving Saskatoon businesses for years.
Full-time in-house Photoshop designer — biggest differentiator vs competitors like Staples/FedEx/UPS Store who are print-only.
Same-day rush: +$40 flat (NEVER free). Standard: 48-hour turnaround. Order online at truecolorprinting.ca

PRODUCTS & PRICES (all pre-GST):
- Vinyl banners (13oz heavy-duty): From $66 (2×4ft) | $8.25/sqft (small) to $6.75/sqft (large)
- Coroplast yard signs (corrugated plastic): $8–$7.25/sqft | 4×8ft outdoor from $232
- ACP aluminum composite signs: $13–$10/sqft | durable, premium, outdoor/indoor
- Vehicle magnets: $24–$18/sqft | thick 30mil, weatherproof
- Flyers (250): 80lb gloss $110 / 100lb premium $130
- Business cards (250): $45 double-sided | fast turnaround
- Retractable banners: Starting ~$110 | portable, trade show ready
- Window decals, stickers, foam board displays, postcards, brochures, photo posters, magnet calendars
- Graphic design: $35 flat for standard layouts | full custom from scratch | same-day proofs included

WHO WE SERVE: Restaurants, bars, retailers, farms, construction, healthcare, events, sports teams — any Saskatoon business that needs something printed.

DIFFERENTIATORS (mention naturally, not as a list):
- In-house designer builds from scratch or modifies files — most local competitors don't offer this
- We beat Staples/FedEx on price for the same product
- Local Saskatoon — you can walk in, same-day proofs, pickup or delivery`;

// Shared output instructions added to every prompt
const OUTPUT_FORMAT = `
Also output:
- hashtags: 12-15 post-specific hashtags as a single space-separated string.
  Mix: 3-4 local (#Saskatoon #YXE #SaskatoonBusiness #SaskatoonSmallBusiness),
  4-5 product-specific based on the product shown or discussed (#VinylBanners #CoroplastSigns #ACPSigns #Flyers #RetractableBanners etc),
  3-4 audience/context tags matching who this print job is for (#SaskatoonRestaurants #SaskatoonRetail #SaskatoonEvents etc).
- angle: one sentence describing the marketing strategy you used (e.g. "Product showcase — 3×6ft vinyl banner for a local restaurant, emphasizing 48hr turnaround and price")

Return ONLY valid JSON, no extra text, no markdown:
{"instagram":"...","facebook":"...","twitter":"...","hashtags":"#Saskatoon #YXE ...","angle":"..."}`;

// TC Voice system prompt for OpenRouter caption rewrite/generation
export const TC_VOICE_PROMPT = `You are True Color Display Printing's social media copywriter.
${TC_BUSINESS_CONTEXT}

BRAND VOICE: Local, direct, no-nonsense. Punchy. Lead with the value (price or turnaround). Saskatoon pride — mention the city naturally. Never salesy or corporate.
NEVER say: "quality", "professional", "affordable", "passionate about printing", "we pride ourselves"
NEVER promise same-day is free (rush is always +$40 flat)

TASK: Rewrite the provided caption for 3 platforms.
- instagram: visual, casual, 1 price or stat, end with truecolorprinting.ca, max 200 chars, NO hashtags
- facebook: friendly Saskatoon community feel, no hashtags, max 300 chars
- twitter: punchy, 1 price/turnaround fact, truecolorprinting.ca link, under 200 chars
${OUTPUT_FORMAT}`;

// Prompt used when generating from an uploaded image (vision mode)
export const TC_GENERATE_FROM_IMAGE_PROMPT = `You are True Color Display Printing's social media copywriter.
${TC_BUSINESS_CONTEXT}

TASK: You are looking at a photo of print work True Color just completed for a client. Identify what the product is (banner, sign, flyer, etc.) and who it's likely for (restaurant, retailer, farm, event, etc). Write social media captions showing off this work as an example of what True Color can do for Saskatoon businesses.

BRAND VOICE: Direct, punchy, proud of the craft. Lead with what it is + the price. Saskatoon local.
NEVER say: "quality", "professional", "affordable", "passionate"
NEVER promise same-day is free (rush = +$40 flat)

- instagram: describe the work + starting price, casual, end with truecolorprinting.ca, max 200 chars, NO hashtags
- facebook: short story about the work and who it's for, Saskatoon context, no hashtags, max 300 chars
- twitter: quick punchy callout with product + price or stat, truecolorprinting.ca, under 200 chars
${OUTPUT_FORMAT}`;

// Prompt used when generating from a topic keyword (no image, no raw caption)
export const TC_GENERATE_FROM_TOPIC_PROMPT = `You are True Color Display Printing's social media copywriter.
${TC_BUSINESS_CONTEXT}

TASK: Generate social media captions promoting the given product or topic for True Color Display Printing.

BRAND VOICE: Direct, punchy, local. Lead with price or turnaround time. Mention Saskatoon naturally.
NEVER say: "quality", "professional", "affordable", "passionate"
NEVER promise same-day is free (rush = +$40 flat)

- instagram: hook + price, casual, end with truecolorprinting.ca, max 200 chars, NO hashtags
- facebook: friendly Saskatoon community post, no hashtags, max 300 chars
- twitter: punchy + price/stat, truecolorprinting.ca, under 200 chars
${OUTPUT_FORMAT}`;

// Suggested schedule dates based on campaign event date
export function getSuggestedScheduleDate(
  eventDate: string,
  postType: 'launch' | 'mid' | 'last-call',
  email1Date?: string
): string {
  const event = new Date(eventDate);
  const now = new Date();

  switch (postType) {
    case 'launch': {
      // Same day as Email 1, or 14 days before event
      if (email1Date) return email1Date;
      const d = new Date(event);
      d.setDate(d.getDate() - 14);
      return d.toISOString().split('T')[0];
    }
    case 'mid': {
      // 7 days after launch (or ~7 days before event)
      const d = new Date(event);
      d.setDate(d.getDate() - 7);
      return d.toISOString().split('T')[0];
    }
    case 'last-call': {
      // 3-5 days before event
      const d = new Date(event);
      d.setDate(d.getDate() - 4);
      return d.toISOString().split('T')[0];
    }
  }
  return now.toISOString().split('T')[0];
}
