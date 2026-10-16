import { getPublishedProjects } from "@/lib/projects/published";
import { SITE_URL } from "@/lib/seo";

// Resumen en markdown para asistentes de IA (llmstxt.org). Los proyectos
// salen de lo publicado, asi no queda desactualizado.
export const revalidate = 3600;

export async function GET() {
  const projects = await getPublishedProjects("es");
  const projectLines = projects
    .map(
      (project) =>
        `- [${project.name}](${SITE_URL}/es/projects/${project.slug})${project.excerpt ? `: ${project.excerpt}` : ""}`
    )
    .join("\n");

  const body = `# Ignacio Weppler

> Desarrollador full-stack de Tostado, Santa Fe, Argentina. Diseña y desarrolla webs y sistemas a medida para inmobiliarias: sitio con buscador y mapa, fichas de propiedades, consultas por WhatsApp, tasación online, reserva de visitas y CRM de leads y alquileres.

- 2 años en el oficio, casi 20 proyectos, clientes en 5 países.
- Stack: Next.js, React, TypeScript, Supabase (PostgreSQL), Tailwind CSS.
- Idiomas: español, inglés y portugués.
- Producto propio: Comerz POS, sistema de gestión para comercios que usan más de 7 negocios a diario.

## Páginas principales

- [Webs para inmobiliarias](${SITE_URL}/es/inmobiliarias): qué incluye una web inmobiliaria y ejemplos.
- [Proyectos](${SITE_URL}/es/projects): todos los casos.
- [Contacto](${SITE_URL}/es/contacto): pedir una propuesta.
- [English](${SITE_URL}/en) · [Português](${SITE_URL}/pt)

## Proyectos

${projectLines}

## Contacto

- Email: ignacionweppler@gmail.com
- WhatsApp: +54 9 11 5470 2118
- LinkedIn: https://www.linkedin.com/in/ignacioweppler
- GitHub: https://github.com/IWeppler
`;

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
