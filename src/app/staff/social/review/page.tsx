import type { Metadata } from "next";
import { BatchApprovalReview } from "@/components/social/BatchApprovalReview";

export const metadata: Metadata = { title: "Review batch — Social Studio", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ ids?: string; batchId?: string }> }) {
  const { ids, batchId } = await searchParams;
  const postIds = [...new Set((ids || "").split(","))].filter(id => /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)).slice(0, 14);
  if (batchId && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(batchId)) return <BatchApprovalReview postIds={[]} batchId={batchId} />;
  if (!postIds.length) return <p className="p-8">Choose a draft from the social queue to review.</p>;
  return <BatchApprovalReview postIds={postIds} />;
}
