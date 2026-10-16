import { SITE_URL } from "@/lib/seo";

type JsonLd = Record<string, unknown>;

export default function StructuredData({ schema }: { schema?: JsonLd }) {
  const baseUrl = SITE_URL;

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    // Los otros schemas apuntan a este @id (provider, author).
    "@id": `${baseUrl}/#person`,
    name: "Ignacio Weppler",
    url: baseUrl,
    image: `${baseUrl}/ignacio-weppler.jpg`,
    // Mismo nombre, rol y ubicacion que en LinkedIn, GitHub e Instagram: los
    // buscadores y las IA reconocen la entidad por esa consistencia.
    jobTitle: "Desarrollador full-stack — webs y CRM para inmobiliarias",
    description:
      "Ignacio Weppler diseña y desarrolla webs y sistemas a medida para inmobiliarias: buscador con mapa, tasación online, reserva de visitas y CRM de leads y alquileres. Tostado, Santa Fe, Argentina.",
    email: "ignacionweppler@gmail.com",
    telephone: "+54 11 5470 2118",
    address: {
      "@type": "PostalAddress",
      addressCountry: "AR",
      addressLocality: "Tostado",
      addressRegion: "Santa Fe",
    },
    sameAs: [
      "https://www.linkedin.com/in/ignacioweppler",
      "https://github.com/IWeppler",
      "https://www.instagram.com/ignacioweppler/",
    ],
    worksFor: {
      "@type": "Organization",
      name: "Ignacio Weppler (Freelance)",
    },
    knowsAbout: [
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "Astro",
      "Tailwind CSS",
      "Node.js",
      "PostgreSQL",
      "Supabase",
      "Figma",
      "Google Ads",
      "SEO Técnico",
    ],
    alumniOf: {
      "@type": "EducationalOrganization",
      name: "Soy Henry",
    },
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Ignacio Weppler — Webs y CRM para inmobiliarias",
    url: baseUrl,
    image: `${baseUrl}/ignacio-weppler.jpg`,
    description:
      "Webs y sistemas a medida para inmobiliarias: web con buscador y mapa, fichas de propiedades, consultas por WhatsApp, tasación online, reserva de visitas y CRM de leads y alquileres.",
    areaServed: ["AR", "BR", "LATAM", "ES", "US"],
    serviceType: [
      "Páginas web para inmobiliarias",
      "CRM para inmobiliarias",
      "Sistema de gestión inmobiliaria",
      "Administración de alquileres",
      "Desarrollo web a medida",
      "Sistemas a medida",
    ],
    provider: {
      "@id": `${baseUrl}/#person`,
    },
    sameAs: [
      "https://www.linkedin.com/in/ignacioweppler",
      "https://github.com/IWeppler",
      "https://www.instagram.com/ignacioweppler/",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Ignacio Weppler",
    alternateName: ["Ignacio Weppler Dev", "IWeppler"],
    url: baseUrl,
    author: {
      "@id": `${baseUrl}/#person`,
    },
  };

  const schemas: JsonLd[] = [personSchema, serviceSchema, websiteSchema];

  if (schema) schemas.push(schema);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
    />
  );
}
