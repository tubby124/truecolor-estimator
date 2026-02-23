"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";

export function AccountClientPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleMagicLink() {
    if (!email.trim()) return;
    // TODO: POST to /api/auth/magic-link when Supabase auth is wired
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[#1c1712] mb-2">Your orders</h1>
        <p className="text-gray-500 mb-10">
          Enter your email to receive a login link — no password needed.
        </p>

        {/* Magic link form */}
        <div className="bg-[#f4efe9] rounded-2xl p-8 max-w-md mb-12">
          <h2 className="font-bold text-[#1c1712] mb-4">Access your account</h2>
          {sent ? (
            <div className="text-center py-4">
              <p className="font-semibold text-[#1c1712]">Check your inbox</p>
              <p className="text-sm text-gray-500 mt-1">
                We sent a login link to <span className="font-mono">{email}</span>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16C2F3]"
                  placeholder="you@example.com"
                />
              </div>
              <button
                onClick={handleMagicLink}
                className="w-full bg-[#16C2F3] text-white font-bold py-3 rounded-lg hover:bg-[#0fb0dd] transition-colors text-sm"
              >
                Send login link →
              </button>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3">
            We&apos;ll email you a one-click login link. No password required.
          </p>
        </div>

        {/* Help block */}
        <div className="border border-gray-100 rounded-xl p-6">
          <h2 className="font-bold text-[#1c1712] mb-3">Need help with your order?</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              📞{" "}
              <a href="tel:+13069548688" className="text-[#16C2F3] font-semibold hover:underline">
                (306) 954-8688
              </a>{" "}
              — Mon–Fri 9 AM–5 PM
            </p>
            <p>
              📧{" "}
              <a href="mailto:info@true-color.ca" className="text-[#16C2F3] font-semibold hover:underline">
                info@true-color.ca
              </a>
            </p>
            <p>📍 216 33rd St W, Saskatoon SK</p>
          </div>
          <div className="mt-5">
            <Link href="/quote" className="text-sm text-[#16C2F3] font-semibold hover:underline">
              Place a new order →
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
