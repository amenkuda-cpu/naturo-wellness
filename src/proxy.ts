import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session cookie on account/admin routes.
 * Does nothing until Supabase is configured. Authorisation itself is always
 * re-checked on the server (requireStaff / RLS); this is not a security gate.
 */
export async function proxy(request: NextRequest) {
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(request.headers.get("host") ?? "");
  const isHttp =
    !local && (request.headers.get("x-forwarded-proto") === "http" || request.nextUrl.protocol === "http:");
  if (isHttp || request.headers.get("host") === "www.getnaturo.com") {
    const target = request.nextUrl.clone();
    target.protocol = "https:";
    if (request.headers.get("host") === "www.getnaturo.com") target.host = "getnaturo.com";
    return NextResponse.redirect(target, 301);
  }

  const pathname = request.nextUrl.pathname;
  const needsAuth =
    pathname === "/checkout" ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth");
  if (!needsAuth) return NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let response = NextResponse.next({ request });
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/auth/:path*", "/checkout", "/api/checkout/:path*"],
};
