'use client';
import { useEffect, useState } from 'react';
import type { GenerationSettings } from '@/lib/social/generation-contract';
export function GenerationUsageSettings({ businessId }: { businessId?: string }) {
  const [settings, setSettings] = useState<GenerationSettings | null>(null);
  const [message, setMessage] = useState('');
  const [calls, setCalls] = useState('20'); const [usd, setUsd] = useState(''); const [perCall, setPerCall] = useState('');
  useEffect(() => {
    fetch('/api/staff/social/generation/settings', { headers: businessId ? { 'X-Social-Business-Id': businessId } : {} }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setSettings(d); setCalls(String(d.dailyCallLimit ?? 20)); setUsd(d.dailyUsdLimit == null ? '' : String(d.dailyUsdLimit)); setPerCall(d.maxCostPerCallUsd == null ? '' : String(d.maxCostPerCallUsd)); }).catch(() => setMessage('Generation usage is unavailable.'));
  }, [businessId]);
  async function save() {
    try {
      const r = await fetch('/api/staff/social/generation/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(businessId ? { 'X-Social-Business-Id': businessId } : {}) }, body: JSON.stringify({ dailyCallLimit: Number(calls), dailyUsdLimit: usd ? Number(usd) : null, maxCostPerCallUsd: perCall ? Number(perCall) : null }) });
      const d = await r.json(); setMessage(r.ok ? 'Ceilings saved. This does not start generation.' : d.error);
    } catch { setMessage('Settings could not be saved.'); }
  }
  return <details className="rounded-lg border p-3 text-xs text-gray-600"><summary>Generation usage and limits</summary>
    {settings?.configured ? <div className="space-y-2 pt-2"><p>Today (UTC): {settings.usedCalls} calls, {settings.reservedCalls} reserved. Reported USD {Number(settings.usedUsd).toFixed(4)}; reserved USD {Number(settings.reservedUsd).toFixed(4)}. Unknown costs retain their reservation.</p>
      <label className="block">Daily provider call ceiling <input aria-label="Daily provider call ceiling" type="number" min="0" max="1000" value={calls} onChange={e => setCalls(e.target.value)} className="border rounded px-2 ml-2 w-20" /></label>
      <label className="block">Optional daily USD ceiling <input aria-label="Daily USD ceiling" type="number" value={usd} onChange={e => setUsd(e.target.value)} className="border rounded px-2 ml-2 w-24" /></label>
      <label className="block">USD reservation per call <input aria-label="USD reservation per call" type="number" value={perCall} onChange={e => setPerCall(e.target.value)} className="border rounded px-2 ml-2 w-24" /></label>
      <p>Dollar limits reserve your configured amount before each call. Actual provider billing can exceed that estimate; use the provider account limit for a hard spending cap. No automatic generation starts here.</p><button type="button" className="border rounded px-3 py-1" onClick={save}>Save limits</button></div> : settings ? <p className="pt-2">Durable generation awaits the approved migration. Existing on-demand generation remains available.</p> : null}
    {settings && <p className="pt-2">Provider {settings.providerReady ? 'key configured; paid runtime untested here' : 'not configured'} · {settings.model}</p>}{message && <p role="status">{message}</p>}
  </details>;
}
