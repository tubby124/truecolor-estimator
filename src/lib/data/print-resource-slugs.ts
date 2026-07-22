export const PRINT_RESOURCE_SLUGS = [
  "coroplast-sign-template-18x24",
  "die-cut-coroplast-project",
  "coroplast-vs-aluminum-composite",
  "construction-site-signage-kit",
  "trade-show-print-kit",
] as const;

const PRINT_RESOURCE_SLUG_SET: ReadonlySet<string> = new Set(
  PRINT_RESOURCE_SLUGS,
);

export function isPrintResourceSlug(slug: string): boolean {
  return PRINT_RESOURCE_SLUG_SET.has(slug);
}
