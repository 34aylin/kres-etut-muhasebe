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

  if (isLoggedIn && nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  // Rol bazlı örnek koruma: Şube Yönetimi paneli sadece ADMIN rolüne açık.
  if (
    isLoggedIn &&
    nextUrl.pathname.startsWith("/sube-yonetimi") &&
    req.auth?.user.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // /api/health kasıtlı olarak hariç tutulur: Docker HEALTHCHECK ve
  // orkestrasyon araçlarının kimlik doğrulamadan erişebilmesi gerekir.
  // /admin ve /api/admin-auth de hariç tutulur: platform-admin paneli tenant
  // auth'undan (bu dosya) tamamen bağımsız kendi oturumunu kullanır ve
  // kendi auth kontrolünü src/app/admin/layout.tsx içinde yapar.
  matcher: [
    "/((?!api/auth|api/admin-auth|api/health|admin|_next/static|_next/image|favicon.ico).*)",
  ],
};
