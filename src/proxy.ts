import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { nextUrl } = request;

  // Check for session token cookie
  const sessionToken = request.cookies.get("authjs.session-token") ||
                       request.cookies.get("__Secure-authjs.session-token");

  const isLoggedIn = !!sessionToken;

  // Protected routes
  const isAppRoute = nextUrl.pathname.startsWith("/dashboard") ||
                     nextUrl.pathname.startsWith("/projects") ||
                     nextUrl.pathname.startsWith("/notes");

  // Auth routes
  const isAuthRoute = nextUrl.pathname.startsWith("/login") ||
                      nextUrl.pathname.startsWith("/signup");

  if (isAppRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
