"use client";

import type { Order } from "./types";
import { parseAddons, formatDate } from "./helpers";
import { SUPABASE_STORAGE_URL } from "./constants";
import { StatusStepper } from "./StatusStepper";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/data/order-constants";

interface OrderCardProps {
  order: Order;
  expandedOrder: string | null;
  setExpandedOrder: (id: string | null) => void;
  uploadingFile: string | null;
  uploadDone: Set<string>;
  uploadError: string | null;
  reorderedId: string | null;
  onReorder: (order: Order) => void;
  onFileUpload: (orderId: string, file: File) => void;
  onReceiptClick: (order: Order) => void;
}

export function OrderCard({ order, expandedOrder, setExpandedOrder, uploadingFile, uploadDone, uploadError, reorderedId, onReorder, onFileUpload, onReceiptClick }: OrderCardProps) {
  const isExpanded = expandedOrder === order.id;
  const rushFee = order.is_rush
    ? Math.round((Number(order.total) - Number(order.subtotal) - Number(order.gst) - Number(order.pst ?? 0)) * 100) / 100
    : 0;

  return (
    <div
      key={order.id}
      className={`border rounded-xl overflow-hidden transition-shadow hover:shadow-sm ${
        order.is_rush ? "border-orange-300" : "border-gray-200"
      }`}
    >
      {/* ── Card header ── */}
      <div
        className={`p-5 cursor-pointer transition-colors ${
          order.is_rush
            ? "bg-orange-50 hover:bg-orange-100/50"
            : "bg-white hover:bg-gray-50"
        }`}
        onClick={() =>
          setExpandedOrder(isExpanded ? null : order.id)
        }
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          {/* Left: order info + stepper */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[#1c1712] text-base">
                {order.order_number}
              </span>
              {order.is_rush && (
                <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                  RUSH
                </span>
              )}
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  STATUS_COLORS[order.status] ??
                  "bg-gray-100 text-gray-600"
                }`}
              >
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
              {/* Proof badge — visible without expanding */}
              {order.proof_storage_path && (
                <span className="text-xs font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full animate-pulse">
                  Proof ready — review now
                </span>
              )}
              {order.status === "ready_for_pickup" && (
                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  Ready to collect!
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {formatDate(order.created_at)} &middot;{" "}
              {order.order_items.length} item
              {order.order_items.length !== 1 ? "s" : ""} &middot; $
              {Number(order.total).toFixed(2)} CAD
            </p>
            <StatusStepper status={order.status} />
          </div>

          {/* Right: action buttons */}
          <div
            className="flex items-center gap-2 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {order.pay_url &&
              order.status === "pending_payment" &&
              order.payment_method === "clover_card" && (
                <a
                  href={order.pay_url}
                  className="text-sm font-bold px-4 py-2 rounded-lg bg-[#16C2F3] text-white hover:bg-[#0fb0dd] transition-colors whitespace-nowrap"
                >
                  Pay by card &rarr;
                </a>
              )}
            {order.status !== "pending_payment" && (
              <>
                <button
                  onClick={() => onReceiptClick(order)}
                  className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors bg-[#f4efe9] text-[#1c1712] hover:bg-[#1c1712] hover:text-white"
                >
                  Receipt
                </button>
                <button
                  onClick={() => onReorder(order)}
                  className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
                    reorderedId === order.id
                      ? "bg-[#8CC63E] text-white"
                      : "bg-[#f4efe9] text-[#1c1712] hover:bg-[#16C2F3] hover:text-white"
                  }`}
                >
                  {reorderedId === order.id
                    ? "\u2713 Going to cart\u2026"
                    : "Reorder"}
                </button>
              </>
            )}
            <span className="text-gray-400 text-sm select-none">
              {isExpanded ? "\u25b2" : "\u25bc"}
            </span>
          </div>
        </div>

        {/* eTransfer instructions — visible without expanding */}
        {order.payment_method === "etransfer" &&
          order.status === "pending_payment" && (
            <div
              className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xs font-bold text-amber-800 mb-1.5">
                Pay by e-Transfer
              </p>
              <p className="text-sm text-amber-900 leading-relaxed">
                Send{" "}
                <span className="font-bold">
                  ${Number(order.total).toFixed(2)} CAD
                </span>{" "}
                to{" "}
                <span className="font-bold font-mono bg-amber-100 px-1 rounded">
                  info@true-color.ca
                </span>
              </p>
              <p className="text-xs text-amber-700 mt-1.5 leading-relaxed">
                Use{" "}
                <span className="font-mono font-bold bg-amber-100 px-1 rounded">
                  {order.order_number}
                </span>{" "}
                as the message/reference. We&apos;ll start your
                order once we confirm payment.
              </p>
            </div>
          )}

        {/* Ready for pickup — inline address */}
        {order.status === "ready_for_pickup" && (
          <div
            className="mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-bold text-green-800 mb-1.5">
              Your order is ready for pickup!
            </p>
            <p className="text-sm text-green-900">
              📍 216 33rd St W, Saskatoon SK
            </p>
            <p className="text-sm text-green-900 mt-0.5">
              📞{" "}
              <a
                href="tel:+13069548688"
                className="font-semibold hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                (306) 954-8688
              </a>{" "}
              &middot; Mon&ndash;Fri 9 AM&ndash;5 PM
            </p>
          </div>
        )}
      </div>

      {/* ── Expanded section ── */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-5 space-y-5">

          {/* Item cards */}
          <div className="space-y-3">
            {order.order_items.map((item) => {
              const addonChips = parseAddons(item.addons);
              const sizeLabel =
                item.width_in && item.height_in
                  ? `${item.width_in}\u00d7${item.height_in}" (${(
                      item.width_in / 12
                    ).toFixed(1)}\u00d7${(
                      item.height_in / 12
                    ).toFixed(1)} ft)`
                  : null;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1c1712]">
                        {item.product_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {sizeLabel && (
                          <>{sizeLabel} &middot; </>
                        )}
                        {item.category === "BOOKLET"
                          ? "~80 pages"
                          : item.sides === 2
                          ? "Double-sided"
                          : "Single-sided"}{" "}
                        &middot; Qty {item.qty}
                        {item.design_status &&
                          item.design_status !== "PRINT_READY" && (
                            <>
                              {" "}
                              &middot;{" "}
                              <span className="text-gray-400 capitalize">
                                {item.design_status
                                  .replace(/_/g, " ")
                                  .toLowerCase()}
                              </span>
                            </>
                          )}
                      </p>
                      {/* Addon chips */}
                      {addonChips.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {addonChips.map((a) => (
                            <span
                              key={a.label}
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.colorClass}`}
                            >
                              {a.count > 1
                                ? `\u00d7${a.count} `
                                : ""}
                              {a.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="font-bold text-[#1c1712] tabular-nums shrink-0 text-sm">
                      ${item.line_total.toFixed(2)}
                    </p>
                  </div>

                  {/* Artwork file */}
                  {item.file_storage_path && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">
                        Your uploaded file:
                      </p>
                      <a
                        href={`${SUPABASE_STORAGE_URL}/${item.file_storage_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#16C2F3] font-semibold hover:underline"
                      >
                        📎 View artwork &rarr;
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span className="font-medium tabular-nums">
                ${Number(order.subtotal).toFixed(2)}
              </span>
            </div>
            {order.is_rush && rushFee > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>Rush fee</span>
                <span className="font-medium tabular-nums">
                  +${rushFee.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>GST (5%)</span>
              <span className="font-medium tabular-nums">
                ${Number(order.gst).toFixed(2)}
              </span>
            </div>
            {Number(order.pst ?? 0) > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>PST (6%)</span>
                <span className="font-medium tabular-nums">
                  ${Number(order.pst).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-100 pt-1.5">
              <span className="font-semibold text-[#1c1712]">
                Total
              </span>
              <span className="font-bold text-[#1c1712] tabular-nums">
                ${Number(order.total).toFixed(2)} CAD
              </span>
            </div>
          </div>

          {/* Customer notes */}
          {order.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                Your notes
              </p>
              <p className="text-sm text-gray-700 italic">
                &ldquo;{order.notes}&rdquo;
              </p>
            </div>
          )}

          {/* Proof section */}
          {order.proof_storage_path && (
            <div className="border border-violet-200 bg-violet-50 rounded-xl p-4">
              <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-3">
                Proof from True Color
                {order.proof_sent_at && (
                  <span className="ml-2 font-normal normal-case text-violet-400">
                    &mdash; sent{" "}
                    {new Date(
                      order.proof_sent_at
                    ).toLocaleDateString("en-CA", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </p>
              {/\.(jpg|jpeg|png|webp)$/i.test(
                order.proof_storage_path
              ) ? (
                <div>
                  <img
                    src={`${SUPABASE_STORAGE_URL}/${order.proof_storage_path}`}
                    alt="Print proof"
                    className="w-full rounded-lg border border-violet-200 mb-3"
                    style={{
                      maxHeight: "420px",
                      objectFit: "contain",
                      background: "#fff",
                    }}
                  />
                  <div className="flex gap-4 flex-wrap">
                    <a
                      href={`${SUPABASE_STORAGE_URL}/${order.proof_storage_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-violet-600 font-semibold hover:underline"
                    >
                      View full size &rarr;
                    </a>
                    <a
                      href={`${SUPABASE_STORAGE_URL}/${order.proof_storage_path}`}
                      download
                      className="text-xs text-violet-600 font-semibold hover:underline"
                    >
                      &darr; Download proof
                    </a>
                  </div>
                </div>
              ) : (
                <a
                  href={`${SUPABASE_STORAGE_URL}/${order.proof_storage_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-violet-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-violet-700 transition-colors"
                >
                  📄 Download proof PDF &rarr;
                </a>
              )}
              <div className="mt-3 bg-white border border-violet-100 rounded-lg px-3 py-2.5">
                <p className="text-xs text-gray-600 leading-relaxed">
                  Looks good? We&apos;ll proceed to print. Have
                  changes?{" "}
                  <a
                    href="tel:+13069548688"
                    className="text-[#16C2F3] font-semibold hover:underline"
                  >
                    (306) 954-8688
                  </a>{" "}
                  or{" "}
                  <a
                    href="mailto:info@true-color.ca"
                    className="text-[#16C2F3] font-semibold hover:underline"
                  >
                    info@true-color.ca
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Artwork upload — unpaid orders */}
          {order.status === "pending_payment" &&
            order.order_items.some(
              (i) => i.design_status !== "FULL_DESIGN"
            ) && (
              <div className="border border-gray-200 rounded-xl p-4 bg-white">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Your artwork file
                </p>
                {uploadDone.has(order.id) ? (
                  <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 font-semibold">
                    ✓ File uploaded &mdash; our team has been
                    notified.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 mb-3">
                      Upload your design file (PDF, AI, JPG, PNG, or
                      WebP &mdash; max 50 MB).
                      {order.order_items.some(
                        (i) => i.file_storage_path
                      ) &&
                        " Uploading a new file will replace the current one."}
                    </p>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf,.ai,.eps"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file)
                          onFileUpload(order.id, file);
                      }}
                      disabled={uploadingFile === order.id}
                      className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#f4efe9] file:text-[#1c1712] hover:file:bg-[#16C2F3] hover:file:text-white transition-colors"
                    />
                    {uploadingFile === order.id && (
                      <p className="text-xs text-gray-400 mt-2 animate-pulse">
                        Uploading\u2026
                      </p>
                    )}
                    {uploadError && uploadingFile === null && (
                      <p className="text-xs text-red-500 mt-2 bg-red-50 border border-red-100 rounded px-2 py-1.5">
                        {uploadError}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

          {/* Paid + processing — call-us for file changes */}
          {["payment_received", "in_production"].includes(
            order.status
          ) &&
            order.order_items.some(
              (i) => i.design_status !== "FULL_DESIGN"
            ) && (
              <div className="border border-gray-100 rounded-xl px-4 py-3 bg-white">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Need to update your file?
                </p>
                <p className="text-sm text-gray-600">
                  Your order is being processed. For file changes,
                  call us:{" "}
                  <a
                    href="tel:+13069548688"
                    className="text-[#16C2F3] font-semibold hover:underline"
                  >
                    (306) 954-8688
                  </a>
                </p>
              </div>
            )}

          {/* Bottom actions */}
          <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-gray-100">
            {order.status !== "pending_payment" && (
              <button
                onClick={() => onReorder(order)}
                className="text-sm font-semibold px-4 py-2 rounded-lg bg-[#f4efe9] text-[#1c1712] hover:bg-[#16C2F3] hover:text-white transition-colors"
              >
                Order same items again &rarr;
              </button>
            )}
            <a
              href={`mailto:info@true-color.ca?subject=Re: Order ${order.order_number}`}
              className="text-sm text-gray-400 hover:text-[#16C2F3] transition-colors"
            >
              ✉ Message us about this order
            </a>
          </div>

        </div>
      )}
    </div>
  );
}
