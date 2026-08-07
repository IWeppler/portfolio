import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

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

function stripLocale(pathname: string, locale: string) {
  const withoutLocale = pathname.slice(`/${locale}`.length);

  return withoutLocale === "" ? "/" : withoutLocale;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Verificar si la ruta ya tiene el locale
  const matchedLocale = locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (matchedLocale) {
    const { response, user } = await updateSession(request);
    const localePath = stripLocale(pathname, matchedLocale);

    if (localePath.startsWith("/dashboard") && !user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/${matchedLocale}/panel-acceso`;

      return NextResponse.redirect(loginUrl);
    }

    if (localePath.startsWith("/panel-acceso") && user) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = `/${matchedLocale}/dashboard`;

      return NextResponse.redirect(dashboardUrl);
    }

    return response;
  }

  if (
    pathname.includes(".") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
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
