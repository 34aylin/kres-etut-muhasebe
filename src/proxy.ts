import { NextResponse } from "next/server";

import { auth } from "@/auth";

const PUBLIC_PATHS = ["/login"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isPublicPath = PUBLIC_PATHS.some((path) =>
    nextUrl.pathname.startsWith(path),
  );

  if (!isLoggedIn && !isPublicPath) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  // Rol bazlı örnek koruma: Yönetici paneli sadece ADMIN rolüne açık.
  if (
    isLoggedIn &&
    nextUrl.pathname.startsWith("/admin") &&
    req.auth?.user.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
