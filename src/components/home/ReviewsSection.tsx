// Google Reviews — hardcoded from real verified Google reviews (True Color Display Printing)
// TODO: Replace with Trustindex.io live widget once truecolorprinting.ca domain is live
//   1. Sign up at trustindex.io → connect Google Business Profile
//   2. Copy widget ID → set NEXT_PUBLIC_TRUSTINDEX_WIDGET_ID env var
//   3. Replace static cards below with: <div data-trustindex-widget-id={process.env.NEXT_PUBLIC_TRUSTINDEX_WIDGET_ID} />

const REVIEWS = [
  {
    name: "Jay D.",
    initials: "J",
    color: "#16C2F3",
    text: "Very fast and reliable. Albert is very easy to work with. I recommend True Color Display Printing!",
    age: "1 year ago",
  },
  {
    name: "Eduardo CB",
    initials: "E",
    color: "#ED008E",
    text: "Excellent service, Always on budget and on time!",
    age: "1 year ago",
  },
  {
    name: "Lance Greene",
    initials: "L",
    color: "#8CC63E",
    text: "We have used these guys to make marketing material for our business many times and they are always extremely helpful and professional.",
    age: "1 year ago",
  },
  {
    name: "Bernie Funk",
    initials: "B",
    color: "#FBB939",
    text: "I have done a lot of business with Albert and his team, and I can honestly say that the quality of the work is outstanding. Highly recommend!",
    age: "1 year ago",
  },
  {
    name: "Richard Lewis",
    initials: "R",
    color: "#94268F",
    text: "We own a startup company in the painting tools industry, and Albert and his team have always been helpful and delivered exactly what we needed.",
    age: "1 year ago",
  },
  {
    name: "Xiao Xie",
    initials: "X",
    color: "#1c1712",
    text: "Great quality printing and excellent service! True Color Display Printing Ltd. delivered exactly what we needed on time and at a great price.",
    age: "1 year ago",
  },
];

const GOOGLE_REVIEW_URL = "https://g.page/r/CZH6HlbNejQAEAE/review";

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="#FBB939" className="w-4 h-4">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export function ReviewsSection() {
  const visibleReviews = REVIEWS.slice(0, 3);

  return (
    <section className="bg-white px-6 py-10 border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        {/* Compact header: big rating + stars + count + Google badge — all in one row */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="text-5xl font-black text-[#1c1712] leading-none">4.9</span>
          <div className="flex flex-col gap-1">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => <StarIcon key={i} />)}
            </div>
            <span className="text-sm text-gray-500">23 Google reviews</span>
          </div>
          <div className="flex items-center gap-1.5 ml-2 border border-gray-200 rounded-full px-3 py-1">
            <GoogleIcon />
            <span className="text-sm font-semibold text-gray-700">Google</span>
          </div>
        </div>

        {/* Review cards — desktop: first 3 only */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleReviews.map((r) => (
            <div
              key={r.name}
              className="border border-gray-100 rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              {/* Top row: avatar + name + Google G */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: r.color }}
                  >
                    {r.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1c1712] text-sm">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.age}</p>
                  </div>
                </div>
                <GoogleIcon />
              </div>

              {/* Stars */}
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => <StarIcon key={i} />)}
              </div>

              {/* Review text — truncated at 120 chars */}
              <p className="text-sm text-gray-600 leading-relaxed">
                {r.text.length > 120 ? r.text.slice(0, 120) + "…" : r.text}
              </p>
            </div>
          ))}
        </div>

        {/* See all reviews link */}
        <div className="mt-5 mb-6">
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[#16C2F3] hover:underline"
          >
            See all 23 reviews →
          </a>
        </div>

        {/* CTA to leave review */}
        <div className="text-center">
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#1c1712] transition-colors"
          >
            <GoogleIcon />
            <span>Happy with your order? Leave us a review →</span>
          </a>
        </div>
      </div>
    </section>
  );
}
