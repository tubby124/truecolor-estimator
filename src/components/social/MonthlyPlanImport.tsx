'use client';

import { useRef, useState } from 'react';
import { groupMonthPlan, parseMonthPlan, planReginaTime, prepareMonthCreative, verifyPlanFiles, type MonthPlan, type PreparedMonthCreative } from '@/lib/social/monthly-plan';

export function MonthlyPlanImport({ disabled = false, onPrepared, onBusyChange }: {
  disabled?: boolean;
  onPrepared: (month: string, creatives: PreparedMonthCreative[]) => void | Promise<void>;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [plan, setPlan] = useState<MonthPlan | null>(null);
  const [month, setMonth] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const busyRef = useRef(false);
  const readVersion = useRef(0);
  // A partial upload retry reuses every acknowledged URL and generation request ID.
  const uploaded = useRef(new Map<string, PreparedMonthCreative>());
  const groups = plan ? groupMonthPlan(plan) : {};
  const creatives = groups[month] ?? [];
  function clearAttempt() { uploaded.current.clear(); setError(''); setMessage(''); }
  async function readPackage(file?: File) {
    if (busyRef.current || disabled) return;
    const version = ++readVersion.current;
    clearAttempt(); setPlan(null); setMonth(''); setFiles([]);
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('Choose a JSON plan smaller than 1 MB. Photos are selected separately.');
      const next = parseMonthPlan(await file.text());
      if (version !== readVersion.current) return;
      setPlan(next); setMonth(Object.keys(groupMonthPlan(next))[0]);
    } catch (e) { if (version === readVersion.current) setError(e instanceof Error ? e.message : 'Could not read the local plan.'); }
  }
  async function uploadPreparation() {
    if (busyRef.current || disabled || !creatives.length) return;
    busyRef.current = true; setBusy(true); setError(''); onBusyChange?.(true);
    try {
      // Complete local hashes first: a missing or changed final photo must not cause partial uploads.
      const verified = await verifyPlanFiles(creatives, files);
      for (const creative of creatives) {
        if (uploaded.current.has(creative.id)) continue;
        setMessage(`Uploading ${uploaded.current.size + 1} of ${creatives.length} photos into preparation…`);
        const form = new FormData();
        form.append('file', verified.get(creative.id)!); form.append('format', 'jpeg'); form.append('fitForSocial', '1');
        const response = await fetch('/api/staff/social/upload', { method: 'POST', body: form });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Photo upload stopped.');
        if (typeof data.url !== 'string' || !/^https:\/\//.test(data.url)) throw new Error('Upload did not return a valid photo URL.');
        uploaded.current.set(creative.id, prepareMonthCreative(creative, data.url, crypto.randomUUID()));
      }
      await onPrepared(month, creatives.map(creative => uploaded.current.get(creative.id)!));
      setMessage(`${month} photos and captions added to preparation. Nothing has been saved as a post, approved or scheduled.`);
    } catch (e) {
      setError(`${e instanceof Error ? e.message : 'Import stopped.'} ${uploaded.current.size} confirmed uploads retained in this tab; retry reuses them. An upload whose response was lost may leave an unused storage copy; no post is created.`);
      setMessage('');
    } finally { busyRef.current = false; setBusy(false); onBusyChange?.(false); }
  }
  return <section className="space-y-3 rounded-xl border p-4" aria-label="Import prepared month">
    <h2 className="font-semibold">Import a prepared month</h2>
    <p className="text-sm">Choose a private JSON plan and its separate photos. Selecting files only reads them on this device. A plan spanning calendar months is split by Regina dates; prepare and save each month separately.</p>
    <label className="block">Prepared plan JSON <input type="file" accept=".json,application/json" disabled={disabled || busy} onChange={event => void readPackage(event.target.files?.[0])} /></label>
    {plan && <>
      <p>{plan.title} · {plan.creatives.length} creatives across {Object.keys(groups).length} Regina month(s).</p>
      <label className="block">Import month <select value={month} disabled={disabled || busy} onChange={event => { setMonth(event.target.value); clearAttempt(); }} className="border p-2">{Object.entries(groups).map(([key, items]) => <option key={key} value={key}>{key} — {items.length} creatives</option>)}</select></label>
      <label className="block">Matching original image files <input key={plan.title + plan.creatives.map(c => c.imageSha256).join('')} type="file" multiple accept="image/*" disabled={disabled || busy} onChange={event => { setFiles(Array.from(event.target.files ?? [])); clearAttempt(); }} /></label>
      <p className="text-sm">{creatives.length} creatives · {creatives.reduce((count, creative) => count + creative.channels.length, 0)} Meta destinations · {files.length} files selected. Every required image hash is checked before any upload.</p>
      <ul className="space-y-1 text-sm">{creatives.map(creative => <li key={creative.id}>{creative.title} · {planReginaTime(creative.scheduleTime).replace('T', ' ')} Regina · {creative.channels.join(' + ')} · {creative.imageFilename}{!files.some(file => file.name === creative.imageFilename) ? ' — missing file' : ' — selected; hash checked on upload'}</li>)}</ul>
      <p className="text-xs">Upload creates public preparation image URLs and fits photos for social without cropping. Review the resulting image and exact caption before saving drafts. Catalogue facts are checked again by the server during approval. This does not run caption generation or publish anything.</p>
      <button type="button" disabled={disabled || busy || !files.length || !creatives.length} onClick={() => void uploadPreparation()} className="rounded border p-3 disabled:opacity-40">{busy ? 'Checking / uploading…' : 'Upload photos into preparation'}</button>
    </>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </section>;
}
