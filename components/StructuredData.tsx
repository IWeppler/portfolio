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
    jobTitle: "Desarrollador Web Full Stack",
    description:
      "Desarrollador Full Stack especializado en crear experiencias digitales modernas con Next.js, React y Astro.",
    email: "ignacionweppler@gmail.com",
    telephone: "+54 11 5470 2118",
    address: {
      "@type": "PostalAddress",
      addressCountry: "AR",
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
    name: "Ignacio Weppler - Full-stack Web Development",
    url: baseUrl,
    description:
      "Desarrollo web full-stack para negocios: landing pages, sistemas internos, dashboards, SEO técnico y automatización.",
    areaServed: ["AR", "LATAM", "ES", "US"],
    serviceType: [
      "Desarrollo Web",
      "Landing Pages",
      "Sistemas a medida",
      "Dashboards internos",
      "SEO Técnico",
      "Consultoría Web",
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
