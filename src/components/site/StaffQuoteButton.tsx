"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STAFF_EMAIL = "info@true-color.ca";

export function StaffQuoteButton() {
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // getUser() makes a verified API call — more reliable than getSession()
    // which only reads from storage and may return a stale/incomplete user object
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsStaff(user?.email?.toLowerCase() === STAFF_EMAIL);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        supabase.auth.getUser().then(({ data: { user } }) => {
          setIsStaff(user?.email?.toLowerCase() === STAFF_EMAIL);
        });
      } else {
        setIsStaff(false);
      }
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
