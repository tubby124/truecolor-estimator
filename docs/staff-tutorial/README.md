# Custom Quote walkthrough — for True Color staff

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

Type the customer's email first — if they've ordered before, name/company/phone autofill. New customers get a Supabase account created automatically.

## 4. Line 1 — "Your Off-Site Creative Department" (foamboard 11×17, qty 2)

![Step 4 — line 1](./04-line-1.png)

- **Line Title:** "Your Off-Site Creative Department" (shows on invoice as headline)
- **Product:** Foamboard Displays (the dropdown is for categorization, not pricing)
- **Qty:** 2
- **Size & Details:** "5mm foamboard, 1-side, 11×17 in, matte lamination"
- **Unit Price:** $18.00 → **Line Total** auto-fills to $36.00

## 5. Line 2 — "The Power of Branding" (foamboard 18×24, qty 1)

![Step 5a — + Add Item](./05a-add-item.png)

Click **+ Add Item** at the bottom of the items list (up to 10 lines per quote).

![Step 5 — line 2](./05-line-2.png)

Same Foamboard Displays category, different size + price.

## 6. Line 3 — "Win 1 Month of Design" (cardstock flyer 8.5×11, qty 1)

![Step 6a — + Add Item](./06a-add-item.png)

![Step 6 — line 3](./06-line-3.png)

Cardstock with lamination at qty 1 — something the estimator catalog can't generate. Pick **"Paper / Document Printing"** category (or **"Flyers & Brochures"**) and type the exact price.

## 7. Line 4 — Business Cards (250 × $0.18)

![Step 7a — + Add Item](./07a-add-item.png)

![Step 7 — line 4](./07-line-4.png)

No title needed — the product name speaks for itself. Type **$0.18** unit price, qty **250** → line total auto-fills to **$45.00**.

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

| Job type | Use estimator (`/staff`) | Use Custom Quote |
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

*Regenerated: 2026-05-11 — by manual-order-walkthrough.spec.ts*
