import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ImageColumns,
  type ColumnImage,
} from "@/components/projects/ImageColumns";
import { ButtonPrimary } from "@/components/ui/Buttons";
import { FaqList, type FaqItem } from "@/components/ui/FaqList";
import { getPublishedProjects } from "@/lib/projects/published";
import { ogBase } from "@/lib/seo";

// Proyectos del rubro inmobiliario: TerraNova, Arcos y Lumen.
const REAL_ESTATE_SLUGS = [
  "inmobiliaria-terranova",
  "arcos-propiedades",
  "lumen-propiedades",
];
const IMAGES_PER_PROJECT = 6;

const WHATSAPP_URL =
  "https://wa.me/5491154702118?text=Hola%20Ignacio,%20tengo%20una%20inmobiliaria%20y%20quiero%20ver%20c%C3%B3mo%20quedar%C3%ADa%20mi%20web.";

const PROOF = "20 proyectos · clientes en 5 países";

const STEPS = [
  {
    title: "Charlamos",
    text: "Me escribís por WhatsApp y me contás cómo trabaja hoy tu inmobiliaria: dónde publicás, cómo te llegan las consultas y qué te gustaría resolver.",
  },
  {
    title: "Propuesta",
    text: "Te paso qué incluye, cuánto sale y en cuánto tiempo está. Podés arrancar solo con la web, solo con el CRM o con los dos.",
  },
  {
    title: "Desarrollo",
    text: "Armo la web con tu marca y tus propiedades. Entre 5 y 20 días, según cuánto haya que adaptar.",
  },
  {
    title: "Publicación",
    text: "Lo ponemos online y te muestro cómo cargar propiedades y responder consultas desde el panel.",
  },
];

// La primera oracion de cada respuesta contesta la pregunta sola: es la que
// citan Google y los asistentes de IA.
const FAQ: FaqItem[] = [
  {
    q: "¿Cuánto tarda en estar lista la web?",
    a: "Entre 5 y 20 días. Una web con la estructura de Arcos o Lumen y tu marca sale en pocos días; si hay que sumar funciones a medida, lleva más.",
  },
  {
    q: "¿Puedo contratar solo la web o solo el CRM?",
    a: "Sí: podés contratar solo la web, solo el CRM o los dos juntos, conectados entre sí.",
  },
  {
    q: "¿Las consultas me llegan al WhatsApp?",
    a: "Sí, cada propiedad tiene un botón de WhatsApp y la consulta llega con la propiedad que la originó. Si usás el CRM, además queda registrada y asignada a un asesor.",
  },
  {
    q: "¿Puedo cargar y editar las propiedades yo mismo?",
    a: "Sí, las propiedades se cargan desde un panel y aparecen en la web al instante. No hace falta saber programar ni pedirme cada cambio.",
  },
  {
    q: "¿El CRM sirve para administrar alquileres?",
    a: "Sí, el CRM administra contratos, ajustes por ICL o IPC, cobros, recibos y liquidaciones a propietarios. Los índices se actualizan solos y avisa antes de cada vencimiento.",
  },
];

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

const TITLE = "Páginas web y CRM para inmobiliarias | Ignacio Weppler";
const DESCRIPTION =
  "Páginas web y CRM para inmobiliarias: buscador con mapa, consultas directo a tu WhatsApp, reserva de visitas, tasación online y administración de alquileres.";

export const metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  // Solo existe en espanol: sin alternates de idioma.
  alternates: { canonical: "/es/inmobiliarias" },
  openGraph: {
    ...ogBase("es"),
    url: "/es/inmobiliarias",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default async function InmobiliariasPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (lang !== "es") notFound();

  const published = await getPublishedProjects(lang);
  const fromPanel: ColumnImage[] = REAL_ESTATE_SLUGS.flatMap((slug) => {
    const project = published.find((item) => item.slug === slug);
    if (!project) return [];
    const unique = [project.cover, ...project.images].filter(
      (url, i, all): url is string => Boolean(url) && all.indexOf(url) === i,
    );
    return unique
      .slice(0, IMAGES_PER_PROJECT)
      .map((src) => ({ src, name: project.name, alt: project.alts[src] }));
  });

  // Imagen propia de Arcos, fuera del panel: va al final de su seccion y abre
  // el mosaico del hero.
  const verde: ColumnImage = {
    src: "/inmobiliarias/verde.png",
    name:
      published.find((item) => item.slug === "arcos-propiedades")?.name ??
      "Arcos Propiedades",
  };
  // Intercaladas para que cada columna del mosaico mezcle proyectos.
  const byProject = REAL_ESTATE_SLUGS.map((slug) => {
    const name = published.find((item) => item.slug === slug)?.name;
    return fromPanel.filter((image) => image.name === name);
  });
  const mixed = Array.from(
    { length: Math.max(0, ...byProject.map((list) => list.length)) },
    (_, i) => byProject.map((list) => list[i]).filter(Boolean),
  ).flat();
  mixed.unshift(verde);

  // Una seccion por proyecto: nombre y demo a la izquierda, sus imagenes a la derecha.
  const projects = REAL_ESTATE_SLUGS.flatMap((slug) => {
    const project = published.find((item) => item.slug === slug);
    if (!project) return [];
    const panelImages = fromPanel.filter((image) => image.name === project.name);
    const images =
      slug === "arcos-propiedades" ? [...panelImages, verde] : panelImages;
    return images.length > 0
      ? [{ name: project.name, url: project.deployUrl, images }]
      : [];
  });

  return (
    <main className="w-full bg-background text-foreground">
      {/* Hero: titulo corto a un lado, mosaico en movimiento al otro. */}
      <section className="grid min-h-svh grid-cols-1 lg:grid-cols-12">
        <div className="flex flex-col justify-center px-4 py-16 md:px-8 lg:col-span-5 lg:py-0">
          <p className="label text-paragraph">
            Ignacio Weppler · Webs para inmobiliarias
          </p>
          <h1 className="mt-6 text-[clamp(3rem,8vw,4.5rem)] font-medium leading-[0.95] tracking-[-0.045em] text-balance">
            Tu inmobiliaria, mejor presentada. Mejor organizada.
          </h1>
          <p className="text-body mt-6 max-w-md text-paragraph">
            Una web profesional para mostrar tus propiedades y un CRM para
            gestionar consultas, clientes y oportunidades. Todo conectado, para
            que puedas concentrarte en cerrar más operaciones.
          </p>
          <div className="mt-8 flex flex-col items-start gap-3">
            <ButtonPrimary href={WHATSAPP_URL} target="_blank">
              Quiero ver cómo quedaría la mía
            </ButtonPrimary>
            <p className="label text-paragraph">{PROOF}</p>
          </div>
        </div>

        <ImageColumns
          images={mixed}
          className="h-[80svh] lg:col-span-7 lg:h-svh"
        />
      </section>

      {/* Proyecto por proyecto: texto sticky a la izquierda, imagenes a la derecha. */}
      <section className="px-4 pb-8 pt-24 md:px-8 md:pt-40">
        <ol className="flex flex-col gap-24 md:gap-40">
          {projects.map((project, p) => (
            <li
              key={project.name}
              className="grid gap-8 lg:grid-cols-12 lg:gap-10"
            >
              <div className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
                <p className="label text-paragraph">
                  ({String(p + 1).padStart(2, "0")})
                </p>
                <h2 className="text-statement mt-4 font-medium text-balance">
                  {project.name}
                </h2>
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label group mt-6 inline-flex items-center gap-2 text-foreground"
                  >
                    <span className="transition-transform group-hover:translate-x-1">
                      Ver demo ↗
                    </span>
                  </a>
                )}
              </div>

              <ol className="flex flex-col lg:col-span-8">
                {project.images.map((image, i) => (
                  <li key={image.src} className="sticky top-4 pb-4 md:top-6">
                    <div className="relative mx-auto aspect-[4/5] max-h-[82svh] w-full max-w-[720px] overflow-hidden bg-surface">
                      <Image
                        src={image.src}
                        alt={image.alt ?? image.name}
                        fill
                        sizes="(min-width: 768px) 720px, 100vw"
                        quality={90}
                        className="object-cover"
                        priority={p === 0 && i === 0}
                      />
                      <div className="absolute inset-x-0 bottom-0 flex justify-between gap-4 bg-gradient-to-t from-black/60 to-transparent px-4 pb-4 pt-20 md:px-6 md:pb-5">
                        <span className="label text-foreground">{image.name}</span>
                        <span className="label text-foreground">
                          ({String(i + 1).padStart(2, "0")}/
                          {String(project.images.length).padStart(2, "0")})
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
      </section>

      <section className="px-4 pt-24 md:px-8 md:pt-40">
        <ul className="grid gap-10 md:grid-cols-3 md:gap-8">
          {POINTS.map((point, index) => (
            <li key={point.title}>
              <p className="label text-paragraph">
                ({String(index + 1).padStart(2, "0")})
              </p>
              <h2 className="text-statement mt-4 font-medium text-balance">
                {point.title}
              </h2>
              <p className="text-body mt-3 text-paragraph">{point.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* El problema que resuelve: el texto que da contexto para Google y las IA. */}
      <section className="px-4 pt-24 md:px-8 md:pt-40">
        <p className="label text-paragraph">El problema</p>
        <h2 className="text-statement mt-6 max-w-4xl font-medium text-balance">
          La web por un lado, las consultas en WhatsApp y planillas por otro, y
          los alquileres en una tercera herramienta.
        </h2>
        <div className="text-body mt-8 grid max-w-4xl gap-6 text-paragraph md:grid-cols-2 md:gap-10">
          <p>
            Así trabajan la mayoría de las inmobiliarias. Se pierden consultas,
            nadie sabe qué propiedad funciona y administrar un contrato lleva
            horas. Una web que solo muestra fotos no alcanza: tiene que
            convertir visitas en consultas y que cada una llegue al asesor
            correcto.
          </p>
          <p>
            Por eso hago dos cosas que funcionan juntas o por separado: una web
            pensada para generar consultas y un CRM donde tu equipo trabaja cada
            día, en ventas y en alquileres. Es el mismo sistema que hay detrás
            de TerraNova, Arcos y Lumen.
          </p>
        </div>
      </section>

      {/* Como se trabaja, en cuatro pasos. */}
      <section className="px-4 pt-24 md:px-8 md:pt-40">
        <p className="label text-paragraph">Cómo trabajamos</p>
        <ol className="mt-6 grid gap-10 border-t border-foreground/20 pt-10 md:grid-cols-4 md:gap-8">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <p className="label text-paragraph">
                ({String(index + 1).padStart(2, "0")})
              </p>
              <h3 className="text-statement mt-4 font-medium">{step.title}</h3>
              <p className="text-body mt-3 text-paragraph">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Preguntas frecuentes: el texto de cada respuesta queda en el HTML. */}
      <section className="px-4 pt-24 md:px-8 md:pt-40">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQ.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: { "@type": "Answer", text: item.a },
              })),
            }),
          }}
        />
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="label text-paragraph">Preguntas frecuentes</p>
            <h2 className="text-statement mt-6 font-medium text-balance">
              Lo que suelen preguntarme.
            </h2>
          </div>
          <div className="lg:col-span-8">
            <FaqList items={FAQ} />
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 md:px-8 md:pb-32">
        <div className="mt-24 flex flex-col items-center bg-surface px-6 py-20 text-center md:mt-32 md:px-12 md:py-32">
          <p className="label text-paragraph">Hablemos</p>
          <h2 className="mt-6 max-w-5xl text-[clamp(2.5rem,7.5vw,7rem)] font-medium leading-[0.95] tracking-[-0.045em] text-balance">
            ¿Te imaginás algo así para tu inmobiliaria?
          </h2>
          <p className="text-body mt-8 max-w-xl text-paragraph md:mt-10">
            Conversemos por WhatsApp, sin compromiso. Podemos ver qué solución
            encaja con tu negocio.
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
