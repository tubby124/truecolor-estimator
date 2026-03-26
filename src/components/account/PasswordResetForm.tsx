"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import type { SessionData } from "./types";

interface PasswordResetFormProps {
  onDone: (session: SessionData) => void;
}

export function PasswordResetForm({ onDone }: PasswordResetFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetDone, setResetDone] = useState(false);

  async function handleSetNewPassword() {
    if (!newPassword || newPassword.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }
    setResetError("");
    setResetLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setResetDone(true);
      window.history.replaceState({}, "", "/account");
      const { data } = await supabase.auth.getSession();
      if (data.session) onDone(data.session as SessionData);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <main id="main-content" className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[#1c1712] mb-2">
          Set your new password
        </h1>
        <p className="text-gray-500 mb-10">Choose a new password for your account.</p>
        <div className="bg-[#f4efe9] rounded-2xl p-8 max-w-md">
          {resetDone ? (
            <div className="text-center py-4">
              <p className="font-semibold text-[#1c1712] text-lg">
                Password updated!
              </p>
              <p className="text-sm text-gray-500 mt-2">
                You&apos;re now signed in.
              </p>
              <a
                href="/account"
                className="mt-6 inline-block bg-[#16C2F3] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#0fb0dd] transition-colors text-sm"
              >
                Go to my orders &rarr;
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label
                  className="block text-xs text-gray-500 mb-1"
                  htmlFor="newpw"
                >
                  New password{" "}
                  <span className="text-gray-400">(min 8 characters)</span>
                </label>
                <input
                  id="newpw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSetNewPassword()}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                  placeholder="Enter new password"
                  autoFocus
                />
              </div>
              <button
                onClick={handleSetNewPassword}
                disabled={resetLoading}
                className="w-full bg-[#16C2F3] text-white font-bold py-3 rounded-lg hover:bg-[#0fb0dd] disabled:opacity-60 transition-colors text-sm"
              >
                {resetLoading ? "Saving\u2026" : "Save password \u2192"}
              </button>
              {resetError && (
                <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded px-3 py-2">
                  {resetError}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
