import { redirect } from "next/navigation";
import { decodePaymentToken } from "@/lib/payment/token";
import { createCloverCheckout } from "@/lib/payment/clover";

interface Props {
  params: Promise<{ token: string }>;
}

/**
 * Payment gateway page — decodes the signed token from the quote email,
 * creates a fresh Clover Hosted Checkout session, and redirects immediately.
 *
 * This gateway approach means the email link never "expires" — a new
 * 15-minute Clover session is created on every click.
 */
export default async function PaymentGatewayPage({ params }: Props) {
  const { token } = await params;

  let amountCents: number;
  let description: string;

  let customerEmail: string | undefined;

  try {
    const payload = decodePaymentToken(token);
    amountCents = payload.amountCents;
    description = payload.description;
    customerEmail = payload.customerEmail;
  } catch {
    return <ExpiredPage />;
  }

  let checkoutUrl: string;
  try {
    const result = await createCloverCheckout(amountCents, description, customerEmail);
    checkoutUrl = result.checkoutUrl;
  } catch (err) {
    console.error("[pay/token] Clover checkout failed:", err);
    return <ErrorPage />;
  }

  redirect(checkoutUrl);
}

function ExpiredPage() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#f1f5f9",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            margin: "80px auto",
            padding: "40px 32px",
            background: "white",
            borderRadius: 16,
            boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 48, margin: "0 0 16px" }}>⏰</p>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#111827",
              margin: "0 0 10px",
            }}
          >
            Payment Link Expired
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#6b7280",
              lineHeight: 1.6,
              margin: "0 0 28px",
            }}
          >
            This payment link is no longer valid. Please contact us and we will
            send you an updated quote.
          </p>
          <a
            href="mailto:info@true-color.ca?subject=Payment link expired — please resend quote"
            style={{
              display: "inline-block",
              background: "#e52222",
              color: "white",
              fontWeight: 600,
              fontSize: 14,
              padding: "12px 28px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Contact Us →
          </a>
          <p
            style={{ fontSize: 12, color: "#9ca3af", marginTop: 24 }}
          >
            True Color Display Printing · info@true-color.ca
          </p>
        </div>
      </body>
    </html>
  );
}

function ErrorPage() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#f1f5f9",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            margin: "80px auto",
            padding: "40px 32px",
            background: "white",
            borderRadius: 16,
            boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 48, margin: "0 0 16px" }}>⚠️</p>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#111827",
              margin: "0 0 10px",
            }}
          >
            Payment Temporarily Unavailable
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#6b7280",
              lineHeight: 1.6,
              margin: "0 0 28px",
            }}
          >
            We could not process your payment link right now. Please contact us
            directly or try again in a moment.
          </p>
          <a
            href="mailto:info@true-color.ca?subject=Payment link issue"
            style={{
              display: "inline-block",
              background: "#e52222",
              color: "white",
              fontWeight: 600,
              fontSize: 14,
              padding: "12px 28px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Contact Us →
          </a>
          <p
            style={{ fontSize: 12, color: "#9ca3af", marginTop: 24 }}
          >
            True Color Display Printing · info@true-color.ca
          </p>
        </div>
      </body>
    </html>
  );
}
