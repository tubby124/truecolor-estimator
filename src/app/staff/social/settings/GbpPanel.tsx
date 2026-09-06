"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Status = { connected: boolean; configured: boolean; enabled: boolean; error?: string; checkedAt?: string; publishCapability?: string; connection?: { location_title: string; location_name: string; location_address?: { addressLines: string[]; locality: string; administrativeArea: string; postalCode: string }; last_verified_at: string | null } };
type HistoryPost = { provider_post_id: string; topic_type: string; summary: string; provider_state: string; provider_created_at: string | null; read_at: string; public_url: string | null; insights_status: string; insights: unknown[] | null; insights_error: string | null; offer: unknown; event: unknown; media: unknown[] };
type History = { posts: HistoryPost[]; total: number; nextOffset: number | null; offset: number; complete: boolean; resumable: boolean; importedAt: string | null };
function safePublicUrl(value: string | null) { try { return value && new URL(value).protocol === "https:" ? value : null; } catch { return null; } }
const button = "rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold disabled:opacity-40";
export default function GbpPanel({ businessId }: { businessId: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [history, setHistory] = useState<History | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [offersOnly, setOffersOnly] = useState(true);
  const stopped = useRef(false);
  const request = useCallback(async (path: string, method = "GET") => {
    const res = await fetch(`/api/staff/social/gbp/${path}`, { method, headers: { "X-Social-Business-Id": businessId }, cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Google request failed");
    return data;
  }, [businessId]);
  const loadHistory = useCallback(async (offset = 0, offers = offersOnly) => { setHistory(await request(`history?offset=${offset}&offers=${offers}`)); }, [request, offersOnly]);
  useEffect(() => {
    let active = true;
    void request("status").then(async value => {
      if (active) setStatus(value);
      if (value.enabled) { const saved = await request("history"); if (active) setHistory(saved); }
    }).catch(error => { if (active) setMessage(error.message); });
    return () => { active = false; stopped.current = true; };
  }, [request]);
  async function refreshHealth() { setBusy(true); setMessage(""); try { setStatus(await request("status")); } catch (error) { setMessage(error instanceof Error ? error.message : "Health check failed"); } finally { setBusy(false); } }
  async function importHistory() {
    setBusy(true); stopped.current = false; setMessage("Reading actual Google posts. Each page is saved before continuing.");
    try {
      let complete = false;
      let imported = 0;
      let pages = 0;
      while (!complete && !stopped.current && pages < 25) {
        const result = await request("history", "POST");
        pages += 1; imported += result.imported; complete = result.complete;
        setMessage(result.warning || (complete ? `Import complete: ${imported} posts read this session. Per-post insights are unavailable because Google discontinued that API.` : `${imported} posts read this session. Continue or stop after this page.`));
        await loadHistory();
      }
      if (!complete) setMessage(pages >= 25 ? "Stopped at the 25-page session limit. History remains incomplete; inspect progress before resuming manually." : "Import paused. Resume uses the saved provider cursor.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Import stopped; saved pages are retained"); }
    finally { setBusy(false); }
  }
  async function changeFilter() { const next = !offersOnly; setOffersOnly(next); try { await loadHistory(0, next); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to read history"); } }
  return <section className="bg-white rounded-xl border p-6 space-y-4">
    <h2 className="font-bold">Google Business Profile</h2>
    <p className="text-sm" role="status">{status ? status.connected ? `Live listing and post read access verified ${status.checkedAt ? new Date(status.checkedAt).toLocaleString() : ""}.` : status.error || "No verified connection." : "Checking live Google access…"}</p>
    {status?.connection && <div className="bg-gray-50 p-3 rounded-lg text-sm"><strong>{status.connection.location_title}</strong><p>{status.connection.location_address?.addressLines?.join(", ")}, {status.connection.location_address?.locality} {status.connection.location_address?.administrativeArea} {status.connection.location_address?.postalCode}</p><p className="break-all text-xs mt-1">{status.connection.location_name}</p></div>}
    <p className="text-xs text-gray-600">Live read access is not publication proof. Google Cloud API approval/quota and the exact listing identity must be verified. Processing or uncertain posts require reconciliation.</p>
    <div className="flex flex-wrap gap-2">
      <button className={button} disabled={busy} onClick={refreshHealth}>Check connection</button>
      {status?.enabled && status.configured && <a className={button} href={`/api/staff/social/gbp/oauth/start?businessId=${encodeURIComponent(businessId)}`}>Connect or reconnect Google</a>}
      <button className={button} disabled={busy || !status?.connected} onClick={importHistory}>{history?.resumable ? "Resume history import" : "Import actual Google history"}</button>
      {busy && <button className={button} onClick={() => { stopped.current = true; }}>Stop after current page</button>}
    </div>
    {message && <p className="text-sm bg-amber-50 p-3 rounded-lg" role="status">{message}</p>}
    {history && <div className="space-y-4 border-t pt-4">
      <div className="flex justify-between items-center gap-3"><h3 className="font-semibold">{offersOnly ? "Actual Google offers" : "All imported Google posts"}</h3><button className={button} disabled={busy} onClick={changeFilter}>{offersOnly ? "Show all posts" : "Show offers"}</button></div>
      <p className="text-xs text-gray-600">{history.complete ? "Full pagination completed" : "Import incomplete; this is a partial view"}. {history.total} {offersOnly ? "offers" : "posts"} retained. {history.importedAt ? `Last page read ${new Date(history.importedAt).toLocaleString()}.` : "No import yet."} Newest 20 offers are reviewed for content; Google discontinued per-post insights with no replacement. Content assessment and measured outcomes remain separate.</p>
      {history.posts.length === 0 && <p className="text-sm">No imported {offersOnly ? "offers" : "posts"} to review. Historical creative files are not provider history.</p>}
      {history.posts.map(post => <article key={post.provider_post_id} className="border rounded-lg p-4 space-y-2">
        <div className="text-xs text-gray-600">{post.topic_type} · {post.provider_state} · {post.provider_created_at ? new Date(post.provider_created_at).toLocaleDateString() : "Creation date unavailable"}</div>
        <p className="whitespace-pre-wrap text-sm">{post.summary}</p>
        <p className="text-xs">Metrics: {post.insights_status === "available" ? "retained historical metrics; inspect their original dates" : "unavailable — not zero, and not evidence of failure"}.</p>
        <details className="text-xs"><summary className="cursor-pointer">Provider dates, offer terms, media and metrics</summary><pre className="overflow-x-auto whitespace-pre-wrap mt-2">{JSON.stringify({ event: post.event, offer: post.offer, media: post.media, insights: post.insights, insightsError: post.insights_error, readAt: post.read_at, providerId: post.provider_post_id }, null, 2)}</pre></details>
        {safePublicUrl(post.public_url) && <a className="text-sm underline" href={safePublicUrl(post.public_url)!} target="_blank" rel="noreferrer">Open provider post</a>}
      </article>)}
      <div className="flex gap-2"><button className={button} disabled={busy || history.offset === 0} onClick={() => { void loadHistory(Math.max(0, history.offset - 20)).catch(() => setMessage("Unable to load previous page")); }}>Previous</button><button className={button} disabled={busy || history.nextOffset === null} onClick={() => { void loadHistory(history.nextOffset ?? 0).catch(() => setMessage("Unable to load next page")); }}>Next</button></div>
    </div>}
  </section>;
}
