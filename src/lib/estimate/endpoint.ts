/** Keep customer and staff estimate destinations explicit at every caller. */
export function estimateEndpoint(audience: "public" | "staff"): string {
  return audience === "staff" ? "/api/staff/estimate" : "/api/estimate";
}
