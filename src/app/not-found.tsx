import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#1c1712] flex flex-col items-center justify-center text-center px-6">
      <p className="text-[#16C2F3] text-sm font-semibold tracking-widest uppercase mb-4">
        404 — Page not found
      </p>
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
        That URL doesn&apos;t exist.
      </h1>
      <p className="text-gray-400 text-lg mb-10 max-w-sm">
        But your exact print price does. It&apos;s waiting for you on the estimator.
      </p>
      <Link
        href="/staff"
        className="bg-[#16C2F3] text-white font-bold px-8 py-4 rounded-md text-lg hover:bg-[#0fb0dd] transition-colors"
      >
        Get a Price →
      </Link>
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
