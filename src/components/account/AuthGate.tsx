"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SITE_URL, STAFF_EMAIL } from "./constants";
import type { SessionData } from "./types";

interface AuthGateProps {
  onSessionCreated: (session: SessionData) => void;
}

export function AuthGate({ onSessionCreated }: AuthGateProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signUpDone, setSignUpDone] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("signup") === "1") {
        setIsSignUp(true);
        const preEmail = params.get("email");
        if (preEmail) setEmail(decodeURIComponent(preEmail));
      }
    }
  }, []);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${SITE_URL}/account/callback` },
    });
    setGoogleLoading(false);
  }

  async function handlePasswordSignIn() {
    if (!email.trim() || !password) return;
    setPwError("");
    setPwLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      if (data.session) {
        if (data.session.user?.email?.toLowerCase() === STAFF_EMAIL) {
          router.replace("/staff/orders");
          return;
        }
        onSessionCreated(data.session as SessionData);
      }
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setPwLoading(false);
    }
  }

  async function handleSignUp() {
    if (!email.trim() || !password) return;
    if (password !== confirmPassword) {
      setPwError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    setPwError("");
    setPwLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { emailRedirectTo: `${SITE_URL}/account/callback` },
      });
      if (error) throw error;
      // Notify admin of new account (fire-and-forget — non-blocking, non-fatal)
      fetch("/api/auth/signup-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      }).catch(() => {});
      if (data.session) {
        onSessionCreated(data.session as SessionData);
      } else {
        setSignUpDone(true);
      }
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <main id="main-content" className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[#1c1712] mb-2">Your orders</h1>
        <p className="text-gray-500 mb-10">
          Sign in to track your orders, download proofs, and reorder with one click.
        </p>

        <div className="bg-[#f4efe9] rounded-2xl p-8 max-w-md mb-12">
          <h2 className="font-bold text-[#1c1712] mb-5">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </h2>

          {signUpDone ? (
            <div className="text-center py-4">
              <p className="font-semibold text-[#1c1712]">Check your inbox!</p>
              <p className="text-sm text-gray-500 mt-2">
                We sent a confirmation link to{" "}
                <span className="font-mono">{email}</span>.
              </p>
              <button
                onClick={() => {
                  setSignUpDone(false);
                  setIsSignUp(false);
                }}
                className="mt-4 text-sm text-[#16C2F3] font-semibold hover:underline"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Google sign-in */}
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading || pwLoading}
                className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-[#1c1712] bg-white hover:bg-gray-50 disabled:opacity-60 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/>
                </svg>
                {googleLoading ? "Redirecting…" : `${isSignUp ? "Sign up" : "Sign in"} with Google`}
              </button>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div>
                <label
                  className="block text-xs text-gray-500 mb-1"
                  htmlFor="pw-email"
                >
                  Email address
                </label>
                <input
                  id="pw-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label
                  className="block text-xs text-gray-500 mb-1"
                  htmlFor="pw-password"
                >
                  Password{" "}
                  {isSignUp && (
                    <span className="text-gray-400">(min 8 characters)</span>
                  )}
                </label>
                <input
                  id="pw-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !isSignUp && handlePasswordSignIn()
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                  placeholder={isSignUp ? "Choose a password" : "Your password"}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                />
              </div>
              {isSignUp && (
                <div>
                  <label
                    className="block text-xs text-gray-500 mb-1"
                    htmlFor="pw-confirm"
                  >
                    Confirm password
                  </label>
                  <input
                    id="pw-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                    placeholder="Repeat password"
                    autoComplete="new-password"
                  />
                </div>
              )}
              <button
                onClick={isSignUp ? handleSignUp : handlePasswordSignIn}
                disabled={pwLoading}
                className="w-full bg-[#16C2F3] text-white font-bold py-3 rounded-lg hover:bg-[#0fb0dd] disabled:opacity-60 transition-colors text-sm"
              >
                {pwLoading
                  ? isSignUp
                    ? "Creating account\u2026"
                    : "Signing in\u2026"
                  : isSignUp
                  ? "Create account \u2192"
                  : "Sign in \u2192"}
              </button>
              {pwError && (
                <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded px-3 py-2">
                  {pwError}
                </p>
              )}
              <div className="flex items-center justify-between pt-1">
                {!isSignUp && (
                  <Link
                    href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                    className="text-xs text-gray-400 hover:text-[#16C2F3] transition-colors"
                  >
                    Forgot password?
                  </Link>
                )}
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setPwError("");
                    setConfirmPassword("");
                  }}
                  type="button"
                  className="text-xs text-[#16C2F3] font-semibold hover:underline ml-auto"
                >
                  {isSignUp
                    ? "Already have an account? Sign in"
                    : "New here? Create account"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help block */}
        <div className="border border-gray-100 rounded-xl p-6">
          <h2 className="font-bold text-[#1c1712] mb-3">
            Need help with your order?
          </h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              📞{" "}
              <a
                href="tel:+13069548688"
                className="text-[#16C2F3] font-semibold hover:underline"
              >
                (306) 954-8688
              </a>{" "}
              &mdash; Mon&ndash;Fri 9 AM&ndash;5 PM
            </p>
            <p>
              📧{" "}
              <a
                href="mailto:info@true-color.ca"
                className="text-[#16C2F3] font-semibold hover:underline"
              >
                info@true-color.ca
              </a>
            </p>
            <p>📍 216 33rd St W, Saskatoon SK</p>
          </div>
          <div className="mt-5">
            <Link
              href="/products"
              className="text-sm text-[#16C2F3] font-semibold hover:underline"
            >
              Place a new order &rarr;
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
