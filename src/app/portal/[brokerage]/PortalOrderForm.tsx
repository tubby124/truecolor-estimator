"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type {
  Brokerage,
  BrokerageProductGroup,
  BrokerageProductOption,
} from "@/lib/data/brokerages";
import { readUtmFromStorage } from "@/components/site/UtmCapture";
import { appendAttributionToFormData } from "@/lib/analytics/utm";

// localStorage key per-brokerage so an agent who orders from two different
// brokerage portals (rare but possible) doesn't bleed details across.
function profileKey(slug: string) {
  return `tc-portal:${slug}:agent-profile`;
}

interface SavedProfile {
  name: string;
  email: string;
  phone: string;
  shippingAddress: string;
}

interface LineItem {
  productId: string;
  qty: number;
  sides: "1" | "2";
  /** Selected material id when product has materialOptions (e.g. "4mm" or "10mm") */
  materialId: string;
  notes: string;
}

const INPUT_CLS =
  "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 bg-white transition-colors";
const LABEL_CLS =
  "block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide";

function priceFor(product: BrokerageProductOption, line: LineItem | null, qty: number): number {
  // Material-priced products (toppers): one price per material, no bulk tiers
  if (product.materialOptions && product.materialOptions.length > 0) {
    const sel =
      product.materialOptions.find((m) => m.id === (line?.materialId ?? "")) ??
      product.materialOptions[0];
    return sel.unitPrice;
  }
  // Fixed-price products with optional qty tiers + optional sides uplift
  const base = product.unitPrice ?? 0;
  let perUnit = base;
  if (product.bulkTiers && product.bulkTiers.length > 0) {
    const sorted = [...product.bulkTiers].sort((a, b) => b.minQty - a.minQty);
    for (const tier of sorted) {
      if (qty >= tier.minQty) {
        perUnit = tier.unitPrice;
        break;
      }
    }
  }
  // Add sides uplift when agent picked double-sided (only on products with sidesPicker)
  if (product.sidesPicker && product.sidesUplift && line?.sides === "2") {
    perUnit += product.sidesUplift;
  }
  return perUnit;
}

function fmt(n: number): string {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

function fromPriceLabel(product: BrokerageProductOption): string {
  if (product.materialOptions && product.materialOptions.length > 0) {
    const prices = product.materialOptions.map((m) => m.unitPrice);
    return `${fmt(Math.min(...prices))}–${fmt(Math.max(...prices))}`;
  }
  return fmt(product.unitPrice ?? 0);
}

export function PortalOrderForm({
  brokerage,
  accent,
}: {
  brokerage: Brokerage;
  accent: string;
}) {
  const productIndex = useMemo(() => {
    const map = new Map<string, BrokerageProductOption>();
    for (const group of brokerage.productGroups) {
      for (const p of group.products) map.set(p.id, p);
    }
    return map;
  }, [brokerage]);

  const [agentName, setAgentName] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"ship" | "pickup">("ship");
  const [lines, setLines] = useState<Record<string, LineItem>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [recognized, setRecognized] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [submittedLines, setSubmittedLines] = useState<LineItem[]>([]);
  const [submittedSubtotal, setSubmittedSubtotal] = useState(0);
  const [submittedTotal, setSubmittedTotal] = useState(0);

  // ─── Returning-agent UX ──────────────────────────────────────────────
  // Pre-fill name/email/phone/shipping from the last successful submission on
  // this device. No backend, no auth — purely a friendly "we remember you"
  // experience while we wait for Diana's roster + auth-model decision.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(profileKey(brokerage.slug));
      if (!raw) return;
      const saved = JSON.parse(raw) as SavedProfile;
      if (saved.name) setAgentName(saved.name);
      if (saved.email) setAgentEmail(saved.email);
      if (saved.phone) setAgentPhone(saved.phone);
      if (saved.shippingAddress) setShippingAddress(saved.shippingAddress);
      if (saved.name) setRecognized(saved.name.split(/\s+/)[0]);
    } catch {
      // ignore — corrupt/missing storage shouldn't break the form
    }
  }, [brokerage.slug]);

  function clearSavedProfile() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(profileKey(brokerage.slug));
    } catch {
      // ignore
    }
    setAgentName("");
    setAgentEmail("");
    setAgentPhone("");
    setShippingAddress("");
    setRecognized(null);
  }

  function toggleProduct(p: BrokerageProductOption) {
    setLines((prev) => {
      const next = { ...prev };
      if (next[p.id]) {
        delete next[p.id];
      } else {
        next[p.id] = {
          productId: p.id,
          qty: p.qtyOptions[0] ?? 1,
          sides: p.sidesPicker ? "2" : "1",
          materialId: p.materialOptions?.[0]?.id ?? "",
          notes: "",
        };
      }
      return next;
    });
  }

  function updateLine(productId: string, patch: Partial<LineItem>) {
    setLines((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      return { ...prev, [productId]: { ...existing, ...patch } };
    });
  }

  const selectedLines = Object.values(lines);
  const subtotal = selectedLines.reduce((sum, line) => {
    const product = productIndex.get(line.productId);
    if (!product) return sum;
    return sum + priceFor(product, line, line.qty) * line.qty;
  }, 0);
  const orderMinimum = brokerage.orderMinimum ?? 0;
  // Only apply the minimum once the agent has actually picked something — empty
  // cart should read $0, not the floor.
  const orderTotal = selectedLines.length === 0 ? 0 : Math.max(subtotal, orderMinimum);
  const minimumApplied = subtotal > 0 && subtotal < orderMinimum;
  const minimumGap = minimumApplied ? orderMinimum - subtotal : 0;

  async function handleSubmit() {
    setError(null);

    if (!agentName.trim() || !agentEmail.trim()) {
      setError("Please enter your name and email so we can send the proof.");
      return;
    }
    if (!agentPhone.trim()) {
      setError("Phone is required — the courier needs it for delivery.");
      return;
    }
    if (deliveryMode === "ship" && !shippingAddress.trim()) {
      setError("Please enter the address you want this shipped to.");
      return;
    }
    if (selectedLines.length === 0) {
      setError("Pick at least one item.");
      return;
    }

    setSubmitting(true);
    try {
      const items = selectedLines.map((line) => {
        const product = productIndex.get(line.productId)!;
        const unit = priceFor(product, line, line.qty);
        const matSel = product.materialOptions?.find((m) => m.id === line.materialId);
        const materialLabel = matSel ? matSel.label : product.tcCategory;
        const noteParts = [
          `Portal: ${brokerage.name}`,
          `Indicative ${fmt(unit)} × ${line.qty} = ${fmt(unit * line.qty)}`,
          line.notes.trim() ? `Agent notes: ${line.notes.trim()}` : null,
        ].filter(Boolean);
        return {
          product: product.label,
          qty: String(line.qty),
          material: materialLabel,
          dimensions: "",
          sides: line.sides,
          notes: noteParts.join(" · "),
        };
      });

      // Append a synthetic line so staff sees the order-minimum bump in the
      // notification email and on the staff portal — keeps the indicative total
      // the agent saw matching what we'll invoice.
      if (minimumApplied) {
        items.push({
          product: "Order minimum adjustment",
          qty: "1",
          material: "",
          dimensions: "",
          sides: "1",
          notes: `Subtotal ${fmt(subtotal)} bumped to ${fmt(orderMinimum)} (brokerage portal order min covers proof + setup)`,
        });
      }

      // For pickup orders we still pass a recognizable marker into shipping_address
      // so staff sees it on the order card and the field stays non-null.
      const shipForApi =
        deliveryMode === "pickup"
          ? `PICKUP at True Color — 216 33rd St W, Saskatoon SK`
          : shippingAddress;

      const form = new FormData();
      form.append("name", agentName);
      form.append("email", agentEmail);
      form.append("phone", agentPhone);
      form.append("items", JSON.stringify(items));
      form.append("brokerage_slug", brokerage.slug);
      form.append("shipping_address", shipForApi);
      appendAttributionToFormData(form, readUtmFromStorage());

      const res = await fetch("/api/quote-request", { method: "POST", body: form });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Submission failed");
      }
      const result = (await res.json().catch(() => ({}))) as {
        sent?: boolean;
        ref?: string | null;
      };
      // Save profile after successful submission so next visit pre-fills.
      try {
        const profile: SavedProfile = {
          name: agentName,
          email: agentEmail,
          phone: agentPhone,
          shippingAddress,
        };
        window.localStorage.setItem(profileKey(brokerage.slug), JSON.stringify(profile));
      } catch {
        // Silent — storage failure shouldn't block the success state.
      }
      // Snapshot what they submitted so the confirmation page can render
      // even if `lines` state is later cleared.
      setSubmittedLines(selectedLines);
      setSubmittedSubtotal(subtotal);
      setSubmittedTotal(orderTotal);
      setSubmittedRef(result.ref ?? null);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        className="bg-white border-2 rounded-2xl overflow-hidden"
        style={{ borderColor: accent }}
      >
        <div className="p-6 sm:p-8 text-center border-b border-gray-100">
          <div
            aria-hidden
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3"
            style={{ backgroundColor: `${accent}22` }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke={accent}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-2xl font-bold text-[#1c1712] mb-1">
            Order request received
          </p>
          {submittedRef ? (
            <p className="text-sm text-gray-500 font-mono">
              Reference <span className="font-bold text-[#1c1712]">#{submittedRef}</span>
            </p>
          ) : null}
        </div>

        {submittedLines.length > 0 ? (
          <div className="px-6 sm:px-8 py-5 bg-gray-50">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              What you ordered
            </p>
            <ul className="divide-y divide-gray-200">
              {submittedLines.map((line) => {
                const product = productIndex.get(line.productId);
                if (!product) return null;
                const unit = priceFor(product, line, line.qty);
                const matSel = product.materialOptions?.find((m) => m.id === line.materialId);
                return (
                  <li
                    key={line.productId}
                    className="py-2.5 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1c1712] truncate">
                        {product.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        Qty {line.qty}
                        {matSel ? ` · ${matSel.label.replace(/ — \$\d+/, "")}` : ""}
                        {product.sidesPicker
                          ? ` · ${line.sides === "2" ? "Double-sided" : "Single-sided"}`
                          : ""}
                      </p>
                    </div>
                    <span className="font-bold tabular-nums text-[#1c1712] flex-shrink-0">
                      {fmt(unit * line.qty)}
                    </span>
                  </li>
                );
              })}
            </ul>
            {submittedTotal > submittedSubtotal ? (
              <>
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200 text-sm">
                  <span className="text-gray-600">Items subtotal</span>
                  <span className="tabular-nums text-gray-700">{fmt(submittedSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between pt-1 text-sm">
                  <span className="text-gray-600">Order minimum bump</span>
                  <span className="tabular-nums text-gray-700">
                    +{fmt(submittedTotal - submittedSubtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-200">
                  <span className="font-semibold text-gray-700">Indicative total</span>
                  <span className="text-lg font-bold tabular-nums text-[#1c1712]">
                    {fmt(submittedTotal)}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200">
                <span className="font-semibold text-gray-700">Indicative total</span>
                <span className="text-lg font-bold tabular-nums text-[#1c1712]">
                  {fmt(submittedTotal || submittedSubtotal)}
                </span>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Taxes + shipping confirmed on the final invoice after proof approval.
            </p>
          </div>
        ) : null}

        <div className="px-6 sm:px-8 py-5">
          <p className="text-sm text-gray-700 mb-3">
            We&apos;ll send a proof to <span className="font-semibold">{agentEmail}</span> within
            1 business day. Once you approve it, we&apos;ll send a Clover payment link straight
            to your inbox.
          </p>
          <p className="text-xs text-gray-500">
            Delivery:{" "}
            <span className="font-semibold text-gray-700">
              {deliveryMode === "pickup"
                ? "Pickup at True Color, Saskatoon"
                : "Ship via Canada Post"}
            </span>
            {deliveryMode === "ship" && shippingAddress ? ` · ${shippingAddress}` : ""}
          </p>
          {submittedRef ? (
            <p className="text-xs text-gray-400 mt-3">
              Save this reference for follow-up:{" "}
              <span className="font-mono font-bold">#{submittedRef}</span>
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Agent details */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="text-lg font-bold text-[#1c1712]">Your details</h2>
          {recognized ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">
                Welcome back, <span className="font-semibold text-[#1c1712]">{recognized}</span>
              </span>
              <button
                type="button"
                onClick={clearSavedProfile}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 underline"
              >
                Not you?
              </button>
            </div>
          ) : null}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="agentName" className={LABEL_CLS}>Your full name</label>
            <input
              id="agentName"
              type="text"
              autoComplete="name"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className={INPUT_CLS}
              required
            />
          </div>
          <div>
            <label htmlFor="agentEmail" className={LABEL_CLS}>Your email</label>
            <input
              id="agentEmail"
              type="email"
              autoComplete="email"
              value={agentEmail}
              onChange={(e) => setAgentEmail(e.target.value)}
              className={INPUT_CLS}
              required
            />
          </div>
          <div>
            <label htmlFor="agentPhone" className={LABEL_CLS}>Phone</label>
            <input
              id="agentPhone"
              type="tel"
              autoComplete="tel"
              value={agentPhone}
              onChange={(e) => setAgentPhone(e.target.value)}
              className={INPUT_CLS}
              required
            />
            <p className="text-xs text-gray-500 mt-1.5">Courier needs this for delivery.</p>
          </div>

          {/* Delivery mode picker — pickup hides the shipping address field */}
          <div className="sm:col-span-2">
            <span className={LABEL_CLS}>How should we get this to you?</span>
            <div className="grid sm:grid-cols-2 gap-2 mt-1.5">
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  deliveryMode === "ship" ? "border-2" : "border-gray-200 hover:bg-gray-50"
                }`}
                style={deliveryMode === "ship" ? { borderColor: accent } : undefined}
              >
                <input
                  type="radio"
                  name="deliveryMode"
                  value="ship"
                  checked={deliveryMode === "ship"}
                  onChange={() => setDeliveryMode("ship")}
                  className="mt-0.5 flex-shrink-0"
                />
                <span>
                  <span className="block font-semibold text-[#1c1712] text-sm">
                    Ship to me
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    Canada Post Expedited ground · 1–3 business days within SK
                  </span>
                </span>
              </label>
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  deliveryMode === "pickup" ? "border-2" : "border-gray-200 hover:bg-gray-50"
                }`}
                style={deliveryMode === "pickup" ? { borderColor: accent } : undefined}
              >
                <input
                  type="radio"
                  name="deliveryMode"
                  value="pickup"
                  checked={deliveryMode === "pickup"}
                  onChange={() => setDeliveryMode("pickup")}
                  className="mt-0.5 flex-shrink-0"
                />
                <span>
                  <span className="block font-semibold text-[#1c1712] text-sm">
                    Pickup in Saskatoon (free)
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    216 33rd St W · we&apos;ll text you when it&apos;s ready
                  </span>
                </span>
              </label>
            </div>
          </div>

          {deliveryMode === "ship" ? (
            <div className="sm:col-span-2">
              <label htmlFor="shippingAddress" className={LABEL_CLS}>
                Shipping address (Saskatchewan)
              </label>
              <input
                id="shippingAddress"
                type="text"
                autoComplete="street-address"
                placeholder="123 Main St, Saskatoon SK S7K 1A1"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className={INPUT_CLS}
                required
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Shipping cost added to your final invoice after proof approval.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/* Product groups */}
      {brokerage.productGroups.map((group) =>
        group.layout === "topper-grid" ? (
          <TopperGrid
            key={group.title}
            group={group}
            lines={lines}
            accent={accent}
            onToggle={toggleProduct}
            onUpdate={updateLine}
          />
        ) : (
          <ProductList
            key={group.title}
            group={group}
            lines={lines}
            accent={accent}
            onToggle={toggleProduct}
            onUpdate={updateLine}
          />
        )
      )}

      {/* Summary + submit */}
      <section className="bg-white border-2 rounded-2xl p-5 sm:p-7 shadow-lg" style={{ borderColor: accent }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {selectedLines.length === 0
              ? "Nothing selected yet"
              : `${selectedLines.length} item${selectedLines.length === 1 ? "" : "s"} selected`}
          </p>
          <p className="text-2xl font-bold tabular-nums text-[#1c1712]">{fmt(orderTotal)}</p>
        </div>

        {minimumApplied ? (
          <div className="text-xs mb-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <p className="font-semibold text-amber-900 mb-0.5">
              Order minimum {fmt(orderMinimum)} applied
            </p>
            <p className="text-amber-800">
              Your items add to {fmt(subtotal)}. Add{" "}
              <span className="font-semibold">{fmt(minimumGap)}</span> more (a couple toppers,
              or one more directional) and you&apos;ll get more for the same price.
            </p>
          </div>
        ) : null}

        <p className="text-xs text-gray-500 mb-4">
          Indicative total — per-piece pricing covers material, cutting & packing. The{" "}
          {fmt(orderMinimum)} order minimum covers our one-time design proof + press setup.
          Tax + shipping confirmed on your final invoice after proof approval.
        </p>

        {error ? (
          <p
            role="alert"
            className="text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3"
          >
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full text-white font-bold py-3.5 px-6 rounded-xl text-base transition-opacity disabled:opacity-50"
          style={{ backgroundColor: accent }}
        >
          {submitting ? "Sending…" : "Request proof"}
        </button>

        <p className="text-xs text-gray-500 text-center mt-3">
          We&apos;ll reply within 1 business day. No payment until you approve the proof.
        </p>
      </section>
    </div>
  );
}

// ─── ProductList ─ list layout for sign products ──────────────────────────────

function ProductList({
  group,
  lines,
  accent,
  onToggle,
  onUpdate,
}: {
  group: BrokerageProductGroup;
  lines: Record<string, LineItem>;
  accent: string;
  onToggle: (p: BrokerageProductOption) => void;
  onUpdate: (id: string, patch: Partial<LineItem>) => void;
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-7">
      <h2 className="text-lg font-bold text-[#1c1712]">{group.title}</h2>
      {group.intro ? (
        <p className="text-sm text-gray-600 mt-1.5 mb-5">{group.intro}</p>
      ) : (
        <div className="mb-5" />
      )}

      <ul className="space-y-3">
        {group.products.map((product) => {
          const line = lines[product.id] ?? null;
          const selected = !!line;
          const unitNow = priceFor(product, line, line?.qty ?? 1);
          return (
            <li
              key={product.id}
              className={`border rounded-xl transition-colors ${selected ? "border-2" : "border-gray-200"}`}
              style={selected ? { borderColor: accent } : undefined}
            >
              <button
                type="button"
                onClick={() => onToggle(product)}
                aria-pressed={selected}
                className="w-full text-left p-4 flex items-start gap-4 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <span
                  aria-hidden
                  className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded border-2 flex-shrink-0 ${selected ? "" : "border-gray-300"}`}
                  style={selected ? { backgroundColor: accent, borderColor: accent } : undefined}
                >
                  {selected ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </span>

                {product.imageSrc ? (
                  <div
                    className={`bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 ${
                      product.imageOrientation === "portrait" ? "w-16 h-20" : "w-24 h-16"
                    }`}
                  >
                    <Image
                      src={product.imageSrc}
                      alt={product.label}
                      width={240}
                      height={180}
                      sizes="120px"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : null}

                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-[#1c1712]">{product.label}</span>
                  {product.blurb ? (
                    <span className="block text-sm text-gray-500 mt-0.5">{product.blurb}</span>
                  ) : null}
                  <span className="block text-sm text-gray-700 mt-1.5">
                    {product.sidesPicker && product.sidesUplift ? (
                      <>
                        {fmt(product.unitPrice ?? 0)}{" "}
                        <span className="text-gray-500">single-sided</span>
                        {" · "}
                        {fmt((product.unitPrice ?? 0) + product.sidesUplift)}{" "}
                        <span className="text-gray-500">double-sided</span>
                        {product.bulkTiers && product.bulkTiers.length > 0 ? (
                          <span className="text-gray-500">
                            {" · "}
                            {product.bulkTiers
                              .map(
                                (tier) =>
                                  `${fmt(tier.unitPrice)}/${fmt(
                                    tier.unitPrice + (product.sidesUplift ?? 0),
                                  )} at ${tier.minQty}+`,
                              )
                              .join(" · ")}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <>
                        {fmt(priceFor(product, null, 1))}{" "}
                        <span className="text-gray-500">each</span>
                        {product.bulkTiers && product.bulkTiers.length > 0 ? (
                          <>
                            {" "}·{" "}
                            <span className="text-gray-500">
                              {product.bulkTiers
                                .map((tier) => `${fmt(tier.unitPrice)} at ${tier.minQty}+`)
                                .join(" · ")}
                            </span>
                          </>
                        ) : null}
                      </>
                    )}
                  </span>
                </span>
              </button>

              {selected && line ? (
                <div className="border-t border-gray-100 px-4 py-4 grid sm:grid-cols-3 gap-3 bg-gray-50">
                  <div>
                    <label htmlFor={`qty-${product.id}`} className={LABEL_CLS}>Quantity</label>
                    <select
                      id={`qty-${product.id}`}
                      value={line.qty}
                      onChange={(e) => onUpdate(product.id, { qty: Number(e.target.value) })}
                      className={INPUT_CLS}
                    >
                      {product.qtyOptions.map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>

                  {product.sidesPicker ? (
                    <div>
                      <label htmlFor={`sides-${product.id}`} className={LABEL_CLS}>Sides</label>
                      <select
                        id={`sides-${product.id}`}
                        value={line.sides}
                        onChange={(e) => onUpdate(product.id, { sides: e.target.value as "1" | "2" })}
                        className={INPUT_CLS}
                      >
                        <option value="1">
                          Single-sided{" "}
                          {fmt(priceFor(product, { ...line, sides: "1" }, line.qty))}
                        </option>
                        <option value="2">
                          Double-sided{" "}
                          {fmt(priceFor(product, { ...line, sides: "2" }, line.qty))}
                        </option>
                      </select>
                    </div>
                  ) : null}

                  <div className={product.sidesPicker ? "sm:col-span-3" : "sm:col-span-2"}>
                    <label htmlFor={`notes-${product.id}`} className={LABEL_CLS}>Notes (optional)</label>
                    <input
                      id={`notes-${product.id}`}
                      type="text"
                      value={line.notes}
                      onChange={(e) => onUpdate(product.id, { notes: e.target.value })}
                      placeholder="e.g. agent photo updated, rush needed"
                      className={INPUT_CLS}
                    />
                  </div>

                  <div className="sm:col-span-3 flex items-center justify-between border-t border-gray-200 pt-3 mt-1">
                    <span className="text-sm text-gray-600">Line total</span>
                    <span className="text-lg font-bold tabular-nums text-[#1c1712]">
                      {fmt(unitNow * line.qty)}
                    </span>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ─── TopperGrid ─ visual gallery for sign toppers ─────────────────────────────

function TopperGrid({
  group,
  lines,
  accent,
  onToggle,
  onUpdate,
}: {
  group: BrokerageProductGroup;
  lines: Record<string, LineItem>;
  accent: string;
  onToggle: (p: BrokerageProductOption) => void;
  onUpdate: (id: string, patch: Partial<LineItem>) => void;
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-7">
      <h2 className="text-lg font-bold text-[#1c1712]">{group.title}</h2>
      {group.intro ? (
        <p className="text-sm text-gray-600 mt-1.5 mb-5">{group.intro}</p>
      ) : (
        <div className="mb-5" />
      )}

      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {group.products.map((product) => {
          const line = lines[product.id] ?? null;
          const selected = !!line;
          const unitNow = priceFor(product, line, line?.qty ?? 1);
          return (
            <li
              key={product.id}
              className={`border rounded-xl transition-all overflow-hidden ${selected ? "border-2 shadow-md" : "border-gray-200"}`}
              style={selected ? { borderColor: accent } : undefined}
            >
              <button
                type="button"
                onClick={() => onToggle(product)}
                aria-pressed={selected}
                className="w-full flex flex-col text-left hover:bg-gray-50 transition-colors"
              >
                <div className="bg-gray-50 aspect-[3/1] flex items-center justify-center p-2 border-b border-gray-100">
                  {product.imageSrc ? (
                    <Image
                      src={product.imageSrc}
                      alt={product.label}
                      width={480}
                      height={160}
                      sizes="(max-width: 640px) 50vw, 200px"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">{product.label}</span>
                  )}
                </div>
                <div className="px-3 py-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#1c1712] truncate">
                    {product.label}
                  </span>
                  <span
                    aria-hidden
                    className={`inline-flex items-center justify-center w-4 h-4 rounded border-2 flex-shrink-0 ${selected ? "" : "border-gray-300"}`}
                    style={selected ? { backgroundColor: accent, borderColor: accent } : undefined}
                  >
                    {selected ? (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </span>
                </div>
              </button>

              {selected && line ? (
                <div className="border-t border-gray-100 px-3 py-3 bg-gray-50 space-y-2">
                  {product.materialOptions && product.materialOptions.length > 0 ? (
                    <div>
                      <label htmlFor={`mat-${product.id}`} className={LABEL_CLS}>Material</label>
                      <select
                        id={`mat-${product.id}`}
                        value={line.materialId}
                        onChange={(e) => onUpdate(product.id, { materialId: e.target.value })}
                        className={INPUT_CLS}
                      >
                        {product.materialOptions.map((m) => (
                          <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                  <div>
                    <label htmlFor={`qty-${product.id}`} className={LABEL_CLS}>Quantity</label>
                    <select
                      id={`qty-${product.id}`}
                      value={line.qty}
                      onChange={(e) => onUpdate(product.id, { qty: Number(e.target.value) })}
                      className={INPUT_CLS}
                    >
                      {product.qtyOptions.map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-1">
                    <span className="text-gray-600">Line total</span>
                    <span className="font-bold tabular-nums text-[#1c1712]">
                      {fmt(unitNow * line.qty)}
                    </span>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
