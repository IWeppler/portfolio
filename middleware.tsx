import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["es", "en", "pt"];
const defaultLocale = "es";

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get("accept-language");

  if (!acceptLanguage) return defaultLocale;

  const preferredLocales = acceptLanguage
    .split(",")
    .map((lang) => lang.split(";")[0].split("-")[0]);

  for (const locale of preferredLocales) {
    if (locales.includes(locale)) {
      return locale;
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Verificar si la ruta ya tiene el locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  if (
    pathname.includes(".") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")
  ) {
    return;
  }

  // 3. Si no tiene locale, detectamos cuál usar y redirigimos
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;

  // Redirección 307 (Temporary) o 308 (Permanent). 307 es mejor para detección de idioma.
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
