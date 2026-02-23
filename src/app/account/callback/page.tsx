"use client";

/**
 * /account/callback
 *
 * Supabase magic-link uses the IMPLICIT flow — the token arrives in the URL
 * hash fragment (#access_token=...) which is browser-only and never reaches
 * the server.
 *
 * The Supabase JS client has detectSessionInUrl:true by default, so it
 * automatically processes the hash fragment and fires SIGNED_IN via
 * onAuthStateChange.  We just listen for that event and redirect.
 *
 * We do NOT call setSession manually — let the client handle it.
 */

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dczbgraekmzirxknjvwe.supabase.co";

export default function CallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;

    // If no access_token in hash, just send to account page
    if (!hash.includes("access_token=")) {
      window.location.replace("/account");
      return;
    }

    const type = new URLSearchParams(hash.slice(1)).get("type");
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

    // createClient with detectSessionInUrl:true (the default) automatically
    // reads #access_token=... from the URL and fires SIGNED_IN
    const supabase = createClient(SUPABASE_URL, anonKey);

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        if (type === "recovery") {
          window.location.replace("/account?reset=1");
        } else {
          window.location.replace("/account");
        }
      }
    });

    // Safety timeout — if no SIGNED_IN within 8 s, show a useful error
    const timeout = setTimeout(() => {
      setError(
        "The sign-in link has expired or was already used. Please request a new one."
      );
    }, 8000);

    return () => {
      data.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="max-w-sm text-center space-y-4">
          <p className="text-red-600 font-semibold">{error}</p>
          <a
            href="/account"
            className="inline-block text-[#16C2F3] text-sm font-semibold hover:underline"
          >
            Back to sign in &rarr;
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-2">
        <p className="text-gray-700 font-medium">Signing you in&hellip;</p>
        <p className="text-gray-400 text-sm">This takes just a second.</p>
      </div>
    </div>
  );
}
