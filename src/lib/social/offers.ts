/** Shared offer facts and deterministic channel presentation; no model computes figures. */
import { resolveProductFacts, type ProductFacts, type ProductFactsConfiguration } from '@/lib/pricing/product-facts';
import type { GbpDate, GbpPostPayload } from '@/lib/types/social';
export interface SharedOffer {
  id: string; business_id: string; product_slug: string; product_configuration: ProductFactsConfiguration;
  fact_fingerprint: string; facts: ProductFacts; title: string; image_url: string; image_sha256: string;
  terms: string; starts_on: string|null; ends_on: string|null; destination_url: string;
}
export function offerFacts(productSlug: string, configuration?: ProductFactsConfiguration) {
  return resolveProductFacts({ productSlug, configuration });
}
function date(value: string): GbpDate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Use real offer dates');
  const [year,month,day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year,month-1,day));
  if (parsed.toISOString().slice(0,10) !== value) throw new Error('Use real offer dates');
  return {year,month,day};
}
export function priceLine(facts: ProductFacts) {
  return `CAD $${facts.standalonePreTaxOrderTotal.toFixed(2)} before tax — ${facts.configurationLabel}`;
}
export function renderOffer(offer: SharedOffer) {
  const facts = offer.facts;
  if (/(?:[$€£]|\b(?:CAD|USD|save|savings|discount|free|guaranteed|cheapest|best|same.day)\b|\d)/i.test(offer.terms)) throw new Error('Terms must not introduce unsupported numeric or commercial claims');
  const price = priceLine(facts);
  const details = [facts.minimumDisclosure,offer.terms].filter(Boolean).join('\n');
  const caption = [offer.title,price,details,offer.destination_url].filter(Boolean).join('\n\n');
  let gbp: GbpPostPayload = {topicType:'STANDARD',callToAction:{actionType:'LEARN_MORE',url:offer.destination_url}};
  if (offer.starts_on || offer.ends_on) {
    if (!offer.starts_on || !offer.ends_on || offer.ends_on < offer.starts_on) throw new Error('Offer requires ordered start and end dates');
    gbp = {topicType:'OFFER',event:{title:offer.title,schedule:{startDate:date(offer.starts_on),endDate:date(offer.ends_on)}},offer:{redeemOnlineUrl:offer.destination_url,termsConditions:[price,details].filter(Boolean).join('\n')}};
  }
  // Feed captions contain a visible URL; Google uses the redemption/action field.
  return {
    caption_raw:caption, caption_instagram:caption, caption_facebook:caption,
    caption_gbp:[offer.title,price,details].filter(Boolean).join('\n\n'), gbp_payload:gbp,
    image_url:offer.image_url, image_urls:[offer.image_url], offer_id:offer.id,
    product_slug:offer.product_slug,product_configuration:offer.product_configuration,fact_fingerprint:offer.fact_fingerprint,
  };
}
/** Escape every dynamic string before SVG rendering. Only source facts supply the price. */
const xml = (value:string) => value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
function lines(value:string,width:number) {
  const words=value.split(/\s+/); const result:string[]=[]; let line='';
  for(const word of words){ if((line+' '+word).trim().length>width && line){result.push(line);line=word;}else line=(line+' '+word).trim(); }
  if(line)result.push(line); return result;
}
export function offerTemplateSvg(facts:ProductFacts) {
  const title=lines(facts.productName,42).slice(0,2);
  const config=lines(facts.configurationLabel,66).slice(0,2);
  const minimum=lines(facts.minimumDisclosure || 'Made to order. Before tax.',80).slice(0,2);
  return `<svg width="1080" height="430" xmlns="http://www.w3.org/2000/svg"><rect width="1080" height="430" fill="#f8f5ef"/><rect width="12" height="430" fill="#df5b35"/><text x="44" y="42" font-family="sans-serif" font-size="19" fill="#645c53">TRUE COLOR DISPLAY PRINTING • SASKATOON</text>${title.map((v,i)=>`<text x="44" y="${95+i*38}" font-family="sans-serif" font-size="33" font-weight="700" fill="#211c17">${xml(v)}</text>`).join('')}<text x="44" y="208" font-family="sans-serif" font-size="54" font-weight="700" fill="#211c17">CAD $${facts.standalonePreTaxOrderTotal.toFixed(2)} <tspan font-size="23">before tax</tspan></text>${config.map((v,i)=>`<text x="44" y="${254+i*28}" font-family="sans-serif" font-size="23" fill="#403830">${xml(v)}</text>`).join('')}${minimum.map((v,i)=>`<text x="44" y="${337+i*26}" font-family="sans-serif" font-size="20" fill="#645c53">${xml(v)}</text>`).join('')}<text x="44" y="408" font-family="sans-serif" font-size="21" fill="#211c17">truecolorprinting.ca</text></svg>`;
}
