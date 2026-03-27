"use client";

import { useState } from "react";

interface Props {
  productName: string;
  productSlug: string;
}

export function NotifyMeForm({ productName, productSlug }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/notify-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, product_name: productName, product_slug: productSlug }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-sm text-green-600 font-medium">
        ✓ We&apos;ll email you when it&apos;s ready!
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2 justify-center max-w-sm mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-[#1c1712] placeholder-gray-400 focus:outline-none focus:border-[#16C2F3] focus:ring-1 focus:ring-[#16C2F3]"
        disabled={status === "submitting"}
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        className="shrink-0 bg-[#16C2F3] hover:bg-[#0fb0dd] disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
      >
        {status === "submitting" ? "Notifying…" : "Notify Me"}
      </button>
      {status === "error" && (
        <p className="w-full text-xs text-red-500 mt-1">{errorMsg}</p>
      )}
    </form>
  );
}
