import type { Metadata } from "next";
import NotificationListener from "@/components/staff/NotificationListener";

// Staff routes are internal tools — keep them out of search engine indexes
export const metadata: Metadata = {
  title: "True Color — Staff Estimator",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NotificationListener />
      {children}
    </>
  );
}
