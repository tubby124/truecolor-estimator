"use client";

/**
 * /account/callback
 *
 * Handles TWO flows:
 *
 * 1. PKCE flow (preferred, set via Supabase Dashboard → Auth → Flow type = PKCE):
 *    URL arrives as: /account/callback?token_hash=xxx&type=email
 *    → call verifyOtp({ token_hash, type }) → session stored in localStorage → redirect
 *
 * 2. Implicit flow (legacy hash fragment, only if PKCE not yet enabled):
 *    URL arrives as: /account/callback#access_token=xxx
 *    → onAuthStateChange SIGNED_IN event → redirect
 *
 * To permanently fix login, go to:
 *   Supabase Dashboard → Authentication → Sign in / Sign up → Auth flow → set to PKCE
 */

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { EmailOtpType } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dczbgraekmzirxknjvwe.supabase.co";

export default function CallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
    const supabase = createClient(SUPABASE_URL, anonKey);

    // ── PKCE flow: token arrives as a query param ───────────────────────────
    const searchParams = new URLSearchParams(window.location.search);
    const tokenHash = searchParams.get("token_hash");
    const type = (searchParams.get("type") ?? "email") as EmailOtpType;

    if (tokenHash) {
      supabase.auth
        .verifyOtp({ token_hash: tokenHash, type })
        .then(({ error: err }) => {
          if (err) {
            setError(
              `Sign-in failed: ${err.message}. The link may have expired — please request a new one.`
            );
          } else {
            window.location.replace(
              type === "recovery" ? "/account?reset=1" : "/account"
            );
          }
        });
      return; // done — no hash handling needed
    }

    // ── Implicit flow fallback: token arrives in the URL hash ──────────────
    const hash = window.location.hash;
    if (!hash.includes("access_token=")) {
      // No token at all → send to account page
      window.location.replace("/account");
      return;
    }

    const hashParams = new URLSearchParams(hash.slice(1));
    const hashType = hashParams.get("type");
    const accessToken = hashParams.get("access_token") ?? "";
    const refreshToken = hashParams.get("refresh_token") ?? "";

    // Manually call setSession and also listen for SIGNED_IN
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error: err }) => {
        if (err) {
          setError(
            `Sign-in failed: ${err.message}. Please request a new login link.`
          );
          return;
        }
        window.location.replace(
          hashType === "recovery" ? "/account?reset=1" : "/account"
        );
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="max-w-sm text-center space-y-4">
          <p className="text-red-600 font-semibold">{error}</p>
          <a
            href="/account"
            className="inline-block bg-[#16C2F3] text-white text-sm font-bold px-6 py-3 rounded-lg hover:bg-[#0fb0dd] transition-colors"
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
