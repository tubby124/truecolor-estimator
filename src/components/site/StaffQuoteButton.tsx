"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STAFF_EMAIL = "info@true-color.ca";

export function StaffQuoteButton() {
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setIsStaff(data.session?.user?.email?.toLowerCase() === STAFF_EMAIL);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsStaff(session?.user?.email?.toLowerCase() === STAFF_EMAIL);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!isStaff) return null;

  return (
    <Link
      href="/staff"
      className="bg-amber-500 text-white text-sm font-bold px-4 py-2.5 rounded-md hover:bg-amber-400 transition-colors whitespace-nowrap"
    >
      Make a Quote →
    </Link>
  );
}
