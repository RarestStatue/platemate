import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PROTECTED_PATHS = ["/upload", "/saved", "/settings"];
const AUTH_PATHS = ["/login", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // Redirect unauthenticated users to login for protected pages
  if (!isLoggedIn && PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/upload/:path*", "/saved/:path*", "/settings/:path*", "/login", "/register"],
};
