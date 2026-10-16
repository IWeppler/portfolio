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

export const SEO_COPY: Record<Lang, { home: string; projects: string; contact: string }> = {
  es: {
    home: "Desarrollador full-stack en Argentina. Webs a medida, portales inmobiliarios, CRM y landing pages con Next.js y Supabase.",
    projects: "Proyectos y casos de estudio: portales inmobiliarios, sistemas de gestión y sitios web a medida.",
    contact: "Contame qué querés construir y te respondo con una propuesta concreta.",
  },
  en: {
    home: "Full-stack developer in Argentina. Custom websites, real estate portals, CRMs and landing pages built with Next.js and Supabase.",
    projects: "Projects and case studies: real estate portals, management systems and custom websites.",
    contact: "Tell me what you want to build and I'll get back to you with a concrete proposal.",
  },
  pt: {
    home: "Desenvolvedor full-stack na Argentina. Sites sob medida, portais imobiliários, CRM e landing pages com Next.js e Supabase.",
    projects: "Projetos e estudos de caso: portais imobiliários, sistemas de gestão e sites sob medida.",
    contact: "Conte o que você quer construir e eu respondo com uma proposta concreta.",
  },
};

export function seoCopy(lang: string) {
  return SEO_COPY[isLang(lang) ? lang : "es"];
}
