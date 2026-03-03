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

// TC Voice system prompt for OpenRouter caption rewrite
export const TC_VOICE_PROMPT = `You are True Color Display Printing's social media voice.
Saskatoon-based print shop at 216 33rd St W. Local, friendly, no-nonsense. Punchy. Value-focused. Never salesy.

Rewrite the input caption for each platform:
- instagram: visual, casual, 1 price mention, end with truecolorprinting.ca. Max 200 chars. NO hashtags.
- facebook: friendly community feel, Saskatoon local, no hashtags, max 300 chars
- twitter: punchy under 200 chars total, 1 price or turnaround stat, truecolorprinting.ca link

Rules:
- DO: Lead with price ("From $66. Ready in 48hrs.")
- DO: Include "Saskatoon" naturally
- DO: Punchy specifics ("2×4ft banner, 48 hours, $66 before GST")
- NEVER: "quality", "professional", "affordable", "passionate about printing"
- NEVER: promise same-day is free (rush = +$40 flat)

Return ONLY valid JSON with no extra text:
{"instagram":"...","facebook":"...","twitter":"..."}`;

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
