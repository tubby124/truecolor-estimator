export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-[#16C2F3] rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading&hellip;</p>
      </div>
    </div>
  );
}
