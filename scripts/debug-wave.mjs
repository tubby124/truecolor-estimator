/**
 * Debug Wave invoice creation by calling the GraphQL endpoint with the
 * EXACT same shape as the production code path (src/lib/wave/invoice.ts).
 *
 * Usage: railway run -- node scripts/debug-wave.mjs
 */

const WAVE_GQL = "https://gql.waveapps.com/graphql/public";
const TOKEN = process.env.WAVE_API_TOKEN;
const BIZ = "QnVzaW5lc3M6MGZlYTg0NzQtYjQ2Ny00YTEyLWI1NTgtZWZhNGM3NGM3ZTNj";
const PROD = "QnVzaW5lc3M6MGZlYTg0NzQtYjQ2Ny00YTEyLWI1NTgtZWZhNGM3NGM3ZTNjO1Byb2R1Y3Q6MTMwODU2NzUy";
const GST = "QnVzaW5lc3M6MGZlYTg0NzQtYjQ2Ny00YTEyLWI1NTgtZWZhNGM3NGM3ZTNjO1NhbGVzVGF4OjE5MzI0MzkyNDI=";
const PST = "QnVzaW5lc3M6MGZlYTg0NzQtYjQ2Ny00YTEyLWI1NTgtZWZhNGM3NGM3ZTNjO1NhbGVzVGF4OjE5MzI0MzkyNTg=";

if (!TOKEN) { console.error("WAVE_API_TOKEN missing"); process.exit(1); }

async function waveQuery(query, variables) {
  const res = await fetch(WAVE_GQL, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: variables ?? {} }),
  });
  return res.json();
}

// 1. Find customer by email (using proper variables)
console.log("=== 1. Find customer by email ===");
const findResp = await waveQuery(
  `query($bizId: ID!, $email: String!) {
    business(id: $bizId) {
      customers(email: $email) {
        edges { node { id email name } }
      }
    }
  }`,
  { bizId: BIZ, email: "hasan.sharif.realtor@gmail.com" }
);
console.log(JSON.stringify(findResp, null, 2).slice(0, 600));

let customerId = findResp?.data?.business?.customers?.edges?.[0]?.node?.id;

if (!customerId) {
  console.log("\n=== 1b. Create customer (none found) ===");
  const createResp = await waveQuery(
    `mutation($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        didSucceed
        inputErrors { path message code }
        customer { id name email }
      }
    }`,
    { input: { businessId: BIZ, name: "Wave Debug Test", email: "hasan.sharif.realtor@gmail.com" } }
  );
  console.log(JSON.stringify(createResp, null, 2));
  customerId = createResp?.data?.customerCreate?.customer?.id;
}

console.log("\nCustomer ID:", customerId);

if (!customerId) { console.error("\nABORTING — no customer ID"); process.exit(1); }

// 2. Create the invoice — exact shape from src/lib/wave/invoice.ts:144
console.log("\n=== 2. invoiceCreate (actual production shape) ===");
const invoiceResp = await waveQuery(
  `mutation($input: InvoiceCreateInput!) {
    invoiceCreate(input: $input) {
      didSucceed
      inputErrors { path message code }
      invoice { id invoiceNumber pdfUrl viewUrl }
    }
  }`,
  {
    input: {
      businessId: BIZ,
      customerId,
      status: "DRAFT",
      title: "WAVE DEBUG TEST — safe to delete",
      memo: "Pickup at 216 33rd St W, Saskatoon SK.",
      items: [
        {
          productId: PROD,
          description: "Test 50 business cards",
          quantity: "1",
          unitPrice: "65.00",
          taxes: [{ salesTaxId: GST }, { salesTaxId: PST }],
        },
      ],
    },
  }
);
console.log(JSON.stringify(invoiceResp, null, 2));

if (invoiceResp?.data?.invoiceCreate?.didSucceed) {
  const inv = invoiceResp.data.invoiceCreate.invoice;
  console.log("\n✅ Invoice created:", inv.id, inv.invoiceNumber);
  console.log("   View URL:", inv.viewUrl);

  // Cleanup — delete the test invoice
  console.log("\n=== 3. Cleanup — delete test invoice ===");
  const delResp = await waveQuery(
    `mutation($input: InvoiceDeleteInput!) { invoiceDelete(input: $input) { didSucceed inputErrors { message } } }`,
    { input: { invoiceId: inv.id } }
  );
  console.log(JSON.stringify(delResp, null, 2));
} else {
  console.error("\n❌ INVOICE CREATE FAILED");
  console.error("inputErrors:", JSON.stringify(invoiceResp?.data?.invoiceCreate?.inputErrors, null, 2));
  console.error("top-level errors:", JSON.stringify(invoiceResp?.errors, null, 2));
}
