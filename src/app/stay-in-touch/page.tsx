"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Choice = "accept" | "decline";
type State = "ready" | "saving" | "accepted" | "declined" | "expired" | "error";

function choiceFromQuery(value: string | null): Choice | null {
  return value === "accept" || value === "decline" ? value : null;
}

export default function StayInTouchPage() {
  const [state, setState] = useState<State>("ready");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [directChoice, setDirectChoice] = useState<Choice | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") ?? "");
    setDirectChoice(choiceFromQuery(params.get("choice")));
  }, []);

  async function save(choice: Choice) {
    if (!token || state === "saving") return;
    setState("saving");
    setError("");
    try {
      const response = await fetch("/api/marketing/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, choice }),
      });
      if (response.status === 410) {
        setState("expired");
        return;
      }
      if (!response.ok) throw new Error("Could not save your preference");
      setState(choice === "accept" ? "accepted" : "declined");
    } catch {
      setError("We could not save that right now. Please try again or contact us at info@true-color.ca.");
      setState("error");
    }
  }

  useEffect(() => {
    if (directChoice) void save(directChoice);
    // A choice in the signed email link is an explicit customer action. Do not
    // infer a preference when the page is opened without one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directChoice]);

  const message = state === "accepted"
    ? "You’re in. We’ll occasionally send useful print ideas, reorder reminders, customer showcases, and promotions."
    : state === "declined"
      ? "No problem. We won’t send future marketing emails to this address."
      : state === "expired"
        ? "This preference link has already been used or has expired."
        : null;

  return (
    <main className="min-h-screen bg-[#f4efe9] px-5 py-16 text-[#1c1712]">
      <section className="mx-auto max-w-xl rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#16a7d3]">True Color Display Printing</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Stay in the loop?</h1>
        {message ? (
          <>
            <p className="mt-5 text-base leading-7 text-gray-700">{message}</p>
            <Link href="/" className="mt-7 inline-block rounded-lg bg-[#1c1712] px-5 py-3 text-sm font-bold text-white">Back to True Color</Link>
          </>
        ) : (
          <>
            <p className="mt-5 text-base leading-7 text-gray-700">Choose what works for you. There’s no pressure, and you can change your mind later.</p>
            {!token ? <p className="mt-5 text-sm text-red-700">This link is incomplete. Please use the link from your email.</p> : null}
            {error ? <p className="mt-5 text-sm text-red-700">{error}</p> : null}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button type="button" disabled={!token || state === "saving"} onClick={() => void save("accept")} className="rounded-lg bg-[#16a7d3] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Keep me in the loop</button>
              <button type="button" disabled={!token || state === "saving"} onClick={() => void save("decline")} className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-bold text-gray-800 disabled:opacity-50">No thanks / unsubscribe</button>
            </div>
          </>
        )}
        <p className="mt-8 text-xs leading-5 text-gray-500">Order confirmations, receipts, proofs, and pickup updates are separate operational emails.</p>
      </section>
    </main>
  );
}
