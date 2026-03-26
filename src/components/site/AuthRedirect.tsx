"use client";

import { useEffect } from "react";

/**
 * Catches Supabase implicit-flow auth tokens that land on any page other than
 * /account/callback (e.g. when Supabase ignores redirect_to and falls back to
 * the site root). Forwards the full hash to the callback handler transparently.
 *
 * Handles: password recovery, magic link, email confirmation.
 */
export function AuthRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token=")) {
      window.location.replace("/account/callback" + hash);
    }
  }, []);

  return null;
}
