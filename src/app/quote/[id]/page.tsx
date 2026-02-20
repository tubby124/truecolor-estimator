// Phase 2 — Shareable client proof link
// GET /quote/:id → fetch saved quote from Supabase → render ProductProof
export default function QuotePage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-gray-400">Quote {params.id} — shareable links coming in Phase 2</p>
    </div>
  );
}
