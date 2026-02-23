"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dczbgraekmzirxknjvwe.supabase.co";

export function StaffQuoteButton() {
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
    const supabase = createClient(SUPABASE_URL, anonKey);

    supabase.auth.getSession().then(({ data }) => {
      setIsStaff(data.session?.user?.email === "info@true-color.ca");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsStaff(session?.user?.email === "info@true-color.ca");
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
