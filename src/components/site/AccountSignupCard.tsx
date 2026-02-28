"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { sanitizeError } from "@/lib/errors/sanitize";

interface Props {
  email: string;
  orderNumber: string;
}

export function AccountSignupCard({ email, orderNumber }: Props) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { order_number: orderNumber },
        },
      });

      if (error) {
        setErrorMsg(sanitizeError(error));
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setErrorMsg(sanitizeError(err));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="border border-[#16C2F3]/30 rounded-2xl p-6 mb-8 bg-[#f0fbff] text-left">
        <p className="font-bold text-[#1c1712] text-base mb-3">Account created!</p>
        <Link
          href="/account"
          className="inline-block bg-[#16C2F3] text-white font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-[#0fb0dd] transition-colors"
        >
          View my orders &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-[#16C2F3]/30 rounded-2xl p-6 mb-8 bg-[#f0fbff] text-left">
      <h2 className="font-bold text-[#1c1712] text-base mb-1">Track this order anytime</h2>
      <p className="text-sm text-gray-600 mb-4">
        Create an account to see your order status and reorder in one click.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {/* Email — read-only */}
        <p className="text-sm text-gray-500 mb-3">
          Signing up as <span className="font-semibold text-[#1c1712]">{email}</span>
        </p>

        {/* Password */}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a password (min. 8 chars)"
          minLength={8}
          required
          aria-label="Password"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-[#1c1712] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16C2F3]/40 focus:border-[#16C2F3] transition mb-3"
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || password.length < 8}
          className="bg-[#16C2F3] text-white font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-[#0fb0dd] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating\u2026" : "Create account \u2192"}
        </button>

        {/* Error */}
        {errorMsg && (
          <p className="text-red-600 text-sm mt-2" role="alert">
            {errorMsg}
          </p>
        )}
      </form>
    </div>
  );
}
