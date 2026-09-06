"use client";
/* eslint-disable @next/next/no-img-element -- Short-lived private previews must bypass the shared image optimizer cache. */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { libraryReviewLabel, type LibraryPreview } from "@/lib/social/asset-library";
type LibraryResponse = { state?: string; message?: string; error?: string; collectedAt?: string; assets?: LibraryPreview[] };
export function AssetLibrary() {
  const [data, setData] = useState<LibraryResponse>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [copied, setCopied] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try { const response = await fetch("/api/staff/social/library", { cache: "no-store" }); const body = await response.json(); setData(response.ok ? body : { error: body.error || "Please sign in as staff to view the library." }); }
    catch { setData({ error: "Could not load the library. Please try again." }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const assets = data.assets ?? [];
  const visible = assets.filter(a => (!category || a.category === category) && (!source || a.sourceType === source) && [a.id, a.title, a.description, a.alt, ...a.tags].join(" ").toLowerCase().includes(query.toLowerCase()));
  async function copy(asset: LibraryPreview) {
    try { await navigator.clipboard.writeText([`Asset: ${asset.id}`, asset.title, asset.description, `Source: ${asset.sourcePage}`, `Tags: ${asset.tags.join(", ")}`, libraryReviewLabel(asset), "Collection is not approval to publish. Review exact image, caption, account and date separately."].join("\n")); setCopied(asset.id); }
    catch { setCopied("failed"); }
  }
  return <div className="min-h-screen bg-gray-50 p-4 sm:p-8 text-gray-900">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="space-y-3"><h1 className="text-2xl font-bold">Private asset library</h1><p className="max-w-3xl text-sm text-gray-600">Saved originals and source notes for future posts. Website publication does not clear an image for social use. Every asset needs rights review; each final post needs your approval.</p>
        <div className="flex flex-wrap gap-4 text-sm"><button onClick={() => void load()} className="rounded-lg border bg-white px-4 py-2" disabled={loading}>{loading ? "Loading…" : "Refresh previews"}</button><Link className="py-2 underline" href="/staff/social/batch">Open upload and batch review</Link></div>
        <p className="text-xs text-gray-500">Private previews expire after 15 minutes. Refresh to renew. Copy context shares source notes only.</p>
      </header>
      {data.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4">{data.error}</p>}
      {data.message && <p role="status" className="rounded-xl border bg-white p-4">{data.message}</p>}
      {data.state === "ready" && <>
        <div className="grid gap-3 sm:grid-cols-3"><label className="text-sm">Search photos<input className="mt-1 block w-full rounded-lg border bg-white p-3" value={query} onChange={e => setQuery(e.target.value)} placeholder="Banners, signs, asset ID…" /></label>
          <label className="text-sm">Category<select className="mt-1 block w-full rounded-lg border bg-white p-3" value={category} onChange={e => setCategory(e.target.value)}><option value="">All categories</option>{[...new Set(assets.map(a => a.category))].sort().map(c => <option key={c}>{c}</option>)}</select></label>
          <label className="text-sm">Source<select className="mt-1 block w-full rounded-lg border bg-white p-3" value={source} onChange={e => setSource(e.target.value)}><option value="">All sources</option><option value="website-gallery">Website gallery</option><option value="website-other">Other website images</option><option value="google-business-profile">Google Business Profile</option></select></label></div>
        <p className="text-sm text-gray-600">{visible.length} of {assets.length} assets · Collected {data.collectedAt ? new Date(data.collectedAt).toLocaleDateString() : "date unavailable"}</p>
        {!visible.length && <p>No assets match these filters.</p>}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{visible.map(asset => <article key={asset.id} className="overflow-hidden rounded-xl border bg-white">
          <div className="flex aspect-[4/3] items-center justify-center bg-gray-100">{asset.previewUrl ? <img src={asset.previewUrl} alt={asset.alt || asset.title} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-contain" /> : <p className="text-sm">Preview unavailable — refresh to retry.</p>}</div>
          <div className="space-y-3 p-4"><p className={`rounded px-2 py-1 text-xs font-semibold ${asset.rightsStatus === "hold" ? "bg-red-100 text-red-900" : "bg-amber-100 text-amber-900"}`}>{libraryReviewLabel(asset)}</p>
            <h2 className="font-bold">{asset.title || asset.filename}</h2><p className="text-sm text-gray-600">{asset.description}</p><p className="text-xs text-gray-500">{asset.category} · {asset.width} × {asset.height} · {asset.sourceType}</p><p className="break-all text-xs text-gray-500">ID: {asset.id}</p>
            <p className="text-xs text-gray-600">{asset.tags.join(" · ")}</p><div className="flex flex-wrap gap-4 text-sm"><a href={asset.sourcePage} target="_blank" rel="noopener noreferrer" className="underline">View source</a><button className="underline" onClick={() => void copy(asset)}>{copied === asset.id ? "Context copied" : "Copy source context"}</button></div>
          </div></article>)}</div>
      </>}
      {copied === "failed" && <p role="alert">Clipboard unavailable. You can select and copy the source notes directly.</p>}
    </div>
  </div>;
}
