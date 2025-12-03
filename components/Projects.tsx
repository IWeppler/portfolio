import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { RiArrowRightLine } from "react-icons/ri";
import inmobiliaria1 from "@/public/inmobiliaria1.png";
import workmanantial2 from "@/public/workmanantial2.png";
import cat from "@/public/cat.webp";
import modulo4henry from "@/public/modulo4henry.webp";
import checancha from "@/public/checancha.png";

import { ButtonPrimary } from "./ui/Buttons";
import { getDictionary } from "@/lib/get-dictionary";

const imageMap: Record<string, StaticImageData> = {
  proyecto1: workmanantial2,
  proyecto2: inmobiliaria1,
  proyecto3: checancha,
  proyecto4: cat,
  proyecto5: modulo4henry,
};

type ProyectoData = {
  name: string;
  subtitulo?: string;
  etiqueta?: string;
};

export default function Projects({ lang }: { lang: string }) {
  const t = getDictionary(lang);

  const proyectos = t.proyectos as Record<string, ProyectoData>;

  const projectsArray = Object.entries(proyectos).slice(0, 5);

  return (
    <section
      id="proyectos"
      className="w-full flex flex-col items-center py-20 bg-background"
    >
      <div className="w-full mb-12">
        <p className="font-medium tracking-widest text-paragraph mb-2 uppercase">
          • {t.works.section_subtitle}
        </p>
        <h2 className="text-4xl md:text-6xl font-medium text-white uppercase tracking-tight">
          {t.works.title}
        </h2>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16 w-full">
        {projectsArray.map(([slug, proyecto], index) => {
          const image = imageMap[slug];
          if (!image) return null;

          const isWide = index === 2;

          return (
            <Link
              key={slug}
              href={`/${lang}/projects/${slug}`}
              className={`group block w-full ${
                isWide ? "md:col-span-2" : "md:col-span-1"
              }`}
            >
              {/* Contenedor de Imagen */}
              <div className="relative w-full overflow-hidden rounded-lg bg-zinc-900 aspect-16/10 mb-6">
                <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/10 z-10" />
                <Image
                  src={image}
                  alt={proyecto.name}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  sizes={isWide ? "90vw" : "(max-width: 768px) 100vw, 50vw"}
                />
              </div>

              {/* Info y Texto */}
              <div className="flex flex-col border-t border-white/10 pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-medium text-white group-hover:text-orange transition-colors">
                      {proyecto.name}
                    </h3>
                    <p className="text-sm text-paragraph uppercase tracking-wider">
                      {proyecto.etiqueta || t.works.default_tag}
                    </p>
                  </div>

                  {/* Botón "View Project" */}
                  <div className="flex items-center gap-2 text-white opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                    <span className="text-sm font-medium hidden sm:inline-block">
                      {t.works.view_project}
                    </span>
                    <RiArrowRightLine className="text-lg" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-20">
        <ButtonPrimary href={`/${lang}/projects`}>
          {t.works.view_all}
        </ButtonPrimary>
      </div>
    </section>
  );
}
