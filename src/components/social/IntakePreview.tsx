"use client";

import { useId, useState } from "react";
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send, ThumbsUp } from "lucide-react";

export interface IntakePreviewProps {
  businessName: string;
  imageUrl: string;
  originalUrl?: string;
  captions: { instagram: string; facebook: string };
  scheduleTime: string;
  status: string;
  revision: number;
  mediaTreatment: string;
  expiresAt?: string;
}

function reginaTime(value: string) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "Not scheduled yet";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Regina", weekday: "short", month: "short", day: "numeric",
    year: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
  }).format(date);
}

/** Read-only proof. Approval and revision verification belong to the containing route. */
export function IntakePreview({
  businessName, imageUrl, originalUrl, captions, scheduleTime, status,
  revision, mediaTreatment, expiresAt,
}: IntakePreviewProps) {
  const headingId = useId();
  const [showOriginal, setShowOriginal] = useState(false);
  const viewingOriginal = showOriginal && Boolean(originalUrl);
  const displayedImage = viewingOriginal ? originalUrl! : imageUrl;
  const initials = businessName.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("") || "P";

  const photo = (
    <div className="bg-stone-100">
      {/* The prepared asset is shown uncropped, so the proof preserves the approved artwork. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={displayedImage} alt={`${viewingOriginal ? "Original reference" : "Prepared post image"} for ${businessName}`}
        className="block h-auto max-h-[640px] w-full object-contain" referrerPolicy="no-referrer" />
    </div>
  );
  const identity = (
    <div className="flex items-center gap-3 p-4">
      <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-xs font-bold text-stone-700">{initials}</span>
      <div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold text-stone-950">{businessName}</p><p className="text-xs text-stone-500">Post preview</p></div>
      <MoreHorizontal aria-hidden="true" className="h-5 w-5 shrink-0 text-stone-500" />
    </div>
  );

  return (
    <section aria-labelledby={headingId} className="mx-auto w-full max-w-6xl text-stone-950">
      <header className="border-b border-stone-200 pb-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="bg-stone-950 px-3 py-1.5 uppercase tracking-wider text-white">Social proof</span>
          <span className="rounded-full border border-stone-300 px-3 py-1">Revision {revision}</span>
          <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-900">{status.replace(/_/g, " ")}</span>
        </div>
        <h1 id={headingId} className="text-3xl font-semibold tracking-tight sm:text-4xl">Your next post, in view.</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">Review the prepared image and full captions below. This page is a preview; opening it does not approve or publish anything.</p>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-xs font-medium uppercase tracking-wider text-stone-500">Proposed posting time</dt><dd className="mt-1 font-medium">{reginaTime(scheduleTime)} <span className="font-normal text-stone-600">· Regina (UTC−6)</span></dd></div>
          <div><dt className="text-xs font-medium uppercase tracking-wider text-stone-500">Photo preparation</dt><dd className="mt-1 break-words">{mediaTreatment || "No image treatment specified"}</dd></div>
        </dl>
        {expiresAt && <p className="mt-4 text-xs text-stone-600">Preview link expires: {reginaTime(expiresAt)} · Regina (UTC−6)</p>}
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 py-5">
        <p role="status" className="text-sm text-stone-600">{viewingOriginal ? "Original reference only — the prepared image is the publishing asset." : "Prepared image · full captions"}</p>
        {originalUrl && <div role="group" aria-label="Compare photo versions" className="inline-flex rounded-lg border border-stone-300 bg-white p-1">
          {([false, true] as const).map((original) => <button key={String(original)} type="button" aria-pressed={viewingOriginal === original} onClick={() => setShowOriginal(original)} className={`rounded-md px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700 ${viewingOriginal === original ? "bg-stone-950 text-white" : "text-stone-600 hover:bg-stone-100"}`}>{original ? "Original" : "Prepared"}</button>)}
        </div>}
      </div>

      <div className="grid items-start gap-8 md:grid-cols-2">
        <article aria-label="Instagram approximate preview" className="min-w-0">
          <h2 className="mb-3 flex items-baseline justify-between gap-2 text-lg font-semibold">Instagram <span className="text-xs font-normal text-stone-500">Approximate preview</span></h2>
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            {identity}{photo}
            <div aria-hidden="true" className="flex gap-4 px-4 pt-4 text-stone-800"><Heart size={23} /><MessageCircle size={23} /><Send size={23} /><Bookmark size={23} className="ml-auto" /></div>
            <div className="p-4"><p className="mb-1 text-sm font-semibold">{businessName}</p><p className="whitespace-pre-wrap break-words text-sm leading-6">{captions.instagram}</p></div>
          </div>
        </article>
        <article aria-label="Facebook approximate preview" className="min-w-0">
          <h2 className="mb-3 flex items-baseline justify-between gap-2 text-lg font-semibold">Facebook <span className="text-xs font-normal text-stone-500">Approximate preview</span></h2>
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            {identity}<p className="whitespace-pre-wrap break-words px-4 pb-4 text-sm leading-6">{captions.facebook}</p>{photo}
            <div aria-hidden="true" className="flex justify-around gap-2 border-t border-stone-200 px-3 py-3 text-xs text-stone-500"><span className="flex items-center gap-1.5"><ThumbsUp size={17} />Like</span><span className="flex items-center gap-1.5"><MessageCircle size={17} />Comment</span><span className="flex items-center gap-1.5"><Send size={17} />Share</span></div>
          </div>
        </article>
      </div>
      <p className="mt-6 border-t border-stone-200 pt-4 text-xs leading-5 text-stone-600">Captions are shown in full for review. Platform layouts and feed crops may vary. Profile initials are placeholders; no engagement is simulated.</p>
    </section>
  );
}
