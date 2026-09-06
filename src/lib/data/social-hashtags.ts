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

// Caption prompts live in social/generation/prompt.ts and use server-resolved catalogue facts.
// These static hashtag templates are generic suggestions, not dated research evidence.

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
