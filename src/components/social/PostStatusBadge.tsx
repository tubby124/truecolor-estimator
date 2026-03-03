import type { PostStatus } from "@/lib/types/social";

const STATUS_CONFIG: Record<PostStatus, { label: string; dot: string; text: string; bg: string }> = {
  draft:   { label: "Draft",   dot: "bg-gray-400",    text: "text-gray-600",   bg: "bg-gray-100" },
  ready:   { label: "Ready",   dot: "bg-blue-500",    text: "text-blue-700",   bg: "bg-blue-50" },
  posting: { label: "Posting", dot: "bg-amber-400 animate-pulse", text: "text-amber-700", bg: "bg-amber-50" },
  posted:  { label: "Posted",  dot: "bg-green-500",   text: "text-green-700",  bg: "bg-green-50" },
  failed:  { label: "Failed",  dot: "bg-red-500",     text: "text-red-700",    bg: "bg-red-50" },
  skip:    { label: "Skip",    dot: "bg-gray-300",    text: "text-gray-400",   bg: "bg-gray-50" },
};

export function PostStatusBadge({ status }: { status: PostStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.text} ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
