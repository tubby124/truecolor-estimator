export const PRODUCT_OPTIONS = [
  "Coroplast Signs",
  "Vinyl Banners",
  "Stickers / Vinyl Decals",
  "Vehicle Decals (Die-Cut Vinyl + Install)",
  "Vehicle Magnets",
  "Window Decals / Vinyl",
  "Aluminum Composite Signs",
  "Foamboard Displays",
  "Retractable Banners",
  "Business Cards",
  "Cardstock Cards / Invitations",
  "Flyers & Brochures",
  "Coil-Bound Booklets",
  "Paper / Document Printing",
  "Magnet Calendars",
  "Installation Service",
  "Removal & Reinstall Service",
  "Graphic Design",
  "Other",
];

/**
 * Chip libraries — locked from analyzing ~350 of Albert's recent quotes.
 * These are the labels staff click to fill the spec block in one tap.
 * Values are pure suggestions — staff can type/edit anything over the top.
 */
export const MATERIAL_CHIPS: ReadonlyArray<string> = [
  "4mm Coroplast",
  "5mm Coroplast",
  "5mm Foamboard",
  "3mil Vinyl Sticker",
  "3mil White Vinyl Sticker",
  "4mil Vinyl Sticker",
  "8mil Perforated Vinyl",
  "3mm ACP",
  "10oz Vinyl Banner",
  "13oz Vinyl Banner",
  "10oz Banner + Economy Stand",
  "14pt Cardstock",
  "16pt Cardstock",
  "80lb Gloss Text",
  "100lb Cougar Cover",
  "130lb Cougar Cover",
];

export const SIDES_CHIPS: ReadonlyArray<{ label: string; value: string }> = [
  { label: "1-side", value: "One side full colour printing" },
  { label: "2-side", value: "Two side full colour printing" },
  { label: "Full colour", value: "Full colour printing" },
];

export const PROCESS_CHIPS: ReadonlyArray<string> = [
  "Gloss lamination",
  "Matte lamination",
  "Clear lamination",
  "Die cut",
  "Grommets",
  "H-stake",
  "Pre-mask transfer tape",
  "One running number",
];

/**
 * Service-line presets for the "Add fee" row.
 * The number is the starting default — staff edits per job.
 */
export const FEE_PRESETS: ReadonlyArray<{ label: string; defaultAmount: number }> = [
  { label: "Installation Fee", defaultAmount: 150 },
  { label: "Delivery Fee", defaultAmount: 60 },
  { label: "Design Fee", defaultAmount: 40 },
  { label: "Rush Fee", defaultAmount: 40 },
  { label: "Removal Service", defaultAmount: 0 },
  { label: "Parking Fee", defaultAmount: 0 },
  { label: "Custom Fee", defaultAmount: 0 },
];
