"use client";

/**
 * /account/callback
 *
 * Supabase magic-link uses the IMPLICIT flow — the token arrives in the URL
 * hash fragment (#access_token=...) which is browser-only and never reaches
 * the server.  This client page reads the hash, sets the session, then
 * redirects to /account (or /account?reset=1 for password-reset links).
 */

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dczbgraekmzirxknjvwe.supabase.co";

export default function CallbackPage() {
  useEffect(() => {
    const hash = window.location.hash.slice(1); // strip leading '#'
    const params = new URLSearchParams(hash);

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token") ?? "";
    const type = params.get("type"); // "magiclink" | "recovery" | etc.

    if (!accessToken) {
      // No token in hash — just go to account page
      window.location.replace("/account");
      return;
    }

    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
    const supabase = createClient(SUPABASE_URL, anonKey);

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(() => {
        if (type === "recovery") {
          window.location.replace("/account?reset=1");
        } else {
          window.location.replace("/account");
        }
      })
      .catch(() => {
        window.location.replace("/account");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-gray-500 text-sm">Signing you in…</p>
    </div>
  );
}
