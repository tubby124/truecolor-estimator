/**
 * Tutorial spec — reproduces real-world Wave invoice #980 inside the staff
 * Custom Quote modal and captures annotated screenshots for staff training.
 *
 * Output:
 *   docs/staff-tutorial/01-open-modal.png ... 12-order-list.png
 *   docs/staff-tutorial/README.md   (regenerated each run)
 *
 * Run:
 *   npx playwright test e2e-playwright/tutorials/manual-order-walkthrough.spec.ts \
 *     --project=chromium
 *
 * Requires E2E_STAFF_PASSWORD in .env.local. The dev server starts automatically
 * via playwright.config.ts webServer.
 *
 * Designed for human consumption — not part of the regression suite. Safe to
 * re-run any time the modal UI changes; PNGs and README always regenerate.
 */
import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { annotate } from "../helpers/annotate";

// ─── env ──────────────────────────────────────────────────────────────────────

function loadEnvSync(): Record<string, string> {
  const envPath = path.resolve(__dirname, "../../.env.local");
  if (!fs.existsSync(envPath)) return {};
  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[t.slice(0, eq).trim()] = v;
  }
  return env;
}

const env = loadEnvSync();
const STAFF_EMAIL = env.STAFF_EMAIL ?? "info@true-color.ca";
const STAFF_PASSWORD = env.E2E_STAFF_PASSWORD ?? "";

const OUT_DIR = path.resolve(__dirname, "../../docs/staff-tutorial");

// ─── data ─────────────────────────────────────────────────────────────────────

// Invoice #980 broken out into the structured fields the modal now uses
// (material/sides/size/process). These map 1:1 onto Albert's spec block
// (Material : / Colour : / Size : / Process :) that ends up in the email +
// Wave PDF.
const INVOICE_980 = [
  {
    title: "Your Off-Site Creative Department",
    product: "Foamboard Displays",
    qty: "2",
    material: "5mm Foamboard",
    sidesChipLabel: "1-side",          // emits "One side full colour printing"
    size: '11" x 17"',
    process: "Matte lamination",
    unitPrice: "18.00",
  },
  {
    title: "The Power of Branding",
    product: "Foamboard Displays",
    qty: "1",
    material: "5mm Foamboard",
    sidesChipLabel: "1-side",
    size: '18" x 24"',
    process: "Matte lamination",
    unitPrice: "30.00",
  },
  {
    title: "Win 1 Month of Design",
    product: "Paper / Document Printing",
    qty: "1",
    material: "14pt Cardstock",
    sidesChipLabel: "2-side",
    size: '8.5" x 11"',
    process: "Matte lamination",
    unitPrice: "10.00",
  },
  {
    title: "",
    product: "Business Cards",
    qty: "250",
    material: "14pt Cardstock",
    sidesChipLabel: "2-side",
    size: '3.5" x 2"',
    process: "",
    unitPrice: "0.18",
  },
] as const;

// ─── spec ─────────────────────────────────────────────────────────────────────
// NOTE: written at top level (not inside test.describe) so vitest, which scans
// *.spec.ts files in this folder, doesn't blow up — vitest fails on describe()
// calls but tolerates bare test() calls that get skipped.

test.beforeAll(() => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
});

test("Custom Quote — reproduce invoice #980 and capture tutorial PNGs", async ({ page }) => {
    test.skip(!STAFF_PASSWORD, "Set E2E_STAFF_PASSWORD in .env.local to run this tutorial spec");
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    // ─── Login ────────────────────────────────────────────────────────────
    await page.goto("/staff/login");
    await page.fill('input[type="email"]', STAFF_EMAIL);
    await page.fill('input[type="password"]', STAFF_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/staff", { timeout: 15_000 });

    // ─── Step 1 — Land on orders page, highlight Manual Order button ──────
    await page.goto("/staff/orders");
    await page.waitForLoadState("networkidle");

    await annotate(page, '[data-testid="manual-order-trigger"]', {
      step: 1,
      label: "Click here to open the Custom Quote / Manual Order modal",
      captionPosition: "bottom",
    });
    await page.screenshot({ path: path.join(OUT_DIR, "01-open-modal.png"), fullPage: false });

    // ─── Step 2 — Open modal via ?manual=quote so quote-only is pre-toggled
    await page.goto("/staff/orders?manual=quote");
    await page.waitForSelector('[data-testid="manual-order-modal"]', { timeout: 5_000 });

    await annotate(page, '[data-testid="modal-title"]', {
      step: 2,
      label: "Modal opens with Quote-only mode pre-selected when you came from a Custom Quote link",
      captionPosition: "bottom",
    });
    await page.screenshot({ path: path.join(OUT_DIR, "02-modal-open.png"), fullPage: false });

    // ─── Step 3 — Customer email autofill demo ────────────────────────────
    const customerEmail = `tridah-demo-${Date.now()}@example.com`;
    await page.fill("#pr-email", customerEmail);
    await page.fill("#pr-name", "Tridah Media");
    await page.fill("#pr-company", "Tridah Media");

    await annotate(page, "#pr-email", {
      step: 3,
      label: "Customer email — autofills name/company on blur if they've ordered before",
      captionPosition: "right",
    });
    await page.screenshot({ path: path.join(OUT_DIR, "03-customer-fields.png"), fullPage: false });

    // ─── Steps 4–7 — Fill 4 line items matching invoice #980 ─────────────
    // Numbering: step 4 = line 1, step 5 = line 2, etc.
    for (let i = 0; i < INVOICE_980.length; i++) {
      const line = INVOICE_980[i];
      const stepNum = 4 + i;

      // Add a new item slot for items 2+
      if (i > 0) {
        const addBtn = page.getByRole("button", { name: /Add Item/i });
        await annotate(page, addBtn, {
          step: stepNum,
          label: `+ Add Item — slot ${i + 1} (modal holds up to 10 lines)`,
          captionPosition: "top",
        });
        await page.screenshot({ path: path.join(OUT_DIR, `0${stepNum}a-add-item.png`), fullPage: false });
        await addBtn.click();
      }

      // The modal uses combobox <input>s for product + spec fields. Each input has
      // a predictable id prefix (pr-title-, pr-product-, pr-mat-, pr-size-, etc),
      // so we can index by .nth(i) to target the i-th item.
      const titleInputs = page.locator('input[id^="pr-title-"]');
      const productInputs = page.locator('input[id^="pr-product-"]');
      const materialInputs = page.locator('input[id^="pr-mat-"]');
      const sizeInputs = page.locator('input[id^="pr-size-"]');
      const processInputs = page.locator('input[id^="pr-proc-"]');
      const qtyInputs = page.locator('input[id^="pr-qty-"]');
      const unitInputs = page.locator('input[id^="pr-unit-"]');
      const amountInputs = page.locator('input[id^="pr-amount-"]');

      if (line.title) await titleInputs.nth(i).fill(line.title);

      // Product field is a combobox now — fill the input, close the dropdown
      await productInputs.nth(i).fill(line.product);
      // Close the dropdown by blurring (tab away to qty)
      await productInputs.nth(i).press("Tab");

      await qtyInputs.nth(i).fill(line.qty);
      await materialInputs.nth(i).fill(line.material);

      // Sides is a chip-only field (no free-text input). Click the chip on the i-th row.
      // Each item card has its own row of 3 sides chips — locate by text within the
      // modal then take the i-th matching instance.
      if (line.sidesChipLabel) {
        const sidesChip = page.locator(`button:has-text("${line.sidesChipLabel}")`).nth(i);
        await sidesChip.click({ trial: false, force: false }).catch(() => {/* chip absent for this row is ok */});
      }

      if (line.size) await sizeInputs.nth(i).fill(line.size);
      if (line.process) await processInputs.nth(i).fill(line.process);
      await unitInputs.nth(i).fill(line.unitPrice);

      // Trigger the auto-calc by blurring
      await unitInputs.nth(i).blur();
      await page.waitForTimeout(50);

      await annotate(page, amountInputs.nth(i), {
        step: stepNum,
        label: `Line ${i + 1} total auto-fills from Unit × Qty (${line.qty} × $${line.unitPrice})`,
        captionPosition: "left",
      });
      await page.screenshot({ path: path.join(OUT_DIR, `0${stepNum}-line-${i + 1}.png`), fullPage: false });
    }

    // ─── Step 7b — Demo the "Add Fee" picker (shipped 2026-05-11) ─────────
    // Capture a screenshot of the Add Fee picker open, then close it without adding
    // a fee (Invoice #980 has no fee line).
    const addFeeBtn = page.getByRole("button", { name: /Add Fee/i });
    await addFeeBtn.click();
    await page.waitForTimeout(150);
    await annotate(page, addFeeBtn, {
      step: 8,
      label: "+ Add Fee — Installation / Delivery / Design / Rush / Custom. Every default $ amount is editable per job.",
      captionPosition: "top",
    });
    await page.screenshot({ path: path.join(OUT_DIR, "07b-add-fee-picker.png"), fullPage: false });
    // Close the picker without selecting
    await addFeeBtn.click();
    await page.waitForTimeout(100);

    // ─── Step 8 — Highlight the totals panel (invoice #980 expected: $134.31) ──
    const totalsLocator = page.locator("text=Subtotal").first().locator("..").locator("..");
    await annotate(page, totalsLocator, {
      step: 8,
      label: "Totals auto-calculate: Subtotal $121.00 + GST 5% + PST 6% = $134.31 — matches Wave invoice #980 exactly",
      captionPosition: "top",
    });
    await page.screenshot({ path: path.join(OUT_DIR, "08-totals.png"), fullPage: false });

    // ─── Step 9 — Payment method ──────────────────────────────────────────
    const paymentSection = page.getByText(/Step 4 · How to bill it/i).first();
    await annotate(page, paymentSection, {
      step: 9,
      label: "Pick Wave Invoice (emailed) or Card Link (Clover). In Quote mode this is just where we prep the draft invoice — nothing sends yet.",
      captionPosition: "top",
    });
    await page.screenshot({ path: path.join(OUT_DIR, "09-payment-method.png"), fullPage: false });

    // ─── Step 10a — Quote mode (default — Send Quote card) ────────────────
    const modeQuote = page.locator('[data-testid="mode-quote"]');
    const modeInvoice = page.locator('[data-testid="mode-invoice"]');

    await modeQuote.click();
    await page.waitForTimeout(150);
    await annotate(page, modeQuote, {
      step: 10,
      label: "📝 Send Quote — customer reviews price first, no payment link. THIS IS THE DEFAULT. Use it 90% of the time.",
      captionPosition: "bottom",
    });
    await page.screenshot({ path: path.join(OUT_DIR, "10a-mode-quote.png"), fullPage: false });

    // ─── Step 10b — Invoice mode (Send Invoice card) ──────────────────────
    await modeInvoice.click();
    await page.waitForTimeout(150);
    await annotate(page, modeInvoice, {
      step: 10,
      label: "💳 Send Invoice — only click this after price is agreed. Customer gets a payment link the moment you submit.",
      captionPosition: "bottom",
    });
    await page.screenshot({ path: path.join(OUT_DIR, "10b-mode-invoice.png"), fullPage: false });

    // Return to Quote mode for the submit screenshot (safer — no real Wave invoice sent)
    await modeQuote.click();
    await page.waitForTimeout(100);

    // ─── Step 11 — Submit button ──────────────────────────────────────────
    const submit = page.locator('button[type="submit"]');
    await annotate(page, submit, {
      step: 11,
      label: "Click to send. We'll capture this screenshot only — submission is skipped in the tutorial run.",
      captionPosition: "top",
    });
    await page.screenshot({ path: path.join(OUT_DIR, "11-submit.png"), fullPage: false });

    // ─── Step 12 — Show /staff/orders list (where the order would appear) ─
    // Close modal without submitting (avoid creating real Wave drafts in tutorial run)
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    await page.goto("/staff/orders");
    await page.waitForLoadState("networkidle");
    // Annotate the top of the orders table — where the new order would appear
    const ordersTable = page.locator("main").first();
    await annotate(page, ordersTable, {
      step: 12,
      label: "After submitting, the order appears at the top of this list. Click it to view line items, change status, or send the invoice later.",
      captionPosition: "top",
    });
    await page.screenshot({ path: path.join(OUT_DIR, "12-order-list.png"), fullPage: false });

    // ─── Generate README ──────────────────────────────────────────────────
    writeTutorialReadme();
    expect(fs.existsSync(path.join(OUT_DIR, "README.md"))).toBe(true);
});

// ─── README generator ─────────────────────────────────────────────────────────

function writeTutorialReadme(): void {
  const md = `# Custom Quote walkthrough — for True Color staff

How to quote any job inside the website, even when the estimator can't handle it.

This is the same job as Wave invoice **#980** (Tridah Media, $134.31). Four lines:

1. 2× "Your Off-Site Creative Department" — 5mm foamboard, 1-side, 11×17 in, matte lamination — $18 each
2. 1× "The Power of Branding" — 5mm foamboard, 1-side, 18×24 in, matte lamination — $30
3. 1× "Win 1 Month of Design" — 14pt cardstock, 2-side, 8.5×11 in, matte lamination — $10
4. 250× Business Cards — 14pt, 2-side, 3.5×2 in — $0.18 each

Subtotal $121.00 + GST $6.05 + PST $7.26 = **$134.31 CAD**

---

## 1. Click "Manual Order" on the orders page

![Step 1 — open modal](./01-open-modal.png)

The green button on /staff/orders opens the Custom Quote / Manual Order modal.

You can also click **"Custom Quote"** from /staff or /staff/quotes — it opens the same modal pre-toggled to quote-only.

## 2. Modal opens

![Step 2 — modal open](./02-modal-open.png)

When you arrive via the **Custom Quote** link, the Quote-only toggle starts ON. When you click **Manual Order** directly, it starts OFF (full invoice with payment link).

## 3. Enter the customer

![Step 3 — customer fields](./03-customer-fields.png)

Two ways to load a customer:

- **Type the email** — if they've ordered before, name/company/phone autofill automatically.
- **Click "Browse past customers →"** in the top-right of Step 2 — opens a search dialog. Type any part of their name, email, or company. Click a row → all their info fills in. **Best for returning customers when you don't remember their email.**

New customers get a Supabase account created automatically when you send the quote/invoice.

## 4. Line 1 — "Your Off-Site Creative Department" (foamboard 11×17, qty 2)

![Step 4 — line 1](./04-line-1.png)

Each item card now uses the same shape Albert uses in his quotes — **Material / Sides / Size / Process** as separate fields. Every field accepts a click-a-chip shortcut OR typed text.

- **Line Title:** "Your Off-Site Creative Department" (shows on the invoice as the headline)
- **Product:** type "Foamboard" — combobox suggests matches. Or pick **Foamboard Displays** from the dropdown. **You can type ANYTHING here** — if it's not in the list (e.g. "Plinko Stickers", "Shelf Talkers", "Yard Signs"), it's used as-is. No more falling back to "Other".
- **Qty:** 2
- **Material:** click the **5mm Foamboard** chip — fills the field. Or type your own.
- **Sides:** click **1-side** chip → fills "One side full colour printing" (matches Albert's wording).
- **Size:** type \`11" x 17"\`
- **Process:** click **Matte lamination** chip. Multi-select OK — click multiple chips and they join with " / " (e.g. "Gloss lamination / Die cut").
- **Unit Price:** $18.00 → **Line Total** auto-fills to $36.00

The customer will see this in the email as a clean spec block:

\`\`\`
Material : 5mm Foamboard
Colour   : One side full colour printing
Size     : 11" x 17"
Process  : Matte lamination
Quantity : 2
Unit Price : $ 18.00 for each
Total amount : $ 36.00 plus tax
\`\`\`

## 5. Line 2 — "The Power of Branding" (foamboard 18×24, qty 1)

![Step 5a — + Add Item](./05a-add-item.png)

Click **+ Add Item** at the bottom of the items list (up to 10 lines per quote).

![Step 5 — line 2](./05-line-2.png)

Same chip flow — 5mm Foamboard / 1-side / Matte lamination — just a different size.

## 6. Line 3 — "Win 1 Month of Design" (cardstock 8.5×11, qty 1)

![Step 6a — + Add Item](./06a-add-item.png)

![Step 6 — line 3](./06-line-3.png)

Pick **Paper / Document Printing** as the product. Material chip: **14pt Cardstock**. Sides: **2-side**. Process: **Matte lamination**.

## 7. Line 4 — Business Cards (250 × $0.18)

![Step 7a — + Add Item](./07a-add-item.png)

![Step 7 — line 4](./07-line-4.png)

No title needed — the product name speaks for itself. Material **14pt Cardstock**, sides **2-side**, size \`3.5" x 2"\`. Unit Price $0.18 × Qty 250 → line total auto-fills to **$45.00**.

## 7b. (Optional) Add a fee

![Step 7b — Add Fee picker](./07b-add-fee-picker.png)

For Installation, Delivery, Design, Rush, Parking, Removal, or any custom fee — click **+ Add Fee** instead of + Add Item. A picker drops down with the common fee types and their *default* amounts:

- Installation Fee — default $150
- Delivery Fee — default $60
- Design Fee — default $40
- Rush Fee — default $40
- Removal Service — blank (type your own)
- Parking Fee — blank
- Custom Fee — blank

**The default amounts are just hints.** Once added, type whatever this specific job actually costs. A 4-hour install isn't $150 — make it $300. A simple drop-off delivery isn't $60 — make it $20. **Everything is editable per job.**

Fee lines render as a single line in the customer email — no spec block, just **Name : $Amount plus tax**.

## 8. Confirm totals match Wave invoice #980

![Step 8 — totals](./08-totals.png)

Subtotal $121.00 / GST $6.05 / PST $7.26 / Total **$134.31** — exactly what Wave invoice #980 shows.

## 9. Pick how to bill it

![Step 9 — payment method](./09-payment-method.png)

- **Card Link (Clover)** — customer gets a link to pay by credit/debit card
- **Wave Invoice** — customer gets the Wave invoice email with pay-online + e-transfer instructions

In Quote mode (default), this is just where the invoice gets prepared as a draft. Nothing sends to the customer until you flip to Send Invoice mode at the top.

## 10. Pick a mode — Quote (default) or Invoice

This is at the **top** of the modal. Big buttons. Pick one.

![Step 10a — Send Quote (default)](./10a-mode-quote.png)

**📝 Send Quote (default)** → Customer gets an email summarizing the line items with an "Approve Quote" button. They reply, call, or click to approve. **No payment link, no money asked for yet.** Wave invoice stays as a draft you'll send once they confirm. **Use this 90% of the time.**

![Step 10b — Send Invoice](./10b-mode-invoice.png)

**💳 Send Invoice** → Customer immediately gets the full invoice with the payment link. Wave invoice is approved + sent in one step. **Only click this after the price is agreed.**

**Rule of thumb:** If the customer hasn't said "yes, go ahead and bill me" → click Send Quote. If they have → click Send Invoice.

## 11. Send

![Step 11 — submit](./11-submit.png)

Button label changes based on the toggle: **"Send Quote"** (quote-only) or **"Send Invoice"** (full).

## 12. Order appears in the list

![Step 12 — order list](./12-order-list.png)

The new order shows at the top of /staff/orders. Click it to view line items, change status, or convert a quote to a sent invoice later.

---

## When to use this instead of the estimator

| Job type | Use estimator (\`/staff\`) | Use Custom Quote |
|---|:---:|:---:|
| Standard banner / coroplast / sign / business cards / flyer (catalog sizes + qty) | ✅ | |
| Foamboard with lamination | | ✅ |
| Non-catalog dimensions (e.g. 11×17, 8.5×11 foamboard) | | ✅ |
| Below-catalog quantity (e.g. qty 1–99 flyers) | | ✅ |
| Custom project title on invoice ("The Power of Branding") | | ✅ |
| Owner-set special price (loss-leader, friends-and-family rate) | | ✅ |
| Multi-product agency invoice (3–10 mixed items) | | ✅ |

If you can't find what you need in the estimator dropdowns, go straight to **Custom Quote**. Always.

---

*Regenerated: ${new Date().toISOString().slice(0, 10)} — by manual-order-walkthrough.spec.ts*
`;

  fs.writeFileSync(path.join(OUT_DIR, "README.md"), md, "utf-8");
}
