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
 *    → parse hash manually, call setSession() → redirect
 *    NOTE: createBrowserClient (@supabase/ssr) does NOT auto-process hashes.
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";

export default function CallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const searchParams = new URLSearchParams(window.location.search);

    // ── PKCE flow v2 (publishable key format): ?code= ──────────────────────
    // Supabase v2.97+ sends ?code= instead of ?token_hash= or #access_token=
    // The type param is included in the redirect URL (e.g. ?code=xxx&type=recovery).
    // We read type BEFORE exchangeCodeForSession to avoid a race condition where
    // onAuthStateChange fires SIGNED_IN (for existing session) before the exchange
    // finishes, incorrectly bouncing recovery users to /account instead of /account?reset=1.
    const code = searchParams.get("code");
    if (code) {
      const type = searchParams.get("type");
      supabase.auth.exchangeCodeForSession(code).then(async ({ data, error: err }) => {
        if (err) {
          // Code may already be consumed (PKCE race) — check if session exists anyway
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            window.location.replace(type === "recovery" ? "/account?reset=1" : "/account");
            return;
          }
          setError("Link expired or already used — please request a new one.");
          return;
        }
        // Fire signup-notify for brand-new Google/OAuth users (created within last 30s)
        const user = data?.session?.user;
        if (user && !type) {
          const ageMs = Date.now() - new Date(user.created_at).getTime();
          if (ageMs < 30_000) {
            const name = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? "") as string;
            fetch("/api/auth/signup-notify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: user.email, name: name || undefined }),
            }).catch(() => {});
          }
        }
        if (type === "recovery") {
          window.location.replace("/account?reset=1");
        } else if (type === "signup") {
          window.location.replace("/account?welcome=1");
        } else {
          window.location.replace("/account");
        }
      });
      return;
    }

    // ── PKCE flow v1 (Pro plan): token arrives as ?token_hash= ────────────────
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
              type === "recovery" ? "/account?reset=1" :
              type === "signup" ? "/account?welcome=1" :
              "/account"
            );
          }
        });
      return;
    }

    // ── Implicit flow: #access_token= in hash ──────────────────────────────
    // createBrowserClient (@supabase/ssr) does NOT auto-process hash params —
    // we must parse manually and call setSession() ourselves.
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const hashType = hashParams.get("type");

    if (!accessToken || !refreshToken) {
      window.location.replace("/account");
      return;
    }

    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error: err }) => {
        if (err) {
          setError("Link expired or already used — please request a new one.");
        } else if (hashType === "recovery") {
          window.location.replace("/account?reset=1");
        } else {
          window.location.replace("/account");
        }
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
