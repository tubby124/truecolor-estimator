import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
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

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/print-resources/")) {
    return guardPrintResourcePath(path) ?? NextResponse.next({ request });
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
  // for middleware routing per CLAUDE.md rule #13. Server-side staff endpoints
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
    return NextResponse.redirect(staffUrl);
  }

  // Protect all /staff/* routes except /staff/login itself
  const staffEmail = process.env.STAFF_EMAIL ?? "info@true-color.ca";
  if (path.startsWith("/staff") && !path.startsWith("/staff/login")) {
    if (!user || user.email !== staffEmail) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/staff/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/staff/:path*", "/account", "/print-resources/:slug"],
};
