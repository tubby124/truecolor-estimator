import type { Metadata } from "next";
import { SocialSidebar } from "@/components/social/SocialSidebar";
import { RealtimeStatusRail } from "@/components/social/RealtimeStatusRail";

export const metadata: Metadata = {
  title: "Social Studio — True Color",
  robots: { index: false },
};

export default function SocialStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      <SocialSidebar />
      {/* Main content */}
      <div className="flex-1 min-w-0 bg-[#f8f8f8] lg:rounded-l-2xl overflow-hidden">
        {children}
      </div>
      <RealtimeStatusRail />
    </div>
  );
}
