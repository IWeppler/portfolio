import Image from "next/image";
import { notFound } from "next/navigation";
import { Github, ExternalLink } from "lucide-react";
import { getDictionary } from "@/lib/get-dictionary";

import tres from "@/public/tres.webp";
import cuatro from "@/public/cuatro.webp";
import mockupweb from "@/public/mockupweb.webp";
import workmanantial1 from "@/public/workmanantial1.png";
import modulo4henry from "@/public/modulo4henry.webp";
import modulo4henryb from "@/public/modulo4henryb.webp";
import inmobiliaria1 from "@/public/inmobiliaria1.png";
import inmobiliaria2 from "@/public/inmobiliaria2.png";
import mockupnivo1 from "@/public/mockupnivo1.png";
import mockupnivo2 from "@/public/mockupnivo2.png";
import figmanivo from "@/public/figmanivo.webp";
import checanchab from "@/public/checanchab.webp";
import checanchac from "@/public/checanchac.webp";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/Buttons";

// Definimos los tipos para las imágenes
const imageMap: Record<string, any> = {
  proyecto1: { img1: tres, img2: cuatro },
  proyecto2: { img1: mockupweb, img2: workmanantial1 },
  proyecto3: { img1: modulo4henry, img2: modulo4henryb },
  proyecto4: { img1: inmobiliaria1, img2: inmobiliaria2 },
  proyecto5: { img1: mockupnivo1, img2: mockupnivo2, img3: figmanivo },
  proyecto6: { img1: checanchab, img2: checanchac },
};

export async function generateStaticParams() {
  const slugs = [
    "proyecto1",
    "proyecto2",
    "proyecto3",
    "proyecto4",
    "proyecto5",
    "proyecto6",
  ];
  const langs = ["en", "es", "pt"];

  const params = [];
  for (const lang of langs) {
    for (const slug of slugs) {
      params.push({ lang, slug });
    }
  }
  return params;
}

interface Props {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

export default async function ProjectPage({ params }: Props) {
  // 1. Next.js 15: Esperamos a los params
  const { lang, slug } = await params;

  // 2. Usamos tu utilidad getDictionary para mantener coherencia
  const t = getDictionary(lang);

  const localeProyectos = t.proyectos as any;

  if (!localeProyectos[slug] || !imageMap[slug]) {
    notFound();
  }

  const proyecto = localeProyectos[slug];
  const imagenes = imageMap[slug];

  return (
    <section className="w-full min-h-screen bg-background text-white pt-12 md:pt-32 pb-20 px-4 md:px-20">
      <div className="max-w-4xl mx-auto">
        {/* ENCABEZADO */}
        <div className="mb-12">
          <small className="text-orange uppercase tracking-widest text-sm block mb-2">
            {proyecto.etiqueta}
          </small>
          <h1 className="text-4xl md:text-6xl font-medium uppercase tracking-tight mb-4">
            {proyecto.name}
          </h1>
          <p className="text-xl text-zinc-300 max-w-2xl leading-relaxed">
            {proyecto.subtitulo}
          </p>
        </div>

        {/* CONTENIDO */}
        <div className="space-y-12 text-zinc-300 text-lg leading-relaxed">
          <p>{proyecto.p1}</p>

          {/* Imagen 1 */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-900 shadow-2xl">
            <Image
              src={imagenes.img1}
              alt={proyecto.imgAlt ?? "Imagen del proyecto"}
              fill
              className="object-cover"
              placeholder="blur"
            />
          </div>

          <p>{proyecto.p2}</p>

          <div className="bg-surface p-8 rounded-xl border border-assets">
            <h3 className="text-white text-xl font-medium mb-6 uppercase tracking-wide">
              {proyecto.caracteristicas ?? "Características principales"}
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <li className="flex gap-2">
                <span className="text-orange">-</span> {proyecto.li1}
              </li>
              <li className="flex gap-2">
                <span className="text-orange">-</span> {proyecto.li2}
              </li>
              <li className="flex gap-2">
                <span className="text-orange">-</span> {proyecto.li3}
              </li>
              {proyecto.li4 && (
                <li className="flex gap-2">
                  <span className="text-orange">-</span> {proyecto.li4}
                </li>
              )}
            </ul>
          </div>

          {/* Imagen 2 */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-900 shadow-2xl">
            <Image
              src={imagenes.img2}
              alt={proyecto.imgAlt ?? "Imagen adicional"}
              fill
              className="object-cover"
              placeholder="blur"
            />
          </div>

          {proyecto.p3 && <p>{proyecto.p3}</p>}

          {/* Imagen 3 (Si existe, ej: proyecto 5) */}
          {imagenes.img3 && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-900 shadow-2xl mt-8">
              <Image
                src={imagenes.img3}
                alt="Detalle extra"
                fill
                className="object-cover"
                placeholder="blur"
              />
            </div>
          )}

          {/* BOTONES DE ACCIÓN */}
          <div className="flex flex-wrap gap-6 mt-16 pt-8 border-t border-white/10">
            {proyecto.deploy && (
              <ButtonSecondary href={proyecto.deploy} className="text-md">
                <ExternalLink className="h-4 w-4 md:h-5 md:w-5" />{" "}
                {t.projects.visitProject}
              </ButtonSecondary>
            )}

            {proyecto.github && (
              <ButtonSecondary href={proyecto.github} className="text-md">
                <Github className="h-4 w-4 md:h-5 md:w-5" />{" "}
                Github
              </ButtonSecondary>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
