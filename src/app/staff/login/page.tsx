"use client";

import Image from "next/image";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function StaffLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("Invalid email or password. Try again.");
      } else {
        router.push("/staff");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Call (306) 954-8688.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1c1712] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/truecolorlogo.webp"
            alt="True Color Display Printing"
            width={140}
            height={40}
            className="h-9 w-auto object-contain"
          />
        </div>

        <h1 className="text-xl font-bold text-[#1c1712] mb-1 text-center">
          Staff Access
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Sign in to the estimator
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@true-color.ca"
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#16C2F3] transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#16C2F3] transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#16C2F3] text-white font-bold py-3.5 rounded-lg hover:bg-[#0fb0dd] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Staff only. Lost access?{" "}
          <a href="tel:+13069548688" className="text-[#16C2F3] hover:underline">
            (306) 954-8688
          </a>
        </p>
      </div>
    </div>
  );
}
