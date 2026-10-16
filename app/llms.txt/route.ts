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

> Product builder de Tostado, Santa Fe, Argentina. Construye productos propios y para clientes.

- Productos propios: Comerz POS (sistema de gestión para comercios) y TerraNova (web y CRM inmobiliario).
- 20 proyectos, clientes en 5 países.
- Stack: Next.js, React, TypeScript, Supabase (PostgreSQL), Tailwind CSS.
- Idiomas: español, inglés y portugués.
- Para inmobiliarias: web con buscador y mapa, tasación online, reserva de visitas y CRM de leads y alquileres (ver /es/inmobiliarias).

## Páginas principales

- [Webs para inmobiliarias](${SITE_URL}/es/inmobiliarias): qué incluye una web inmobiliaria y ejemplos.
- [Desarrollo para agencias](${SITE_URL}/es/collabs): desarrollo en marca blanca, colaboración y sistemas a medida para agencias.
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
