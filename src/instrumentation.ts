export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Railway has no outbound IPv6. Force IPv4-first DNS resolution.
    // NODE_OPTIONS=--dns-result-order=ipv4first handles this at process level,
    // but we also set it here and reduce Happy Eyeballs fallback timeout as
    // belt-and-suspenders for any worker threads that miss the process flag.
    const dns = await import("dns");
    dns.setDefaultResultOrder("ipv4first");

    const net = await import("net");
    if (typeof net.setDefaultAutoSelectFamilyAttemptTimeout === "function") {
      net.setDefaultAutoSelectFamilyAttemptTimeout(100);
    }
  }
}
