import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // We check for either a real Supabase token or our development mock token
  const hasAuthToken = 
    request.cookies.has("mock_session") || 
    request.cookies.getAll().some(c => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));

  const isProtectedPath = 
    request.nextUrl.pathname.startsWith("/checkout") || 
    request.nextUrl.pathname.startsWith("/account") || 
    request.nextUrl.pathname.startsWith("/admin");

  if (isProtectedPath && !hasAuthToken) {
    // Redirect unauthenticated users to the login page
    const loginUrl = new URL("/login", request.url);
    // Save the URL they were trying to access so we can redirect them back after login
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/checkout/:path*",
    "/account/:path*",
    "/admin/:path*",
  ],
};
