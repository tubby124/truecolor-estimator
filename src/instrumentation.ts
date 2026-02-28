export async function register() {
  // Railway has no outbound IPv6. smtp.hostinger.com resolves to a Cloudflare
  // IPv6 address causing ENETUNREACH on every SMTP connection attempt.
  // Force IPv4-first DNS resolution process-wide — only runs in Node.js runtime.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("dns");
    dns.setDefaultResultOrder("ipv4first");
  }
}
