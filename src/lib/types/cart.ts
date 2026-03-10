import type { EstimateResponse } from "@/lib/engine/types";
import type { QuoteEmailData } from "@/lib/email/quoteTemplate";

export interface CartItem {
  id: string;
  result: EstimateResponse;
  jobDetails: QuoteEmailData["jobDetails"];
  label: string; // e.g. "Flyers × 105 (8.5×11 in)"
}
