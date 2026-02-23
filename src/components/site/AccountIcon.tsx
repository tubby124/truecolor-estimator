"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dczbgraekmzirxknjvwe.supabase.co";

export function AccountIcon() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
    const supabase = createClient(SUPABASE_URL, anonKey);
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
    });

    // Keep in sync when user signs in/out in another tab or on same page
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <Link
      href="/account"
      aria-label={loggedIn ? "My account" : "Sign in"}
      title={loggedIn ? "My account" : "Sign in"}
      className="relative flex items-center justify-center w-9 h-9 text-gray-400 hover:text-white transition-colors"
    >
      <User className="w-6 h-6" strokeWidth={1.8} />
      {loggedIn && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-black" />
      )}
    </Link>
  );
}
