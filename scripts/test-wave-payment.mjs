/**
 * Fires a real $1 Wave invoice to hasan.sharif@exprealty.com to verify
 * Wave's hosted-payment-page → /api/webhooks/wave end-to-end chain.
 *
 * Usage: railway run -- node scripts/test-wave-payment.mjs
 */

const WAVE_GQL = "https://gql.waveapps.com/graphql/public";
const TOKEN = process.env.WAVE_API_TOKEN;
const BIZ = "QnVzaW5lc3M6MGZlYTg0NzQtYjQ2Ny00YTEyLWI1NTgtZWZhNGM3NGM3ZTNj";
const PROD = "QnVzaW5lc3M6MGZlYTg0NzQtYjQ2Ny00YTEyLWI1NTgtZWZhNGM3NGM3ZTNjO1Byb2R1Y3Q6MTMwODU2NzUy";

const TEST_EMAIL = "hasan.sharif@exprealty.com";
const TEST_NAME  = "Hasan Sharif (Wave integration test)";

if (!TOKEN) { console.error("WAVE_API_TOKEN missing"); process.exit(1); }

async function gql(query, variables) {
  const res = await fetch(WAVE_GQL, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: variables ?? {} }),
  });
  const json = await res.json();
  if (json.errors) {
    console.error("GraphQL errors:", JSON.stringify(json.errors, null, 2));
    process.exit(1);
  }
  return json.data;
}

// 1. Find or create customer
let { business } = await gql(
  `query($bizId: ID!, $email: String!) {
    business(id: $bizId) { customers(email: $email) { edges { node { id email } } } }
  }`,
  { bizId: BIZ, email: TEST_EMAIL }
);
let customerId = business?.customers?.edges?.[0]?.node?.id;

if (!customerId) {
  const r = await gql(
    `mutation($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        didSucceed inputErrors { message } customer { id }
      }
    }`,
    { input: { businessId: BIZ, name: TEST_NAME, email: TEST_EMAIL } }
  );
  if (!r.customerCreate.didSucceed) {
    console.error("customerCreate failed:", r.customerCreate.inputErrors);
    process.exit(1);
  }
  customerId = r.customerCreate.customer.id;
  console.log("Created Wave customer:", customerId);
} else {
  console.log("Found existing Wave customer:", customerId);
}

// 2. Create $1 invoice (DRAFT, no tax to keep math clean)
const today = new Date().toISOString().slice(0, 10);
const createInv = await gql(
  `mutation($input: InvoiceCreateInput!) {
    invoiceCreate(input: $input) {
      didSucceed
      inputErrors { path message }
      invoice { id invoiceNumber pdfUrl viewUrl status }
    }
  }`,
  {
    input: {
      businessId: BIZ,
      customerId,
      status: "DRAFT",
      title: "TEST — Wave integration check (refundable)",
      memo: "Integration smoke test. Refund this after payment confirms webhook.",
      invoiceDate: today,
      items: [
        {
          productId: PROD,
          description: "Wave webhook integration test — $1 refundable",
          unitPrice: "1.00",
          quantity: 1,
        },
      ],
    },
  }
);

if (!createInv.invoiceCreate.didSucceed) {
  console.error("invoiceCreate failed:", createInv.invoiceCreate.inputErrors);
  process.exit(1);
}
const inv = createInv.invoiceCreate.invoice;
console.log("Created invoice:", inv.invoiceNumber, "(", inv.id, ")");

// 3. Approve the invoice (DRAFT → SAVED)
const approve = await gql(
  `mutation($input: InvoiceApproveInput!) {
    invoiceApprove(input: $input) {
      didSucceed inputErrors { message } invoice { id status viewUrl pdfUrl }
    }
  }`,
  { input: { invoiceId: inv.id } }
);
if (!approve.invoiceApprove.didSucceed) {
  console.error("invoiceApprove failed:", approve.invoiceApprove.inputErrors);
  process.exit(1);
}
const approved = approve.invoiceApprove.invoice;
console.log("Approved. Status:", approved.status);

console.log("\n========================================");
console.log("VIEW URL (open + pay this):");
console.log(approved.viewUrl);
console.log("========================================");
console.log("\nInvoice number:", inv.invoiceNumber);
console.log("Wave invoice ID:", inv.id);
console.log("PDF URL:", approved.pdfUrl);
