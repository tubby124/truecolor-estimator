import type { Platform } from "@/lib/types/social";

const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; bg: string }> = {
  instagram: { label: "IG", color: "text-[#E1306C]", bg: "bg-[#E1306C]/10" },
  facebook: { label: "FB", color: "text-[#1877F2]", bg: "bg-[#1877F2]/10" },
  twitter: { label: "X", color: "text-[#1DA1F2]", bg: "bg-[#1DA1F2]/10" },
  tiktok: { label: "TT", color: "text-white", bg: "bg-black/80" },
};

export function PlatformBadge({ platform }: { platform: Platform }) {
  const cfg = PLATFORM_CONFIG[platform];
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

export function PlatformBadges({ platforms }: { platforms: Platform[] }) {
  return (
    <span className="flex items-center gap-1 flex-wrap">
      {platforms.map((p) => (
        <PlatformBadge key={p} platform={p} />
      ))}
    </span>
  );
}
