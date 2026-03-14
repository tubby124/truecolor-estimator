"use client";

export default function StaffError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#1c1712] flex flex-col items-center justify-center text-center px-6">
      <p className="text-[#16C2F3] text-sm font-semibold tracking-widest uppercase mb-4">
        Staff portal error
      </p>
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
        Something broke.
      </h1>
      <p className="text-gray-400 text-lg mb-10 max-w-sm">
        The staff portal hit an error. Try again or head back to the dashboard.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="bg-[#16C2F3] text-white font-bold px-8 py-4 rounded-md text-lg hover:bg-[#0fb0dd] transition-colors"
        >
          Try again
        </button>
        <a
          href="/staff"
          className="border border-gray-600 text-gray-300 font-semibold px-8 py-4 rounded-md text-lg hover:border-[#16C2F3] hover:text-white transition-colors"
        >
          Back to dashboard
        </a>
      </div>
    </div>
  );
}
