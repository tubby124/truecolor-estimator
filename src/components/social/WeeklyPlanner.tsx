'use client';

import Link from 'next/link';
import { useState } from 'react';
import { attachWeekCreatives, importEditorialDesk, compileWeeklyPlan, newWeeklyPlan, parseWeeklyPlan, slotHolds, type WeeklyPlan, type WeeklySlot } from '@/lib/social/weekly-plan';

const BUSINESS = 'truecolor';
const field = 'mt-1 block w-full rounded-lg border border-stone-300 bg-white p-2 text-sm text-stone-950';
function download(value: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function useWeeklyPlanner() {
  const [start, setStart] = useState('');
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [message, setMessage] = useState('');
  const [sourceConfirmed, setSourceConfirmed] = useState(false);
  function attempt(action: () => void) { try { action(); setMessage(''); } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to read this plan.'); } }
  function update(date: string, change: Partial<WeeklySlot>) {
    setPlan(current => current && ({ ...current, slots: current.slots.map(slot => slot.date === date ? { ...slot, ...change, reviewed: change.reviewed ?? false } : slot) }));
  }
  async function read(file: File | undefined, mode: 'weekly' | 'completed' | 'desk') {
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('Choose a JSON file smaller than 1 MB.');
      const value = await file.text();
      if (mode === 'completed') {
        if (!plan || !sourceConfirmed) throw new Error('Confirm the creative package belongs to True Color first.');
        setPlan(attachWeekCreatives(plan, value));
      } else if (mode === 'desk') {
        setPlan(importEditorialDesk(value, start, BUSINESS));
      } else {
        const imported = parseWeeklyPlan(value, BUSINESS);
        // Imported review flags are planning history; inspect the package again in this session.
        setPlan({ ...imported, slots: imported.slots.map(s => ({ ...s, reviewed: false })) }); setStart(imported.weekStart);
      }
      setSourceConfirmed(false);
      setMessage('Loaded locally. Review the days below.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to read this file.'); }
  }
  return { start, setStart, plan, setPlan, message, sourceConfirmed, setSourceConfirmed, attempt, update, read };
}
export function WeeklyPlanner() {
  const { start, setStart, plan, setPlan, message, sourceConfirmed, setSourceConfirmed, attempt, update, read } = useWeeklyPlanner();
  const selected = plan?.slots.filter(s => s.enabled) ?? [];
  const held = selected.filter(s => slotHolds(s).length).length;
  return <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
    <PlannerHeader />
    <section aria-label="Plan files" className="mb-7 flex flex-wrap items-end gap-4 rounded-xl border border-stone-200 bg-white p-5">
      <label className="text-sm font-medium">First day<input className={field} type="date" value={start} disabled={!!plan} onChange={e => setStart(e.target.value)} /></label>
      <button className="rounded-lg bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-40" disabled={!!plan} onClick={() => attempt(() => setPlan(newWeeklyPlan(start, BUSINESS)))}>Start seven-day plan</button>
      <label className="text-sm font-medium">Open saved weekly plan<input aria-label="Open saved weekly plan" className="mt-2 block max-w-xs text-xs" type="file" accept=".json,application/json" onChange={e => { void read(e.target.files?.[0], 'weekly'); e.target.value = ''; }} /></label>
      <label className="text-sm font-medium">Import True Color desk export<input aria-label="Import True Color desk export" className="mt-2 block max-w-xs text-xs" type="file" disabled={!start} accept=".json,application/json" onChange={e => { void read(e.target.files?.[0], 'desk'); e.target.value = ''; }} /><span className="block text-xs font-normal text-stone-500">Set the first date to match the desk’s first proposed day.</span></label>
    </section>
    {message && <p role="status" className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">{message}</p>}
    {plan && <>
      {plan.cadenceNotes && <p className="mb-4 text-sm text-stone-600">Imported cadence: {plan.cadenceNotes}</p>}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <label className="w-full max-w-lg text-sm font-medium">Plan title<input className={field} maxLength={160} value={plan.title} onChange={e => setPlan({ ...plan, title: e.target.value })} /></label>
        <p className="text-sm text-stone-600">{selected.length} posting days · {held} held · America/Regina</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {plan.slots.map(slot => <WeeklyCard key={slot.date} slot={slot} update={update} />)}
      </div>
      <section className="mt-7 space-y-4 rounded-xl border border-stone-300 bg-white p-5" aria-label="Creative handoff">
        <h2 className="font-semibold">Attach finished work, then review the whole week</h2>
        <p className="max-w-3xl text-sm leading-6 text-stone-600">Use an existing True Color month-plan JSON containing only this week’s dates. It carries the real filenames, hashes, captions and exact times. Keep the image files for monthly import. This planner does not inspect image bytes or confirm current prices.</p>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={sourceConfirmed} onChange={e => setSourceConfirmed(e.target.checked)} />I checked that the completed creative package is for True Color.</label>
        <label className="block text-sm">Completed creative package<input className="mt-2 block max-w-full text-xs" type="file" disabled={!sourceConfirmed} accept=".json,application/json" onChange={e => { void read(e.target.files?.[0], 'completed'); e.target.value = ''; }} /></label>
        <p className="text-sm text-stone-600">Catalogue snapshots can become stale. Monthly import verifies image files; the existing server approval checks current catalogue facts and the exact destination, media, caption and date. A planning review is never publishing approval.</p>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-lg border border-stone-400 px-4 py-2 text-sm" onClick={() => attempt(() => download(parseWeeklyPlan(plan, BUSINESS), `truecolor-week-${plan.weekStart}.json`))}>Download weekly plan</button>
          <button className="rounded-lg bg-[#b8251a] px-4 py-2 text-sm text-white" onClick={() => attempt(() => download(compileWeeklyPlan(plan, BUSINESS), `truecolor-review-${plan.weekStart}.json`))}>Export for monthly review</button>
          <Link className="px-2 py-2 text-sm underline" href="/staff/social/monthly">Open monthly review</Link>
        </div>
      </section>
    </>}
  </div>;
}

function WeeklyCard({ slot, update }: { slot: WeeklySlot; update: (date: string, change: Partial<WeeklySlot>) => void }) {
  return <article key={slot.date} className={`rounded-xl border bg-white p-5 ${slot.enabled ? 'border-stone-400' : 'border-stone-200'}`}>
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-semibold text-stone-950">{new Intl.DateTimeFormat('en-CA', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'America/Regina' }).format(new Date(`${slot.date}T12:00:00-06:00`))}</h2><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={slot.enabled} onChange={e => update(slot.date, { enabled: e.target.checked })} />Posting day</label></div>
          {slot.editorialNotes && <p className="mb-4 whitespace-pre-wrap text-sm text-stone-600">{slot.editorialNotes}</p>}
          <fieldset disabled={!slot.enabled} className="space-y-3 disabled:opacity-50">
            <label className="block text-sm">Theme<input className={field} maxLength={160} placeholder="e.g. Finished work or product spotlight" value={slot.theme} onChange={e => update(slot.date, { theme: e.target.value })} /></label>
            <label className="block text-sm">Audience<input className={field} maxLength={300} placeholder="Who is this post for?" value={slot.audience} onChange={e => update(slot.date, { audience: e.target.value })} /></label>
            <label className="block text-sm">Objective<textarea className={field} maxLength={500} rows={2} placeholder="What should someone learn or do?" value={slot.objective} onChange={e => update(slot.date, { objective: e.target.value })} /></label>
            <label className="block text-sm">Offer intent<select className={field} value={slot.offerIntent} onChange={e => update(slot.date, { offerIntent: e.target.value as WeeklySlot['offerIntent'] })}><option value="none">Story, education or real work</option><option value="catalogue">Catalogue product / price offer</option></select></label>
            {slot.creative ? <div className="rounded-lg bg-stone-50 p-3 text-sm"><p className="font-medium">{slot.creative.title}</p><p className="mt-1 text-xs">{slot.creative.scheduleTime} · {slot.creative.imageFilename}</p><p className="mt-1 text-xs">Product source: {slot.creative.product?.slug ?? 'None attached'}</p><details className="mt-3"><summary>Inspect attached captions and source</summary><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(slot.creative, null, 2)}</pre></details><label className="mt-3 flex items-start gap-2"><input type="checkbox" checked={slot.reviewed} onChange={e => update(slot.date, { reviewed: e.target.checked })} />I reviewed this creative against the day’s brief.</label></div> : <p className="text-sm text-stone-500">Awaiting a completed creative package.</p>}
          </fieldset>
          {slot.enabled && <p className="mt-4 text-xs text-stone-600">{slotHolds(slot).join(' · ') || 'Ready for monthly preparation; exact approval still required.'}</p>}
        </article>;
}

function PlannerHeader() { return (
    <header className="mb-8 border-b border-stone-300 pb-7">
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#b8251a]">True Color · weekly storyboard</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">Give every post a purpose.</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">Choose your days, themes and audiences. Attach finished creative packages when they are ready, then take the complete week to monthly review.</p>
      <p className="mt-3 text-sm font-medium text-stone-800">Unscheduled · changes stay in this tab. Download your plan before leaving or reloading.</p>
    </header>
); }
