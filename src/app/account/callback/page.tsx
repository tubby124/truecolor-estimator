"use client";

/**
 * /account/callback
 *
 * Handles TWO flows:
 *
 * 1. PKCE flow (future — upgrade Supabase to Pro and set Auth flow = PKCE):
 *    URL arrives as: /account/callback?token_hash=xxx&type=recovery
 *    → call verifyOtp({ token_hash, type }) → redirect
 *
 * 2. Implicit flow (free plan default):
 *    URL arrives as: /account/callback#access_token=xxx&type=recovery
 *    → Supabase SDK auto-processes the hash on createClient()
 *    → fires onAuthStateChange with PASSWORD_RECOVERY or SIGNED_IN
 *    → we redirect accordingly
 *
 * DO NOT manually call setSession() — the SDK processes the hash itself and
 * calling setSession() again causes a race condition / token-already-used error.
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";

export default function CallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // ── PKCE flow (Pro plan): token arrives as ?token_hash= ────────────────
    const searchParams = new URLSearchParams(window.location.search);
    const tokenHash = searchParams.get("token_hash");
    const type = (searchParams.get("type") ?? "email") as EmailOtpType;

    if (tokenHash) {
      supabase.auth
        .verifyOtp({ token_hash: tokenHash, type })
        .then(({ error: err }) => {
          if (err) {
            setError("Link expired or already used — please request a new one.");
          } else {
            window.location.replace(
              type === "recovery" ? "/account?reset=1" : "/account"
            );
          }
        });
      return;
    }

    // ── Implicit flow (free plan): SDK auto-processes #access_token= ───────
    // If there's no hash token, nothing to do — bounce to account page.
    if (!window.location.hash.includes("access_token=")) {
      window.location.replace("/account");
      return;
    }

    // Let the SDK handle the hash. Listen for the event it fires.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // User clicked a password reset link → send to the set-password form
        window.location.replace("/account?reset=1");
      } else if (event === "SIGNED_IN") {
        // Email confirmation link (if confirmation ever re-enabled) → account
        window.location.replace("/account");
      }
    });

    // Safety timeout: if the SDK never fires an event (invalid/expired token)
    const timeout = setTimeout(() => {
      setError("Link expired or invalid — please request a new one.");
    }, 6000);

    return () => {
      subscription.unsubscribe();
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
