import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Autentifikatsiya talab qilinmaydigan yo'llar */
const PUBLIC_PATHS = ["/", "/tariflar", "/video-qollanma", "/ilova", "/login", "/register", "/forgot-password", "/reset-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // HttpOnly session cookie. auth_token faqat oldingi UI uchun bir marta
  // o'tish davrida qabul qilinadi; u client yuklangach o'chiriladi.
  const token = request.cookies.get("access_token")?.value || request.cookies.get("auth_token")?.value;

  // Root ("/"): tizimga kirgan haqiqiy foydalanuvchi marketing sahifasini
  // emas, to'g'ridan-to'g'ri dashboard'ni ko'rishi kerak. Eski havola/bookmark
  // bilan kirgan kasalxonalar shu orqali uzilishsiz o'tadi.
  if (pathname === "/" && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Public yo'llar — to'siqsiz o'tkazamiz
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

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
