import { LANDING_PROJECT_LIMIT, OWN_PRODUCT_SLUGS } from "@/lib/projects/landing";

import { ButtonSecondary } from "./ui/Buttons";
import { getDictionary } from "@/lib/get-dictionary";
import { getPublishedProjects } from "@/lib/projects/published";
import { ProjectList, type ProjectRow } from "./projects/ProjectList";
import { Reveal } from "./ui/Reveal";

export default async function Projects({ lang }: { lang: string }) {
  const t = getDictionary(lang);

  const published = await getPublishedProjects(lang);

  // Unica fuente: los proyectos publicados desde el panel, en el orden del
  // tablero. Sin portada no entra: la fila la necesita para la vista previa.
  const projects: ProjectRow[] = published
    .filter((project) => project.cover)
    .map((project) => ({
      slug: project.slug,
      name: project.name,
      excerpt: project.excerpt,
      cover: project.cover as string,
      coverAlt: project.alts[project.cover as string],
      // Portada primero; el resto rota en la vista previa.
      images: [project.cover as string, ...project.images.filter((url) => url !== project.cover)],
    }))
    .slice(0, LANDING_PROJECT_LIMIT);

  // Los mismos proyectos de siempre (el tope del tablero), pero los propios
  // primero y aparte de los trabajos para clientes.
  const products = projects.filter((project) => OWN_PRODUCT_SLUGS.has(project.slug));
  const clients = projects.filter((project) => !OWN_PRODUCT_SLUGS.has(project.slug));

  const groups = [
    { title: t.works.products_title, items: products },
    { title: t.works.clients_title, items: clients },
  ].filter((group) => group.items.length > 0);

  return (
    <section id="projects" className="w-full bg-background pt-28 pb-32 md:pt-40 md:pb-48">
      {/* El titulo va a tamano de frase: los nombres de los proyectos son los
          que tienen que verse grandes. */}
      {groups.map((group, index) => (
        <div key={group.title} className={index > 0 ? "mt-24 md:mt-32" : undefined}>
          <Reveal className="mb-6 flex flex-wrap items-baseline justify-between gap-4 md:mb-10">
            <h2 className="text-statement font-medium text-paragraph">{group.title}</h2>
            {index === groups.length - 1 && (
              <ButtonSecondary href={`/${lang}/projects`}>{t.works.view_all}</ButtonSecondary>
            )}
          </Reveal>

          <ProjectList lang={lang} projects={group.items} />
        </div>
      ))}
    </section>
  );
}
