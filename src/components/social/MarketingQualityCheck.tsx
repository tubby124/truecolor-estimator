import { reviewMarketingCaption } from '@/lib/social/marketing-review';
import type { GenerationChannel } from '@/lib/social/generation-contract';

/** Lives beside the editable draft; never writes approval, queue or provider state. */
export function MarketingQualityCheck({ captions, channels, recentCaptions }: {
  captions: Partial<Record<GenerationChannel, string>>;
  channels: GenerationChannel[];
  recentCaptions?: Partial<Record<GenerationChannel, string[]>>;
}) {
  const reviews = channels.filter(channel => captions[channel]?.trim()).map(channel => ({
    channel, review: reviewMarketingCaption({ caption: captions[channel]!, channel, recentCaptions: recentCaptions?.[channel] }),
  }));
  if (!reviews.length) return null;
  const fixes = reviews.flatMap(({ channel, review }) => review.findings.map(finding => `${channel}: ${finding.message}`));
  return <section aria-label="Marketing quality review" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-gray-700">
    <p className="font-semibold">{fixes.length ? 'Fix copy before owner review' : 'Copy preflight complete — photo and marketing review still required'}</p>
    {fixes.length > 0 && <ul className="mt-2 list-disc pl-4">{fixes.map((fix, index) => <li key={`${index}-${fix}`}>{fix}</li>)}</ul>}
    <details className="mt-2"><summary className="cursor-pointer">Check the actual image, caption and destination</summary>
      <ul className="mt-2 list-disc pl-4">{reviews[0].review.manualChecks.map(check => <li key={check}>{check}</li>)}</ul>
      <p className="mt-2">Record specific fixes or holds and independently recheck revisions. This preflight cannot verify image fidelity, rights or likely engagement, and does not approve publication.</p>
    </details>
  </section>;
}
