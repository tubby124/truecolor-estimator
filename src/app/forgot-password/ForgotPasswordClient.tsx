"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";

export function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Pre-fill email if passed from the login form
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preEmail = params.get("email");
    if (preEmail) setEmail(decodeURIComponent(preEmail));
  }, []);

  // Resend cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function sendLink(emailAddr: string) {
    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email: emailAddr,
      options: { emailRedirectTo: `${SITE_URL}/account/callback` },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await sendLink(email.trim().toLowerCase());
      setSent(true);
      setCooldown(60);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    try {
      await sendLink(email.trim().toLowerCase());
      setCooldown(60);
    } catch {
      // Silent — UI already shows confirmation
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <main id="main-content" className="max-w-3xl mx-auto px-6 py-16">
        {sent ? (
          <div className="max-w-md">
            <div className="bg-[#f4efe9] rounded-2xl p-10 text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-[#16C2F3]/10 rounded-full p-4">
                  <svg
                    className="w-10 h-10 text-[#16C2F3]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-[#1c1712] mb-2">
                Check your email
              </h1>
              <p className="text-gray-500 text-sm mb-1">
                We sent a sign-in link to{" "}
                <span className="font-mono text-[#1c1712]">{email}</span>.
                Click it to sign in instantly — no password needed.
              </p>
              <p className="text-gray-400 text-xs mb-8">
                Check your spam folder if you don&apos;t see it within 2
                minutes. The link expires in 1&nbsp;hour.
              </p>

              <button
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
                className="w-full border border-gray-200 bg-white text-sm font-semibold py-2.5 rounded-lg hover:border-[#16C2F3] hover:text-[#16C2F3] disabled:opacity-50 transition-colors"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend link"}
              </button>

              <div className="mt-5">
                <Link
                  href="/account"
                  className="text-xs text-gray-400 hover:text-[#16C2F3] transition-colors"
                >
                  &larr; Back to sign in
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-md">
            <h1 className="text-3xl font-bold text-[#1c1712] mb-2">
              Get a sign-in link
            </h1>
            <p className="text-gray-500 mb-10 text-sm">
              Enter your email and we&apos;ll send you a link to sign in
              instantly — no password needed.
            </p>

            <div className="bg-[#f4efe9] rounded-2xl p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    className="block text-xs text-gray-500 mb-1"
                    htmlFor="fp-email"
                  >
                    Email address
                  </label>
                  <input
                    id="fp-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#16C2F3] text-white font-bold py-3 rounded-lg hover:bg-[#0fb0dd] disabled:opacity-60 transition-colors text-sm"
                >
                  {loading ? "Sending\u2026" : "Send sign-in link \u2192"}
                </button>

                <div className="text-center pt-1">
                  <Link
                    href="/account"
                    className="text-xs text-gray-400 hover:text-[#16C2F3] transition-colors"
                  >
                    &larr; Back to sign in
                  </Link>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
