import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Autentifikatsiya talab qilinmaydigan yo'llar */
const PUBLIC_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public yo'llar — to'siqsiz o'tkazamiz
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Cookie dan auth_token ni tekshiramiz (auth store tomonidan o'rnatiladi)
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    // Qaytish uchun redirect_to saqlash (ixtiyoriy)
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next|favicon.ico|manifest.json|sw.js|workbox-.*|icons|uploads).*)",
  ],
};
