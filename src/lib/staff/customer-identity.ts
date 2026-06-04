export interface ManualOrderContactForm {
  name: string;
  email: string;
  company: string;
  phone: string;
}

export interface ManualOrderSubmitContact {
  name: string;
  email: string;
  company?: string;
  phone?: string;
}

export interface SavedCustomerData {
  name: string;
  company: string | null;
  phone: string | null;
}

export interface LookupClassifierInput {
  exists: boolean;
  name?: string;
  company?: string | null;
  phone?: string | null;
  orderCount?: number;
}

export type CustomerLookupAction<T extends ManualOrderContactForm> =
  | { kind: "ignore_stale_email" }
  | { kind: "no_match" }
  | { kind: "autofill"; form: T; saved: SavedCustomerData; filledFields: Array<"name" | "company" | "phone"> }
  | { kind: "offer"; saved: SavedCustomerData; conflicts: Array<"name" | "company" | "phone"> };

function trimEq(a: string | null | undefined, b: string | null | undefined): boolean {
  return (a ?? "").trim() === (b ?? "").trim();
}

/**
 * Decide what to do with a customer-lookup response. Pure inspector — does not mutate
 * the form. Caller branches on `kind` and either:
 *   - "ignore_stale_email" → drop the response (email field has changed since request fired)
 *   - "no_match" → set UI status to "new"
 *   - "autofill" → caller calls setForm(prev => action.form) to fill blank fields
 *   - "offer" → caller shows a banner with `saved` data + [Use saved] / [Keep mine] buttons
 *
 * "autofill" only fires when every typed field either matches the saved value or is blank.
 * The moment a typed value diverges from saved, we switch to "offer" and never overwrite
 * the staff member's input silently.
 */
export function classifyCustomerLookup<T extends ManualOrderContactForm>(
  form: T,
  lookupEmail: string,
  result: LookupClassifierInput,
): CustomerLookupAction<T> {
  const normalizedFormEmail = form.email.trim().toLowerCase();
  const normalizedLookupEmail = lookupEmail.trim().toLowerCase();

  if (normalizedLookupEmail !== normalizedFormEmail) {
    return { kind: "ignore_stale_email" };
  }

  if (!result.exists) {
    return { kind: "no_match" };
  }

  const saved: SavedCustomerData = {
    name: result.name ?? "",
    company: result.company ?? null,
    phone: result.phone ?? null,
  };

  const conflicts: Array<"name" | "company" | "phone"> = [];
  const filledFields: Array<"name" | "company" | "phone"> = [];

  for (const field of ["name", "company", "phone"] as const) {
    const typed = form[field].trim();
    const savedValue = field === "name" ? saved.name : saved[field] ?? "";

    if (typed === "") {
      if (savedValue.trim()) filledFields.push(field);
    } else if (!trimEq(typed, savedValue)) {
      conflicts.push(field);
    }
  }

  if (conflicts.length > 0) {
    return { kind: "offer", saved, conflicts };
  }

  const next: T = { ...form };
  if (filledFields.includes("name")) next.name = saved.name;
  if (filledFields.includes("company")) next.company = saved.company ?? "";
  if (filledFields.includes("phone")) next.phone = saved.phone ?? "";

  return { kind: "autofill", form: next, saved, filledFields };
}

/**
 * Explicit-overwrite path: used by the search-dropdown pick AND by "Use saved data"
 * on the offer banner. These are the only paths that destroy typed input — both require
 * an intentional click.
 */
export function applyPickedCustomer<T extends ManualOrderContactForm>(
  form: T,
  picked: { email: string; name: string; company: string | null; phone: string | null },
): T {
  return {
    ...form,
    email: picked.email,
    name: picked.name,
    company: picked.company ?? "",
    phone: picked.phone ?? "",
  };
}

/**
 * Normalize contact data for submission: trim whitespace, lowercase the email, and
 * convert empty company/phone to undefined so Supabase stores NULL.
 */
export function normalizeContactForSubmit(
  contact: ManualOrderContactForm,
): ManualOrderSubmitContact {
  return {
    name: contact.name.trim(),
    email: contact.email.trim().toLowerCase(),
    company: contact.company.trim() === "" ? undefined : contact.company.trim(),
    phone: contact.phone.trim() === "" ? undefined : contact.phone.trim(),
  };
}
