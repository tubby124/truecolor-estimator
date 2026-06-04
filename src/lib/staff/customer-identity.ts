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

/**
 * When a customer is picked from the past orders list (reorder),
 * replace the form fields exactly with the picked customer's data.
 * Null/undefined fields become empty strings.
 */
export function applyPickedCustomer<T extends ManualOrderContactForm>(
  form: T,
  picked: {
    email: string;
    name: string;
    company: string | null;
    phone: string | null;
  }
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
 * When a customer lookup returns a saved customer for the email currently in the form,
 * overwrite the form's name/company/phone with the saved data (null/undefined -> empty string).
 * Returns the updated form and a warning flag if data was overwritten.
 * If the lookup email does not match the form's email, ignore the result (return ignored: true).
 * If the lookup does not exist, return form unchanged.
 */
export function applyCustomerLookupResult<T extends ManualOrderContactForm>(
  form: T,
  lookupEmail: string,
  lookupResult: {
    exists: boolean;
    name?: string;
    company?: string | null;
    phone?: string | null;
    orderCount?: number;
  }
): {
  form: T;
  warning?: string;
  ignored?: boolean;
} {
  const normalizedFormEmail = form.email.trim().toLowerCase();
  const normalizedLookupEmail = lookupEmail.trim().toLowerCase();

  if (!lookupResult.exists) {
    return { form };
  }

  if (normalizedLookupEmail !== normalizedFormEmail) {
    return { form, ignored: true };
  }

  // Overwrite name, company, phone with lookup data (empty string if null/undefined)
  const updated: T = {
    ...form,
    name: lookupResult.name ?? "",
    company: lookupResult.company ?? "",
    phone: lookupResult.phone ?? "",
  };

  return {
    form: updated,
    warning: "Saved customer matched — form updated with saved data.",
  };
}

/**
 * Normalize contact data for submission: trim whitespace, convert email to lowercase,
 * and convert empty company/phone to undefined (so Supabase upsert stores NULL).
 */
export function normalizeContactForSubmit(
  contact: ManualOrderContactForm
): ManualOrderSubmitContact {
  return {
    name: contact.name.trim(),
    email: contact.email.trim().toLowerCase(),
    company: contact.company.trim() === "" ? undefined : contact.company.trim(),
    phone: contact.phone.trim() === "" ? undefined : contact.phone.trim(),
  };
}