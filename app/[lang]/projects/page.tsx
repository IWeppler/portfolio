import { ProjectsGrid, type ProjectItem } from "@/components/projects/ProjectsGrid";
import { getPublishedProjects } from "@/lib/projects/published";
import { getDictionary } from "@/lib/get-dictionary";
import { alternatesFor, ogBase, seoCopy } from "@/lib/seo";

export async function generateStaticParams() {
  return [{ lang: "es" }, { lang: "en" }, { lang: "pt" }];
}

interface Props {
  params: Promise<{ lang: "es" | "en" | "pt" }>;
}

export async function generateMetadata({ params }: Props) {
  const { lang } = await params;
  const title = getDictionary(lang).navbar.projects;
  const description = seoCopy(lang).projects;
  return {
    title,
    description,
    alternates: alternatesFor(lang, "/projects"),
    openGraph: { ...ogBase(lang), url: `/${lang}/projects`, title, description },
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
      coverAlt: project.alts[project.cover as string],
    }));

  const categoryLabels = getDictionary(lang).project_categories as Record<string, string>;

  const titles = {
    es: { main: "Proyectos", sub: "Casos de estudio" },
    en: { main: "Projects", sub: "Case studies" },
    pt: { main: "Projetos", sub: "Estudos de caso" },
  };
  const currentTitle = titles[lang] || titles.es;
  const t = getDictionary(lang);

  return (
    <main className="min-h-screen w-full bg-background px-4 pb-24 pt-24 text-foreground md:px-8 md:pt-28">
      {/* Misma fila de datos que el hero y la ficha de proyecto. */}
      <div className="hero-rise grid grid-cols-2 gap-y-2 text-paragraph md:grid-cols-3">
        <p className="label">({currentTitle.sub})</p>
        <p className="label text-right md:text-center">{t.hero.role}</p>
        <p className="label hidden text-right md:block">({String(projectsData.length).padStart(2, "0")})</p>
      </div>

      <h1 className="hero-rise text-title mt-16 font-medium [animation-delay:100ms] md:mt-24">{currentTitle.main}</h1>

      {/* Sin animacion de entrada propia: las portadas son destino de la View
          Transition y tienen que estar quietas en su lugar. */}
      <div className="mt-10 md:mt-14">
        <ProjectsGrid projects={projectsData} lang={lang} categoryLabels={categoryLabels} />
      </div>
    </main>
  );
}
