import { getDictionary } from "@/lib/get-dictionary";
import { ProjectsGrid } from "@/components/projects/ProjectsGrid";

import atleticotostado from "@/public/atleticotostado.jpg";
import workmanantial2 from "@/public/workmanantial2.png";
import modulo4henry from "@/public/modulo4henry.webp";
import modulo4henryb from "@/public/modulo4henryb.webp";
import inmobiliaria1 from "@/public/inmobiliaria1.png";
import mockupnivo1 from "@/public/mockupnivo1.png";
import checancha from "@/public/checancha.png";
import reddittobooks from "@/public/reddittobooks.jpg";
import mockupinaqui from "@/public/mockupinaqui.png";

const imageMap: Record<string, any> = {
  proyecto1: { cover: workmanantial2 },
  proyecto2: { cover: inmobiliaria1 },
  proyecto3: { cover: checancha },
  proyecto4: { cover: atleticotostado },
  proyecto5: { cover: modulo4henry },
  proyecto6: { cover: mockupnivo1 },
  proyecto7: { cover: reddittobooks },
  proyecto8: { cover: mockupinaqui },
};

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
  const t = getDictionary(lang);

  const projectsData = Object.entries(t.proyectos as any)
    .map(([slug, data]: [string, any]) => {
      const images = imageMap[slug];

      if (!images) return null;

      return {
        slug,
        name: data.name,
        etiqueta: data.etiqueta,
        cover: images.cover,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

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

        <ProjectsGrid projects={projectsData} lang={lang} />
      </div>
    </main>
  );
}
