"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#1c1712] flex flex-col items-center justify-center text-center px-6">
      <p className="text-[#16C2F3] text-sm font-semibold tracking-widest uppercase mb-4">
        Something went wrong
      </p>
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
        We hit a snag.
      </h1>
      <p className="text-gray-400 text-lg mb-10 max-w-sm">
        Don&apos;t worry — your cart is safe. Try again or give us a call.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="bg-[#16C2F3] text-white font-bold px-8 py-4 rounded-md text-lg hover:bg-[#0fb0dd] transition-colors"
        >
          Try again
        </button>
        <a
          href="/quote"
          className="border border-gray-600 text-gray-300 font-semibold px-8 py-4 rounded-md text-lg hover:border-[#16C2F3] hover:text-white transition-colors"
        >
          Back to products
        </a>
      </div>
      <p className="text-gray-600 mt-10 text-sm">
        Or call us:{" "}
        <a
          href="tel:+13069548688"
          className="text-gray-400 hover:text-white transition-colors"
        >
          (306) 954-8688
        </a>
      </p>
    </div>
  );
}
