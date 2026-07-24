import { ExternalLink } from "lucide-react";
import { REVIEW_COUNT, RATING_VALUE } from "@/lib/reviews";
import { PaidCtaLink } from "@/components/paid/PaidProductLink";

export const VERIFIED_REVIEW_CARDS = [
  {
    name: "David Galaise",
    product: "Coroplast signs",
    quote: "My two coroplast signs came out fantastic!!",
  },
  {
    name: "LMOR",
    product: "Business cards",
    quote: "True Color provides fast affordable printing service for colour business cards.",
  },
  {
    name: "Richard Lewis",
    product: "Banners",
    quote: "hanging corporate banner and vertical product banner",
  },
] as const;

export const LICENSED_REVIEW_ROUTE =
  "https://www.google.com/maps/place/?q=place_id:ChIJ96tVovr3BFMRkfoeVs16NAA" as const;

export function PaidReviewCards() {
  return (
    <section className="border-y border-gray-200 bg-[#f5f3ef] px-4 py-12 sm:px-6 sm:py-16" aria-labelledby="paid-reviews-heading">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#c92719]">Local customer proof</p>
            <h2 id="paid-reviews-heading" className="mt-2 text-2xl font-black text-[#1c1712] sm:text-3xl">
              Google reviews from local customers
            </h2>
            <p className="mt-2 text-sm font-semibold text-gray-700">Google reviews, verified by Trustindex</p>
            <p className="mt-1 text-sm text-gray-600">{RATING_VALUE} out of 5 from {REVIEW_COUNT} Google reviews.</p>
          </div>
          <PaidCtaLink
            href={LICENSED_REVIEW_ROUTE}
            action="reviews_click"
            placement="paid_review_section"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg border border-gray-300 bg-white px-4 text-sm font-bold text-[#1c1712] transition hover:border-[#16C2F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16C2F3] focus-visible:ring-offset-2"
          >
            Read all reviews
            <ExternalLink size={15} aria-hidden="true" />
          </PaidCtaLink>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {VERIFIED_REVIEW_CARDS.map((review) => (
            <article key={review.name} className="flex min-h-52 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <span className="text-base tracking-[0.16em] text-yellow-500" role="img" aria-label="5 out of 5 stars">
                ★★★★★
              </span>
              <blockquote className="mt-4 flex-1 text-base font-semibold leading-relaxed text-[#1c1712]">
                “{review.quote}”
              </blockquote>
              <footer className="mt-5 border-t border-gray-100 pt-4">
                <p className="text-sm font-bold text-[#1c1712]">{review.name}</p>
                <p className="mt-0.5 text-xs text-gray-500">Google review · {review.product}</p>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
