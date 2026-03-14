import type { Metadata } from "next";
import dynamic from "next/dynamic";

const BatchScheduler = dynamic(
  () => import("@/components/social/BatchScheduler").then(m => m.BatchScheduler),
  { loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded-2xl m-6" /> }
);

export const metadata: Metadata = {
  title: "Batch Schedule — Social Studio — True Color",
  robots: { index: false },
};

export default function BatchPage() {
  return <BatchScheduler />;
}
