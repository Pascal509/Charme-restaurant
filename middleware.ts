import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { i18nConfig } from "@/lib/i18n/config";

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/offline") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const [locale, country, section] = segments;

  const isValidLocale = i18nConfig.locales.includes(locale);
  const isValidCountry = i18nConfig.countries.includes(country);

  if (!isValidLocale || !isValidCountry) {
    const url = request.nextUrl.clone();
    url.pathname = `/${i18nConfig.defaultLocale}/${i18nConfig.defaultCountry}`;
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.cookies.set("locale", locale, { path: "/" });
  response.cookies.set("country", country, { path: "/" });

  if (!section) return response;

  if (["admin", "account", "checkout"].includes(section)) {
    return handleProtectedRoute(request, response);
  }

  return response;
}

async function handleProtectedRoute(
  request: NextRequest,
  response: NextResponse
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = `/${i18nConfig.defaultLocale}/${i18nConfig.defaultCountry}`;
    return NextResponse.redirect(url);
  }

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.includes("/admin");
  if (isAdminRoute && token.role !== "ADMIN") {
    const url = request.nextUrl.clone();
    url.pathname = `/${i18nConfig.defaultLocale}/${i18nConfig.defaultCountry}`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"]
};
