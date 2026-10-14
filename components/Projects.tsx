import { LANDING_PROJECT_LIMIT } from "@/lib/projects/landing";

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
    }))
    .slice(0, LANDING_PROJECT_LIMIT);

  return (
    <section id="projects" className="w-full bg-background pt-28 pb-32 md:pt-40 md:pb-48">
      {/* El titulo va a tamano de frase: los nombres de los proyectos son los
          que tienen que verse grandes. */}
      <Reveal className="mb-6 flex flex-wrap items-baseline justify-between gap-4 md:mb-10">
        <h2 className="text-statement font-medium text-paragraph">{t.works.title}</h2>
        <ButtonSecondary href={`/${lang}/projects`}>{t.works.view_all}</ButtonSecondary>
      </Reveal>

      <ProjectList lang={lang} projects={projects} />
    </section>
  );
}
