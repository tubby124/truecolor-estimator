import type { Metadata } from "next";
import { BatchScheduler } from "@/components/social/BatchScheduler";

export const metadata: Metadata = {
  title: "Batch Schedule — Social Studio — True Color",
  robots: { index: false },
};

export default function BatchPage() {
  return <BatchScheduler />;
}
