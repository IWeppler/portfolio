import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// El middleware es una funcion: cada vez que corre, Vercel cobra CPU (y en un
// sitio con poco trafico casi siempre arranca en frio). Por eso solo corre en
// el panel, que es lo unico que necesita la sesion. La deteccion de idioma de
// las rutas sin locale ("/", "/projects"...) la resuelve la CDN con los
// redirects de next.config.ts, sin ejecutar codigo.
export async function middleware(request: NextRequest) {
  const [, lang, section] = request.nextUrl.pathname.split("/");
  const { response, user } = await updateSession(request);

  if (section === "dashboard" && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${lang}/panel-acceso`;

    return NextResponse.redirect(loginUrl);
  }

  if (section === "panel-acceso" && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = `/${lang}/dashboard`;

    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/:lang(es|en|pt)/dashboard",
    "/:lang(es|en|pt)/dashboard/:path*",
    "/:lang(es|en|pt)/panel-acceso",
  ],
};
