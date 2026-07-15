/**
 * Single source of truth for Google review count.
 *
 * Update this number when new Google reviews come in.
 * Every trust badge, schema, and footer reference imports from here.
 *
 * Verify both values against the paid Trustindex source before updating.
 * These constants feed schema.org structured data and every on-site badge.
 */
export const REVIEW_COUNT = 43;
export const RATING_VALUE = "4.9";
