import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/lib/get-dictionary";
import cat from "@/public/cat.webp";
import workmanantial2 from "@/public/workmanantial2.png";
import modulo4henry from "@/public/modulo4henry.webp";
import inmobiliaria1 from "@/public/inmobiliaria1.png";
import mockupnivo1 from "@/public/mockupnivo1.png";
import mockupnivo2 from "@/public/mockupnivo2.png";
import checancha from "@/public/checancha.png";

const imageMap: Record<string, any> = {
  proyecto1: { cover: workmanantial2 },
  proyecto2: { cover: inmobiliaria1 },
  proyecto3: { cover: checancha },
  proyecto4: { cover: cat },
  proyecto5: { cover: modulo4henry },
  proyecto6: { cover: mockupnivo1 },
  // proyecto7: { cover: redditobooks },
  // proyecto8: { cover: inaquitechos },
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
    alternates: {
      canonical: `https://ignacioweppler.com/${lang}/projects`,
      languages: {
        "x-default": "https://ignacioweppler.com/es/projects",
        es: "https://ignacioweppler.com/es/projects",
        en: "https://ignacioweppler.com/en/projects",
        pt: "https://ignacioweppler.com/pt/projects",
      },
    },
  };
}

export default async function ProjectsPage({ params }: Props) {
  const { lang } = await params;
  const t = getDictionary(lang);

  const projects = Object.entries(t.proyectos as any);

  const titles = {
    es: { main: "Últimos Proyectos", sub: "& Casos de Estudio" },
    en: { main: "Latest Projects", sub: "& Case Studies" },
    pt: { main: "Últimos Projetos", sub: "& Estudos de Caso" },
  };

  const currentTitle = titles[lang] || titles.es;

  return (
    <main className="min-h-screen w-full bg-background text-white pt-32 pb-20">
      <div className="w-full mx-auto px-4 md:px-20">
        {/* TITULO */}
        <h1 className="text-4xl md:text-6xl font-medium text-white uppercase tracking-tight mb-12">
          {currentTitle.main}
          <br />
          <span className="text-white/60">{currentTitle.sub}</span>
        </h1>

        {/* BORDER */}
        <hr className="border-t border-white/10 mb-16" />

        {/* GRID 2x2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {projects.map(([slug, data]: [string, any]) => {
            const images = imageMap[slug];
            if (!images) return null;

            return (
              <Link
                key={slug}
                href={`/${lang}/projects/${slug}`}
                className="group block"
              >
                {/* Contenedor de Imagen */}
                <div className="relative w-full aspect-4/3 md:aspect-[1.2/1] overflow-hidden rounded-xl bg-zinc-900">
                  <Image
                    src={images.cover}
                    alt={data.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    placeholder="blur"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
                </div>

                {/* Título del Proyecto */}
                <h3 className="mt-4 text-xl font-medium text-white group-hover:text-orange transition-colors">
                  {data.name}
                </h3>

                {/* Etiqueta opcional debajo del título */}
                <p className="text-sm text-white/50 uppercase tracking-widest mt-1">
                  {data.etiqueta}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
