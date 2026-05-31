/**
 * Probe: does Wave's invoiceCreate accept a negative unitPrice line item?
 *
 * Creates a DRAFT invoice with one $100 positive line + one -$10 discount line
 * against a known test customer (hasan.sharif.realtor@gmail.com), inspects the
 * computed total, then deletes the invoice. No customer-facing send, no payment.
 *
 * Usage: railway run -- node scripts/test-wave-negative-unitprice.mjs
 */

const WAVE_GQL = "https://gql.waveapps.com/graphql/public";
const TOKEN = process.env.WAVE_API_TOKEN;
const BIZ = process.env.WAVE_BUSINESS_ID ?? "QnVzaW5lc3M6MGZlYTg0NzQtYjQ2Ny00YTEyLWI1NTgtZWZhNGM3NGM3ZTNj";
const PROD = "QnVzaW5lc3M6MGZlYTg0NzQtYjQ2Ny00YTEyLWI1NTgtZWZhNGM3NGM3ZTNjO1Byb2R1Y3Q6MTMwODU2NzUy";
const GST = "QnVzaW5lc3M6MGZlYTg0NzQtYjQ2Ny00YTEyLWI1NTgtZWZhNGM3NGM3ZTNjO1NhbGVzVGF4OjE5MzI0MzkyNDI=";
const TEST_EMAIL = "hasan.sharif.realtor@gmail.com";

if (!TOKEN) { console.error("WAVE_API_TOKEN missing"); process.exit(1); }

async function gql(query, variables) {
  const res = await fetch(WAVE_GQL, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: variables ?? {} }),
  });
  return res.json();
}

// 1. Find test customer
console.log("→ Locating test customer...");
const find = await gql(
  `query($b: ID!, $e: String!) { business(id: $b) { customers(email: $e) { edges { node { id email } } } } }`,
  { b: BIZ, e: TEST_EMAIL },
);
const customerId = find?.data?.business?.customers?.edges?.[0]?.node?.id;
if (!customerId) { console.error("Test customer not found:", JSON.stringify(find)); process.exit(1); }
console.log(`  customer: ${customerId}`);

// 2. Create invoice with one positive line + one negative line
console.log("\n→ Creating draft invoice: $100 product − $10 discount...");
const create = await gql(
  `mutation($input: InvoiceCreateInput!) {
    invoiceCreate(input: $input) {
      didSucceed
      inputErrors { path message code }
      invoice {
        id invoiceNumber status
        total { value } subtotal { value }
        items { description quantity unitPrice total { value } }
      }
    }
  }`,
  {
    input: {
      businessId: BIZ,
      customerId,
      status: "DRAFT",
      title: "PROBE — negative unitPrice test (DELETE ME)",
      memo: "Test only — will be deleted",
      items: [
        {
          productId: PROD,
          description: "Test product line",
          quantity: "1",
          unitPrice: "100.00",
          taxes: [{ salesTaxId: GST }],
        },
        {
          productId: PROD,
          description: "Test discount line",
          quantity: "1",
          unitPrice: "-10.00",
          taxes: [{ salesTaxId: GST }],
        },
      ],
    },
  },
);

console.log(JSON.stringify(create, null, 2));

const r = create?.data?.invoiceCreate;
if (!r?.didSucceed) {
  console.log(`\n✗ Wave REJECTED negative unitPrice.`);
  console.log("Errors:", JSON.stringify(r?.inputErrors ?? create?.errors));
  process.exit(2);
}

const inv = r.invoice;
console.log(`\n✓ Wave ACCEPTED negative unitPrice.`);
console.log(`  invoice #${inv.invoiceNumber} (${inv.status})`);
console.log(`  subtotal: $${inv.subtotal?.value}  total: $${inv.total?.value}`);
console.log(`  expected subtotal $90, total $94.50 (with 5% GST on $90)`);

// 3. Delete the test invoice
console.log(`\n→ Deleting test invoice ${inv.id}...`);
const del = await gql(
  `mutation($input: InvoiceDeleteInput!) {
    invoiceDelete(input: $input) {
      didSucceed
      inputErrors { message }
    }
  }`,
  { input: { invoiceId: inv.id } },
);
console.log(del?.data?.invoiceDelete?.didSucceed ? "  ✓ deleted" : `  ⚠ delete result: ${JSON.stringify(del)}`);
