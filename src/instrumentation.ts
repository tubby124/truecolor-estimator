import dns from "dns";

export async function register() {
  // Railway has no outbound IPv6. smtp.hostinger.com resolves to a Cloudflare
  // IPv6 address causing ENETUNREACH on every SMTP connection attempt.
  // Force IPv4-first DNS resolution process-wide at server startup.
  dns.setDefaultResultOrder("ipv4first");
}
