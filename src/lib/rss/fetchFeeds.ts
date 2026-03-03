import Parser from "rss-parser";

const parser = new Parser({
  timeout: 5000,
  headers: { "User-Agent": "TrueColorPrinting/1.0 RSS Reader" },
});

export interface FeedItem {
  title: string;
  link: string;
  excerpt: string;
  date: string;
  source: string;
}

export async function fetchFeed(url: string, limit = 3): Promise<FeedItem[]> {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.slice(0, limit).map((item) => ({
      title: item.title ?? "",
      link: item.link ?? "#",
      excerpt: (item.contentSnippet ?? item.summary ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 130),
      date: item.pubDate ?? item.isoDate ?? "",
      source: feed.title ?? "",
    }));
  } catch {
    return [];
  }
}

/** Fetch multiple feeds, merge, sort by recency, return top N items */
export async function fetchMergedFeeds(
  sources: string[],
  totalLimit = 3
): Promise<FeedItem[]> {
  const results = await Promise.all(sources.map((url) => fetchFeed(url, totalLimit)));
  return results
    .flat()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, totalLimit);
}

export function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
    return d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}
