/**
 * Single source of truth for Google review count.
 *
 * Update this number when new Google reviews come in.
 * Every trust badge, schema, and footer reference imports from here.
 *
 * The homepage ReviewsSection also extracts the live count from Trustindex
 * (see fetchWidgetHtml in ReviewsSection.tsx), but these constants are used
 * for schema.org structured data, trust strips, and client components that
 * can't do server-side fetches.
 */
export const REVIEW_COUNT = 29;
export const RATING_VALUE = "5.0";
