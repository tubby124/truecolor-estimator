// Loader for brokerage portal config JSON.
//
// One file per brokerage at ./[slug].json — keep them as JSON (not TS) so
// staff can edit pricing tiers without a code review when product catalog
// gets refined after the first few orders.

import people1stRealty from "./people-1st-realty.json";
import type { Brokerage } from "./types";

const BROKERAGES: Record<string, Brokerage> = {
  "people-1st-realty": people1stRealty as Brokerage,
};

export function getBrokerage(slug: string): Brokerage | null {
  return BROKERAGES[slug] ?? null;
}

export function listBrokerageSlugs(): string[] {
  return Object.keys(BROKERAGES);
}

export type { Brokerage } from "./types";
export type {
  BrokerageProductGroup,
  BrokerageProductOption,
} from "./types";
