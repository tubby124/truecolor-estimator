export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";

export const SUPABASE_STORAGE_URL = `${
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dczbgraekmzirxknjvwe.supabase.co"
}/storage/v1/object/public/print-files`;

export const STAFF_EMAIL = "info@true-color.ca";

export const ADDON_LABELS: Record<string, string> = {
  GROMMET: "Grommet",
  GROMMETS: "Grommets",
  H_STAKE: "H-Stake",
  H_STAKES: "H-Stakes",
  LAMINATE: "Laminate",
  MOUNTING: "Mounting",
  STAKE: "Stake",
};

export const ADDON_COLORS: Record<string, string> = {
  GROMMET: "bg-indigo-100 text-indigo-700",
  GROMMETS: "bg-indigo-100 text-indigo-700",
  H_STAKE: "bg-amber-100 text-amber-700",
  H_STAKES: "bg-amber-100 text-amber-700",
  STAKE: "bg-amber-100 text-amber-700",
  LAMINATE: "bg-teal-100 text-teal-700",
  MOUNTING: "bg-orange-100 text-orange-700",
};
