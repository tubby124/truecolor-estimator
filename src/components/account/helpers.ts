import { ADDON_LABELS, ADDON_COLORS } from "./constants";

export function parseAddons(
  addons: string[] | null
): { label: string; count: number; colorClass: string }[] {
  if (!addons?.length) return [];
  const counts: Record<string, number> = {};
  for (const a of addons) counts[a] = (counts[a] ?? 0) + 1;
  return Object.entries(counts).map(([key, count]) => ({
    label: ADDON_LABELS[key] ?? key,
    count,
    colorClass: ADDON_COLORS[key] ?? "bg-gray-100 text-gray-600",
  }));
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
