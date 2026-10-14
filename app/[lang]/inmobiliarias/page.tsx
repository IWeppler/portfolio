import Image from "next/image";
import { notFound } from "next/navigation";
import { ImageColumns, type ColumnImage } from "@/components/projects/ImageColumns";
import { ButtonPrimary } from "@/components/ui/Buttons";
import { getPublishedProjects } from "@/lib/projects/published";

// Proyectos del rubro inmobiliario: TerraNova, Arcos y Lumen.
const REAL_ESTATE_SLUGS = ["proyecto2", "arcos-propiedades", "lumen-propiedades"];
const IMAGES_PER_PROJECT = 6;

const WHATSAPP_URL =
  "https://wa.me/5491154702118?text=Hola%20Ignacio,%20tengo%20una%20inmobiliaria%20y%20quiero%20ver%20c%C3%B3mo%20quedar%C3%ADa%20mi%20web.";

const PROOF = "2 años haciendo webs · casi 20 proyectos · clientes en 5 países";

const POINTS = [
  {
    title: "Cada propiedad, una ficha clara",
    text: "Fotos grandes y datos ordenados. Quien entra entiende qué ofrecés en segundos.",
  },
  {
    title: "Consultas directo a tu WhatsApp",
    text: "Sin formularios eternos: el cliente te escribe desde la propiedad que le interesó.",
  },
  {
    title: "Rápida en el celular",
    text: "La mayoría busca desde el teléfono. Carga rápido y se ve bien ahí.",
  },
];

export async function generateStaticParams() {
  return [{ lang: "es" }];
}

export const dynamicParams = false;

export const metadata = {
  title: "Páginas web para inmobiliarias | Ignacio Weppler",
  description: "Hago sitios web para inmobiliarias que generan consultas por WhatsApp. Mirá cómo quedan.",
};

export default async function InmobiliariasPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "es") notFound();

  const published = await getPublishedProjects(lang);
  const fromPanel: ColumnImage[] = REAL_ESTATE_SLUGS.flatMap((slug) => {
    const project = published.find((item) => item.slug === slug);
    if (!project) return [];
    const unique = [project.cover, ...project.images].filter(
      (url, i, all): url is string => Boolean(url) && all.indexOf(url) === i,
    );
    return unique.slice(0, IMAGES_PER_PROJECT).map((src) => ({ src, name: project.name }));
  });

  // Imagen propia de Arcos, fuera del panel: va al final del cuerpo (la 11) y
  // abre el mosaico del hero.
  const verde: ColumnImage = {
    src: "/inmobiliarias/verde.png",
    name: published.find((item) => item.slug === "arcos-propiedades")?.name ?? "Arcos Propiedades",
  };
  const images = [...fromPanel, verde];

  // Intercaladas para que cada columna del mosaico mezcle proyectos.
  const byProject = REAL_ESTATE_SLUGS.map((slug) => {
    const name = published.find((item) => item.slug === slug)?.name;
    return fromPanel.filter((image) => image.name === name);
  });
  const mixed = Array.from({ length: Math.max(0, ...byProject.map((list) => list.length)) }, (_, i) =>
    byProject.map((list) => list[i]).filter(Boolean),
  ).flat();
  mixed.unshift(verde);

  return (
    <main className="w-full bg-background text-foreground">
      {/* Hero: titulo corto a un lado, mosaico en movimiento al otro. */}
      <section className="grid min-h-svh grid-cols-1 lg:grid-cols-12">
        <div className="flex flex-col justify-center px-4 py-16 md:px-8 lg:col-span-5 lg:py-0">
          <p className="label text-paragraph">Ignacio Weppler · Webs para inmobiliarias</p>
          <h1 className="mt-6 text-[clamp(3rem,8vw,6.5rem)] font-medium leading-[0.95] tracking-[-0.045em] text-balance">
            Webs que llenan tu WhatsApp.
          </h1>
          <p className="text-body mt-6 max-w-md text-paragraph">
            Sitios para inmobiliarias con tus propiedades bien presentadas y consultas directas.
          </p>
          <div className="mt-8 flex flex-col items-start gap-3">
            <ButtonPrimary href={WHATSAPP_URL} target="_blank">
              Quiero ver cómo quedaría la mía
            </ButtonPrimary>
            <p className="label text-paragraph">{PROOF}</p>
          </div>
        </div>

        <ImageColumns images={mixed} className="h-[80svh] lg:col-span-7 lg:h-svh" />
      </section>

      {/* Todas las imagenes a pantalla casi completa, apilandose al scrollear. */}
      <section className="px-2 pb-8 pt-24 md:px-3 md:pt-40">
        <p className="label px-2 text-paragraph md:px-5">Así quedan</p>
        <ol className="mt-6">
          {images.map((image, i) => (
            <li key={image.src} className="sticky top-4 pb-4 md:top-6">
              <div className="relative mx-auto aspect-[4/5] max-h-[82svh] w-full max-w-[720px] overflow-hidden bg-surface">
                <Image
                  src={image.src}
                  alt={image.name}
                  fill
                  sizes="(min-width: 768px) 720px, 100vw"
                  quality={90}
                  className="object-cover"
                  priority={i === 0}
                />
                <div className="absolute inset-x-0 bottom-0 flex justify-between gap-4 bg-gradient-to-t from-black/60 to-transparent px-4 pb-4 pt-20 md:px-6 md:pb-5">
                  <span className="label text-foreground">{image.name}</span>
                  <span className="label text-foreground">
                    ({String(i + 1).padStart(2, "0")}/{String(images.length).padStart(2, "0")})
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="px-4 pb-24 pt-24 md:px-8 md:pb-32 md:pt-40">
        <ul className="grid gap-10 md:grid-cols-3 md:gap-8">
          {POINTS.map((point, index) => (
            <li key={point.title}>
              <p className="label text-paragraph">({String(index + 1).padStart(2, "0")})</p>
              <h2 className="text-statement mt-4 font-medium text-balance">{point.title}</h2>
              <p className="text-body mt-3 text-paragraph">{point.text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-24 flex flex-col items-center bg-surface px-6 py-20 text-center md:mt-32 md:px-12 md:py-32">
          <p className="label text-paragraph">Hablemos</p>
          <h2 className="mt-6 max-w-5xl text-[clamp(2.5rem,7.5vw,7rem)] font-medium leading-[0.95] tracking-[-0.045em] text-balance">
            ¿Te imaginás algo así para tu inmobiliaria?
          </h2>
          <p className="text-body mt-8 max-w-xl text-paragraph md:mt-10">
            Conversemos por WhatsApp, sin compromiso. Podemos ver qué solución encaja con tu negocio.
          </p>
          <ButtonPrimary
            href={WHATSAPP_URL}
            target="_blank"
            className="mt-10 !px-10 !py-5 md:mt-12 md:!px-14 md:!py-6 md:!text-2xl"
          >
            Escribime por WhatsApp
          </ButtonPrimary>
          <p className="label mt-10 text-paragraph">{PROOF}</p>
        </div>
      </section>
    </main>
  );
}
