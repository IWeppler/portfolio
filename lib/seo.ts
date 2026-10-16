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

// Foco: inmobiliarias. En el titulo del home va el nombre primero (la gente
// que llega por prospeccion busca por nombre) y el nicho despues.
export const SEO_COPY: Record<
  Lang,
  { homeTitle: string; home: string; projects: string; contact: string }
> = {
  es: {
    homeTitle: "Ignacio Weppler — Webs y CRM para inmobiliarias",
    home: "Diseño y desarrollo webs y sistemas a medida para inmobiliarias: buscador con mapa, tasación online, reserva de visitas y CRM de leads y alquileres.",
    projects: "Proyectos y casos de estudio: portales inmobiliarios, sistemas de gestión y webs a medida.",
    contact: "Contame qué querés construir y te respondo con una propuesta concreta.",
  },
  en: {
    homeTitle: "Ignacio Weppler — Full-stack developer · Real estate websites & SaaS",
    home: "I design and build websites and custom systems for real estate agencies: map search, online valuation, visit booking and a CRM for leads and rentals.",
    projects: "Projects and case studies: real estate portals, management systems and custom websites.",
    contact: "Tell me what you want to build and I'll get back to you with a concrete proposal.",
  },
  pt: {
    homeTitle: "Ignacio Weppler — Sites e CRM para imobiliárias",
    home: "Desenho e desenvolvo sites e sistemas sob medida para imobiliárias: busca com mapa, avaliação online, agendamento de visitas e CRM de leads e aluguéis.",
    projects: "Projetos e estudos de caso: portais imobiliários, sistemas de gestão e sites sob medida.",
    contact: "Conte o que você quer construir e eu respondo com uma proposta concreta.",
  },
};

export function seoCopy(lang: string) {
  return SEO_COPY[isLang(lang) ? lang : "es"];
}
