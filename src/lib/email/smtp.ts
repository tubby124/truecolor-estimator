import nodemailer from "nodemailer";
import dns from "dns/promises";

/**
 * Creates a nodemailer SMTP transporter, forcing IPv4 DNS resolution.
 *
 * Railway (and many cloud hosts) have no outbound IPv6 routing.
 * smtp.hostinger.com resolves via Cloudflare to both A and AAAA records;
 * without this, Node.js picks the IPv6 address and throws ENETUNREACH.
 *
 * We call dns.resolve4() to get the IPv4 address explicitly, then pass it
 * as `host` while setting `tls.servername` to the original hostname so TLS
 * certificate verification still passes.
 */
export async function getSmtpTransporter() {
  const smtpHost = process.env.SMTP_HOST ?? "";
  const port = parseInt(process.env.SMTP_PORT ?? "465");
  const secure = process.env.SMTP_SECURE !== "false";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!smtpHost || !user || !pass) {
    throw new Error("SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS");
  }

  // Resolve to IPv4 explicitly — bypasses Node.js DNS preference settings entirely.
  let host = smtpHost;
  try {
    const [ipv4] = await dns.resolve4(smtpHost);
    if (ipv4) host = ipv4;
  } catch {
    console.warn("[smtp] dns.resolve4 failed for", smtpHost, "— falling back to hostname");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { servername: smtpHost }, // TLS SNI must match original hostname, not resolved IP
    connectionTimeout: 10_000,
    greetingTimeout: 5_000,
    socketTimeout: 15_000,
  });
}
