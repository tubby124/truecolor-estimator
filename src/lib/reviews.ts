/**
 * Single source of truth for Google review count.
 *
 * Update this number when new Google reviews come in.
 * Every trust badge, schema, and footer reference imports from here.
 *
 * Verify the rating/count against the live Google Business Profile. Trustindex
 * is used separately to verify the source and wording of native excerpts.
 * These constants feed existing schema.org data and on-site badges; the paid
 * landing page does not add new Review or AggregateRating schema.
 */
export const REVIEW_COUNT = 43;
export const RATING_VALUE = "4.9";
