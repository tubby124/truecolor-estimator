import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { buildAttributionSetCookies } from "@/lib/analytics/utm";
import { isPrintResourceSlug } from "@/lib/data/print-resource-slugs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dczbgraekmzirxknjvwe.supabase.co";

export function guardPrintResourcePath(pathname: string): NextResponse | null {
  const prefix = "/print-resources/";
  if (!pathname.startsWith(prefix)) return null;

  const slug = pathname.slice(prefix.length);
  if (isPrintResourceSlug(slug)) return null;

  return new NextResponse("Not Found", {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // Payment links contain a signed bearer token. They must not receive click
  // attribution cookies or be cached/referred to a third party.
  const isPaymentPath = /^\/pay(?:\/|$)/.test(path);

  // Server-side click capture. The client writer (UtmCapture) is the only thing
  // that ever stored a click ID, so a blocked script, a JS error, or Safari ITP
  // evicting a script-written cookie lost the click permanently. Doing it here
  // means the click is persisted before any JS runs.
  const attributionCookies = isPaymentPath
    ? []
    : buildAttributionSetCookies(
      request.nextUrl,
      request.headers.get("cookie"),
      {
        referrer: request.headers.get("referer"),
        // Behind Cloudflare/Railway the inbound URL can be http even though the
        // visitor is on https — trust the proxy header for the Secure attribute.
        secure:
          (request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", ""))
            .split(",")[0]
            .trim() === "https",
      },
    );
  // Appended (not `cookies.set`) so the value stays byte-identical to what
  // utm.ts serializes and the existing cookie parsers already consume, and so
  // it rides on whatever response this proxy was already returning.
  const withAttribution = (response: NextResponse) => {
    if (isPaymentPath) {
      response.headers.set("Cache-Control", "private, no-store, max-age=0");
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Referrer-Policy", "no-referrer");
      response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    }
    for (const cookie of attributionCookies) {
      response.headers.append("set-cookie", cookie);
    }
    return response;
  };

  if (path.startsWith("/print-resources/")) {
    return withAttribution(guardPrintResourcePath(path) ?? NextResponse.next({ request }));
  }

  // The matcher now covers every page so click IDs are captured wherever an ad
  // lands. Session work stays scoped to the two auth-gated surfaces that need it.
  if (!path.startsWith("/staff") && path !== "/account") {
    return withAttribution(NextResponse.next({ request }));
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getSession reads the JWT from cookies without a network round-trip — correct
  // for proxy routing per CLAUDE.md rule #13. Server-side staff endpoints
  // (`requireStaffUser` on /api/staff/*) still re-verify via getUser, so the
  // actual security boundary is unchanged.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // Owner visiting /account → redirect to staff dashboard
  if (path === "/account" && user?.email === (process.env.STAFF_EMAIL ?? "info@true-color.ca")) {
    const staffUrl = request.nextUrl.clone();
    staffUrl.pathname = "/staff/orders";
    return withAttribution(NextResponse.redirect(staffUrl));
  }

  // Protect all /staff/* routes except /staff/login itself
  const staffEmail = process.env.STAFF_EMAIL ?? "info@true-color.ca";
  if (path.startsWith("/staff") && !path.startsWith("/staff/login")) {
    if (!user || user.email !== staffEmail) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/staff/login";
      return withAttribution(NextResponse.redirect(loginUrl));
    }
  }

  return withAttribution(supabaseResponse);
}

export const config = {
  // Every page path, so an ad landing on any SEO page or product page gets its
  // click ID captured server-side. Static assets, image optimizer output, and
  // API routes are excluded — a click ID never arrives on those.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
