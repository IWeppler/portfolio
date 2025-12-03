import Image from "next/image";
import { notFound } from "next/navigation";
import { Github } from "lucide-react";
import { getDictionary } from "@/lib/get-dictionary";
import { ButtonSecondary } from "@/components/ui/Buttons";
import { AnimatedTitle } from "@/components/ui/AnimatedTitle";
import { imageMap } from "@/lib/project-images";

interface ProjectData {
  name: string;
  subtitulo: string;
  etiqueta: string;
  p1: string;
  p2: string;
  p3?: string;
  caracteristicas?: string;
  li1?: string;
  li2?: string;
  li3?: string;
  li4?: string;
  github?: string;
  deploy?: string;
  [key: string]: string | undefined;
}

export async function generateStaticParams() {
  const slugs = [
    "proyecto1",
    "proyecto2",
    "proyecto3",
    "proyecto4",
    "proyecto5",
    "proyecto6",
    "proyecto7",
    "proyecto8",
  ];
  const langs = ["en", "es", "pt"];
  return langs.flatMap((lang) => slugs.map((slug) => ({ lang, slug })));
}

interface Props {
  params: Promise<{ lang: string; slug: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { lang, slug } = await params;
  const t = getDictionary(lang);

  // Accedemos a los proyectos y casteamos
  const localeProyectos = t.proyectos as any;
  const proyecto = localeProyectos[slug] as ProjectData;
  const images = imageMap[slug];

  if (!proyecto || !images) {
    notFound();
  }

  const colors = {
    swissOrange: "#FF3B30",
    surface: "#141A1F",
    assets: "#2D3339",
    paragraph: "#9CA3AF",
    foreground: "#EDEDE9",
  };

  return (
    <section className="w-full min-h-screen bg-background text-foreground pt-16 md:pt-32 pb-20 px-4 md:px-20">
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <small
          className="uppercase tracking-widest text-sm block mb-3"
          style={{ color: colors.swissOrange }}
        >
          {proyecto.etiqueta}
        </small>

        <AnimatedTitle
          text={proyecto.name}
          className="text-5xl md:text-7xl font-medium uppercase tracking-tight mb-6"
        />

        <p
          className="text-xl max-w-3xl leading-relaxed mb-12"
          style={{ color: colors.paragraph }}
        >
          {proyecto.subtitulo}
        </p>

        {/* HERO IMAGE FULL WIDTH */}
        <div
          className="relative w-full h-[380px] md:h-[480px] rounded-xl overflow-hidden mb-20 bg-zinc-900 border"
          style={{ borderColor: colors.assets }}
        >
          <Image
            src={images.img1}
            alt={proyecto.name}
            fill
            className="object-cover"
            priority
            placeholder="blur"
          />
        </div>

        {/* SECCIÓN: DESAFÍO */}
        <div className="mb-20">
          <h2
            className="text-2xl font-medium mb-4 tracking-wide uppercase"
            style={{ color: colors.foreground }}
          >
            {localeProyectos.projects?.challenge || "El Desafío"}
          </h2>
          <p
            className="text-lg leading-relaxed"
            style={{ color: colors.paragraph }}
          >
            {proyecto.p1}
          </p>
        </div>

        {/* BREAK IMAGE, ALINEADA A LA DERECHA */}
        {images.img2 && (
          <div
            className="relative w-full h-[380px] md:h-[480px] rounded-xl overflow-hidden mb-20 bg-zinc-900 border"
            style={{ borderColor: colors.assets }}
          >
            <Image
              src={images.img2}
              alt="Vista adicional"
              fill
              className="object-cover"
              placeholder="blur"
            />
          </div>
        )}

        {/* SECCIÓN: SOLUCIÓN */}
        <div className="mb-20">
          <h2
            className="text-2xl font-medium mb-4 tracking-wide uppercase"
            style={{ color: colors.foreground }}
          >
            {localeProyectos.projects?.solution || "La Solución"}
          </h2>
          <p
            className="text-lg leading-relaxed mb-10"
            style={{ color: colors.paragraph }}
          >
            {proyecto.p2}
          </p>

          {/* FEATURES EN GRID SWISS */}
          <div
            className="p-10 rounded-xl border"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.assets,
            }}
          >
            <h3
              className="text-xl font-medium mb-8 uppercase tracking-wide"
              style={{ color: colors.foreground }}
            >
              {proyecto.caracteristicas ?? "Características"}
            </h3>

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg leading-relaxed">
              {["li1", "li2", "li3", "li4"].map((key) => {
                const item = proyecto[key];
                if (!item) return null;

                return (
                  <li key={key} className="flex gap-3">
                    <span
                      className="font-bold"
                      style={{ color: colors.swissOrange }}
                    >
                      –
                    </span>
                    <span style={{ color: colors.paragraph }}>{item}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* TERCERA IMAGEN OPCIONAL */}
        {images.img3 && (
          <div
            className="relative w-full h-[360px] md:h-[420px] rounded-xl overflow-hidden bg-zinc-900 shadow-2xl mb-20 border"
            style={{ borderColor: colors.assets }}
          >
            <Image
              src={images.img3}
              alt="Detalle extra"
              fill
              className="object-cover"
              placeholder="blur"
            />
          </div>
        )}

        {/* SECCIÓN: RESULTADOS / IMPACTO */}
        {proyecto.p3 && (
          <div className="mb-24">
            <h2
              className="text-2xl font-medium mb-4 tracking-wide uppercase"
              style={{ color: colors.foreground }}
            >
              {localeProyectos.projects?.outcome || "Resultados"}
            </h2>
            <p
              className="text-lg leading-relaxed"
              style={{ color: colors.paragraph }}
            >
              {proyecto.p3}
            </p>
          </div>
        )}

        {/* CALL TO ACTION */}
        <div
          className="pt-10 border-t flex flex-wrap gap-6"
          style={{ borderColor: colors.assets }}
        >
          {proyecto.deploy && (
            <ButtonSecondary
              href={proyecto.deploy}
              className="text-md"
              target="_blank"
            >
              {t.projects?.visitProject ||
                localeProyectos.projects?.visitProject ||
                "Ver Proyecto"}
            </ButtonSecondary>
          )}

          {proyecto.github && (
            <ButtonSecondary
              href={proyecto.github}
              className="text-md"
              target="_blank"
            >
              <Github className="h-5 w-5" />
              Github
            </ButtonSecondary>
          )}
        </div>
      </div>
    </section>
  );
}
