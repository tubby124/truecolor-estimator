"use client";

import { useEffect, useRef } from "react";
import type { PstExemptionInput } from "@/lib/payment/pst-exemption";

interface Props {
  email: string;
  value: PstExemptionInput;
  onChange: (next: PstExemptionInput) => void;
  disabled?: boolean;
}

export function PstExemptionFields({ email, value, onChange, disabled = false }: Props) {
  const fetchedEmail = useRef("");
  const currentValue = useRef(value);
  const normalizedEmail = email.trim().toLowerCase();

  useEffect(() => {
    currentValue.current = value;
  }, [value]);

  useEffect(() => {
    if (!normalizedEmail || fetchedEmail.current === normalizedEmail) return;
    fetchedEmail.current = normalizedEmail;
    void fetch(`/api/staff/customers/pst-exemption?email=${encodeURIComponent(normalizedEmail)}`)
      .then(async (response) => response.ok ? response.json() as Promise<{ vendorNumber?: string | null }> : null)
      .then((data) => {
        // Do not let a slower lookup for a previous email populate a newly
        // selected customer.
        if (fetchedEmail.current !== normalizedEmail) return;
        if (data?.vendorNumber && !currentValue.current.vendorNumber) {
          onChange({ ...currentValue.current, vendorNumber: data.vendorNumber, rememberVendorNumber: true });
        }
      })
      .catch(() => undefined);
  }, [normalizedEmail, onChange, value]);

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      <label className="flex cursor-pointer items-start gap-2 text-sm font-semibold text-gray-800">
        <input
          type="checkbox"
          checked={value.enabled === true}
          disabled={disabled}
          onChange={(event) => onChange({
            ...value,
            enabled: event.target.checked,
            resaleConfirmed: event.target.checked ? value.resaleConfirmed : false,
          })}
          className="mt-0.5 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
        />
        Remove PST for this resale purchase
      </label>
      <p className="text-xs leading-relaxed text-amber-900">
        Use only the customer&apos;s PST vendor licence for goods bought strictly for resale. A registered consumer number cannot be used to remove PST. GST still applies.
      </p>
      {!value.enabled && value.vendorNumber && (
        <label className="block text-xs font-semibold text-gray-700">
          Saved PST vendor licence number
          <input
            type="text"
            value={value.vendorNumber}
            onChange={(event) => onChange({ ...value, vendorNumber: event.target.value, rememberVendorNumber: true, clearRememberedVendorNumber: false })}
            disabled={disabled}
            maxLength={64}
            className="mt-1.5 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
          <span className="mt-1 block font-normal text-gray-600">Editing this saved number does not remove PST from this document.</span>
        </label>
      )}
      {value.enabled && (
        <>
          <label className="block text-xs font-semibold text-gray-700">
            Customer PST vendor licence number
            <input
              type="text"
              value={value.vendorNumber ?? ""}
              onChange={(event) => onChange({ ...value, vendorNumber: event.target.value, clearRememberedVendorNumber: false })}
              disabled={disabled}
              maxLength={64}
              className="mt-1.5 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </label>
          <label className="flex cursor-pointer items-start gap-2 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={value.resaleConfirmed === true}
              disabled={disabled}
              onChange={(event) => onChange({ ...value, resaleConfirmed: event.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
            />
            I confirm the customer states these goods are being purchased for resale.
          </label>
          <label className="flex cursor-pointer items-start gap-2 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={value.rememberVendorNumber !== false}
              disabled={disabled}
              onChange={(event) => onChange({ ...value, rememberVendorNumber: event.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
            />
            Remember this number for this customer&apos;s future staff quotes.
          </label>
        </>
      )}
      {!value.enabled && value.vendorNumber && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange({ ...value, vendorNumber: "", clearRememberedVendorNumber: true })}
          className="text-xs font-semibold text-amber-800 underline underline-offset-2 disabled:opacity-50"
        >
          Clear saved PST vendor licence number
        </button>
      )}
    </section>
  );
}
