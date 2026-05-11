"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type {
  Brokerage,
  BrokerageProductGroup,
  BrokerageProductOption,
} from "@/lib/data/brokerages";

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
  // Fixed-price products with optional qty tiers
  const base = product.unitPrice ?? 0;
  if (!product.bulkTiers || product.bulkTiers.length === 0) return base;
  const sorted = [...product.bulkTiers].sort((a, b) => b.minQty - a.minQty);
  for (const tier of sorted) if (qty >= tier.minQty) return tier.unitPrice;
  return base;
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
  const [lines, setLines] = useState<Record<string, LineItem>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [recognized, setRecognized] = useState<string | null>(null);

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

  async function handleSubmit() {
    setError(null);

    if (!agentName.trim() || !agentEmail.trim()) {
      setError("Please enter your name and email so we can send the proof.");
      return;
    }
    if (!shippingAddress.trim()) {
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

      const form = new FormData();
      form.append("name", agentName);
      form.append("email", agentEmail);
      if (agentPhone.trim()) form.append("phone", agentPhone);
      form.append("items", JSON.stringify(items));
      form.append("brokerage_slug", brokerage.slug);
      form.append("shipping_address", shippingAddress);

      const res = await fetch("/api/quote-request", { method: "POST", body: form });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Submission failed");
      }
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
        className="bg-white border border-green-200 rounded-2xl p-8 text-center"
      >
        <p className="text-2xl font-bold text-[#1c1712] mb-2">Order request received</p>
        <p className="text-gray-700 mb-4">
          We&apos;ll send a proof for <span className="font-semibold">{agentName}</span> to{" "}
          <span className="font-semibold">{agentEmail}</span> within 1 business day.
        </p>
        <p className="text-sm text-gray-500">
          Once you approve the proof we&apos;ll send a Clover payment link straight to your inbox.
        </p>
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
            <label htmlFor="agentPhone" className={LABEL_CLS}>Phone (optional)</label>
            <input
              id="agentPhone"
              type="tel"
              autoComplete="tel"
              value={agentPhone}
              onChange={(e) => setAgentPhone(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
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
              Canada Post Expedited ground. Free pickup if you&apos;re in Saskatoon — note that
              under any line item below.
            </p>
          </div>
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
          <p className="text-2xl font-bold tabular-nums text-[#1c1712]">{fmt(subtotal)}</p>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Indicative subtotal — taxes and shipping confirmed on your final invoice after proof
          approval.
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
                    From{" "}
                    <span className="font-semibold tabular-nums">
                      {fromPriceLabel(product)}
                    </span>{" "}
                    each
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
                        <option value="1">Single-sided</option>
                        <option value="2">Double-sided</option>
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
