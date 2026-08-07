import { ProjectsGrid, type ProjectItem } from "@/components/projects/ProjectsGrid";
import { getPublishedProjects } from "@/lib/projects/published";
import { getDictionary } from "@/lib/get-dictionary";

export async function generateStaticParams() {
  return [{ lang: "es" }, { lang: "en" }, { lang: "pt" }];
}

interface Props {
  params: Promise<{ lang: "es" | "en" | "pt" }>;
}

export async function generateMetadata({ params }: Props) {
  const { lang } = await params;
  return {
    title: `Ignacio Weppler | ${lang === "es" ? "Proyectos" : "Projects"}`,
  };
}

export default async function ProjectsPage({ params }: Props) {
  const { lang } = await params;

  const published = await getPublishedProjects(lang);

  const projectsData: ProjectItem[] = published
    .filter((project) => project.cover)
    .map((project) => ({
      slug: project.slug,
      name: project.name,
      category: project.category,
      cover: project.cover as string,
    }));

  const categoryLabels = getDictionary(lang).project_categories as Record<string, string>;

  const titles = {
    es: { main: "Últimos Proyectos", sub: "& Casos de Estudio" },
    en: { main: "Latest Projects", sub: "& Case Studies" },
    pt: { main: "Últimos Projetos", sub: "& Estudos de Caso" },
  };
  const currentTitle = titles[lang] || titles.es;

  return (
    <main className="min-h-screen w-full bg-background text-foreground pt-32 pb-20">
      <div className="w-full mx-auto px-4 md:px-20">
        <h1 className="text-4xl md:text-6xl font-medium text-foreground uppercase tracking-tight mb-12">
          {currentTitle.main}
          <br />
          <span className="text-paragraph">{currentTitle.sub}</span>
        </h1>

        <hr className="border-t border-white/10 mb-12" />

        <ProjectsGrid projects={projectsData} lang={lang} categoryLabels={categoryLabels} />
      </div>
    </main>
  );
}
