import type { Metadata } from "next";

// El dominio sin www redirige (308) a este: canonicals, sitemap y JSON-LD
// tienen que apuntar aca, no a una URL que redirige.
export const SITE_URL = "https://www.ignacioweppler.dev";

export const LANGS = ["es", "en", "pt"] as const;
export type Lang = (typeof LANGS)[number];

export const OG_LOCALES: Record<Lang, string> = { es: "es_AR", en: "en_US", pt: "pt_BR" };

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

/**
 * Campos de Open Graph comunes. Un `openGraph` definido en una pagina
 * reemplaza entero al del layout, asi que cada pagina los vuelve a sumar.
 */
export function ogBase(lang: string) {
  return {
    siteName: "Ignacio Weppler",
    type: "website" as const,
    locale: OG_LOCALES[isLang(lang) ? lang : "es"],
  };
}

/**
 * Canonical de la pagina y sus versiones en los otros idiomas. `path` va sin
 * el idioma: "" para el home, "/projects", "/projects/slug".
 */
export function alternatesFor(lang: string, path: string): Metadata["alternates"] {
  return {
    canonical: `/${lang}${path}`,
    languages: {
      ...Object.fromEntries(LANGS.map((l) => [l, `/${l}${path}`])),
      "x-default": `/es${path}`,
    },
  };
}

// La home es la identidad de builder: solo el nombre en el titulo y la misma
// description en ingles para los tres idiomas. Lo comercial (inmobiliarias)
// vive en /inmobiliarias, con su propio SEO.
const HOME_DESCRIPTION =
  "building products. some mine, some for clients. next.js · supabase. argentina.";

export const SEO_COPY: Record<
  Lang,
  { homeTitle: string; home: string; projects: string; contact: string }
> = {
  es: {
    homeTitle: "Ignacio Weppler",
    home: HOME_DESCRIPTION,
    projects: "Productos propios y trabajos para clientes.",
    contact: "Contame qué querés construir.",
  },
  en: {
    homeTitle: "Ignacio Weppler",
    home: HOME_DESCRIPTION,
    projects: "Own products and client work.",
    contact: "Tell me what you want to build.",
  },
  pt: {
    homeTitle: "Ignacio Weppler",
    home: HOME_DESCRIPTION,
    projects: "Produtos próprios e trabalhos para clientes.",
    contact: "Conte o que você quer construir.",
  },
};

export function seoCopy(lang: string) {
  return SEO_COPY[isLang(lang) ? lang : "es"];
}
