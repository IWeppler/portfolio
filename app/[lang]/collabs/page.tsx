import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageColumns, type ColumnImage } from "@/components/projects/ImageColumns";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/Buttons";
import { FaqList, type FaqItem } from "@/components/ui/FaqList";
import { getPublishedProjects } from "@/lib/projects/published";
import { ogBase } from "@/lib/seo";

// Proyectos hechos a traves de agencias.
const AGENCY_SLUGS = ["quesos-festa", "inaqui-techos"];
// Mosaico del hero: variedad de lo que una agencia puede vender.
const MOSAIC_SLUGS = [
  "comerz-pos",
  "quesos-festa",
  "inmobiliaria-terranova",
  "inaqui-techos",
  "checancha",
  "el-tolar-plataforma-agropecuaria",
];
const IMAGES_PER_PROJECT = 3;

const WHATSAPP_URL =
  "https://wa.me/5491154702118?text=Hola%20Ignacio,%20tengo%20una%20agencia%20y%20quiero%20cotizar%20un%20proyecto.";
const FORM_URL = "/es/contacto?tipo=agencia";

const PROOF = "Presupuesto en 24 h · 20 proyectos · clientes en 5 países";

// Los cuatro miedos de una agencia que subcontrata, uno por uno.
const PROMISES = [
  {
    title: "Cumplo los plazos",
    text: "Te paso fechas por etapa antes de empezar. Si algo se complica, te aviso en el momento, no el día de la entrega.",
  },
  {
    title: "Tu cliente es tuyo",
    text: "No contacto a tu cliente ni le ofrezco nada por fuera, ni durante el proyecto ni después.",
  },
  {
    title: "Tu diseño, tal cual",
    text: "Lo llevo a código como lo diseñaste, en cada pantalla y también en el celular.",
  },
  {
    title: "No desaparezco",
    text: "30 días de soporte sin cargo después de la entrega y mantenimiento si el proyecto lo necesita.",
  },
];

const MODES = [
  {
    title: "Marca blanca",
    text: "Tu cliente no sabe que existo. Firmo un acuerdo de confidencialidad y no hablo con el cliente final, salvo que vos quieras.",
  },
  {
    title: "Colaboración",
    text: "Trabajamos en conjunto: vos llevás el diseño y la relación con el cliente, yo el desarrollo. Si hace falta, me sumo a las reuniones técnicas como parte de tu equipo.",
  },
  {
    title: "Socio para sistemas",
    text: "La mayoría de las agencias vende webs, pero rechaza un CRM, un sistema de gestión o una plataforma. Conmigo los podés ofrecer: ya hice CRMs para inmobiliarias y Comerz POS, un sistema que usan más de 7 negocios a diario.",
  },
];

const STEPS = [
  {
    title: "Tu canal",
    text: "Trabajamos por donde ya trabaja tu equipo: WhatsApp, Slack, Trello o lo que uses.",
  },
  {
    title: "Avances a la vista",
    text: "Cada avance queda publicado en una URL de prueba, para que lo revises vos o se lo muestres a tu cliente.",
  },
  {
    title: "Entregas por etapas",
    text: "Cerramos cada etapa antes de pasar a la siguiente. Nada de sorpresas al final.",
  },
  {
    title: "Traspaso completo",
    text: "Al terminar te entrego el código, los accesos y el dominio a nombre de quien corresponda. El mantenimiento es opcional.",
  },
];

const STACK = [
  {
    title: "Next.js, al frente",
    text: "Webs y sistemas nuevos en Next.js, React y TypeScript. Cargan más rápido, posicionan mejor en Google y llevan un panel a medida, sin plugins que actualizar.",
  },
  {
    title: "WordPress y WooCommerce",
    text: "Mantenimiento y optimización de webs que ya existen: corrección de contenido, SEO con Yoast, revisión de WooCommerce, Elementor y plugins, errores en formularios y actualizaciones, sin romper lo que funciona. No hago webs nuevas en WordPress.",
  },
];

// Trabajos de WordPress, sin imagenes en el panel.
const WORDPRESS_CASES = [
  { name: "Tac Tech", text: "Mantenimiento y optimización de e-commerce en WordPress." },
  { name: "Infinito Remeras", text: "Mantenimiento y optimización de e-commerce en WordPress." },
];

// Solo testimonios reales, con permiso de la agencia. Vacio, la seccion no se muestra.
const TESTIMONIALS: { quote: string; author: string; role: string }[] = [];

// La primera oracion de cada respuesta contesta la pregunta sola: es la que
// citan Google y los asistentes de IA.
const FAQ: FaqItem[] = [
  {
    q: "¿Cuánto cobrás?",
    a: "Tengo una tarifa para agencias, pensada para que te quede margen al revender. Mandame el proyecto y te paso el presupuesto en menos de 24 horas.",
  },
  {
    q: "¿Firmás NDA?",
    a: "Sí, firmo un acuerdo de confidencialidad (NDA) antes de empezar. El proyecto, tu diseño y los datos de tu cliente quedan entre nosotros.",
  },
  {
    q: "¿Contactás a mi cliente?",
    a: "No, hablo solo con vos. Si querés que me sume a una reunión con tu cliente, me presento como parte de tu equipo.",
  },
  {
    q: "¿Con qué tecnologías trabajás?",
    a: "Next.js, React y TypeScript para webs y sistemas nuevos, con Supabase y Tailwind CSS. En WordPress y WooCommerce hago mantenimiento y optimización de webs existentes.",
  },
  {
    q: "¿Quién paga y gestiona el hosting?",
    a: "Lo acordamos en cada proyecto: puede quedar a nombre de tu agencia, de tu cliente o gestionarlo yo. Queda definido en el presupuesto.",
  },
  {
    q: "¿Qué pasa si el cliente pide cambios?",
    a: "Los cambios que entran los fija el presupuesto. Lo que quede afuera te lo cotizo antes de hacerlo, para que puedas trasladarlo a tu cliente.",
  },
  {
    q: "¿Cómo facturás?",
    a: "Facturo como monotributista, con factura C en pesos.",
  },
  {
    q: "¿Das soporte después?",
    a: "Sí, 30 días de soporte sin cargo después de la entrega. Después, el mantenimiento es opcional y se arma según lo que necesite el proyecto.",
  },
];

export async function generateStaticParams() {
  return [{ lang: "es" }];
}

export const dynamicParams = false;

const TITLE = "Desarrollo web en marca blanca para agencias | Ignacio Weppler";
const DESCRIPTION =
  "Desarrollo web y sistemas a medida para agencias: marca blanca, plazos cumplidos y tarifa con margen para revender. Presupuesto en 24 horas.";

export const metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  // Solo existe en espanol: sin alternates de idioma.
  alternates: { canonical: "/es/collabs" },
  openGraph: { ...ogBase("es"), url: "/es/collabs", title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default async function CollabsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "es") notFound();

  const published = await getPublishedProjects(lang);
  const imagesOf = (slug: string, limit: number): ColumnImage[] => {
    const project = published.find((item) => item.slug === slug);
    if (!project) return [];
    return [project.cover, ...project.images]
      .filter((url, i, all): url is string => Boolean(url) && all.indexOf(url) === i)
      .slice(0, limit)
      .map((src) => ({ src, name: project.name, alt: project.alts[src] }));
  };

  // Intercaladas para que cada columna del mosaico mezcle proyectos.
  const byProject = MOSAIC_SLUGS.map((slug) => imagesOf(slug, IMAGES_PER_PROJECT));
  const mosaic = Array.from({ length: IMAGES_PER_PROJECT }, (_, i) =>
    byProject.map((list) => list[i]).filter(Boolean),
  ).flat();

  const agencyCases = AGENCY_SLUGS.flatMap((slug) => {
    const project = published.find((item) => item.slug === slug);
    const [image] = imagesOf(slug, 1);
    return project && image ? [{ slug, name: project.name, excerpt: project.excerpt, image }] : [];
  });

  return (
    <main className="w-full bg-background text-foreground">
      {/* Hero: titulo corto a un lado, mosaico en movimiento al otro. */}
      <section className="grid min-h-svh grid-cols-1 lg:grid-cols-12">
        <div className="flex flex-col justify-center px-4 py-16 md:px-8 lg:col-span-5 lg:py-0">
          <p className="label text-paragraph">Ignacio Weppler · Desarrollo para agencias</p>
          <h1 className="mt-6 text-[clamp(3rem,8vw,6.5rem)] font-medium leading-[0.95] tracking-[-0.045em] text-balance">
            Vos diseñás y vendés. Yo lo programo.
          </h1>
          <p className="text-body mt-6 max-w-md text-paragraph">
            Desarrollo en marca blanca para agencias: tu diseño llevado a código, con los plazos que le prometiste a
            tu cliente y una tarifa que te deja margen.
          </p>
          <div className="mt-8 flex flex-col items-start gap-3">
            <ButtonPrimary href={WHATSAPP_URL} target="_blank">
              Pedime un presupuesto
            </ButtonPrimary>
            <p className="label text-paragraph">{PROOF}</p>
          </div>
        </div>

        <ImageColumns images={mosaic} className="h-[80svh] lg:col-span-7 lg:h-svh" />
      </section>

      {/* Los cuatro miedos de subcontratar, desactivados uno por uno. */}
      <section className="px-4 pt-24 md:px-8 md:pt-40">
        <p className="label text-paragraph">Lo que te preocupa cuando subcontratás</p>
        <ul className="mt-6 grid gap-10 border-t border-foreground/20 pt-10 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {PROMISES.map((item, index) => (
            <li key={item.title}>
              <p className="label text-paragraph">({String(index + 1).padStart(2, "0")})</p>
              <h2 className="text-statement mt-4 font-medium text-balance">{item.title}</h2>
              <p className="text-body mt-3 text-paragraph">{item.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Tres formas de trabajar, en filas grandes. */}
      <section className="px-4 pt-24 md:px-8 md:pt-40">
        <p className="label text-paragraph">Tres formas de trabajar juntos</p>
        <ul className="mt-6 border-t border-foreground/20">
          {MODES.map((mode, index) => (
            <li
              key={mode.title}
              className="grid gap-4 border-b border-foreground/20 py-8 md:grid-cols-12 md:gap-8 md:py-12"
            >
              <p className="label text-paragraph md:col-span-1">({String(index + 1).padStart(2, "0")})</p>
              <h2 className="text-statement font-medium text-balance md:col-span-4">{mode.title}</h2>
              <p className="text-body text-paragraph md:col-span-7">{mode.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Como se trabaja con una agencia, en cuatro pasos. */}
      <section className="px-4 pt-24 md:px-8 md:pt-40">
        <p className="label text-paragraph">Cómo trabajo con agencias</p>
        <ol className="mt-6 grid gap-10 border-t border-foreground/20 pt-10 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <p className="label text-paragraph">({String(index + 1).padStart(2, "0")})</p>
              <h3 className="text-statement mt-4 font-medium">{step.title}</h3>
              <p className="text-body mt-3 text-paragraph">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="px-4 pt-24 md:px-8 md:pt-40">
        <p className="label text-paragraph">Con qué trabajo</p>
        <div className="mt-6 grid gap-10 border-t border-foreground/20 pt-10 md:grid-cols-2 md:gap-8">
          {STACK.map((item) => (
            <div key={item.title}>
              <h2 className="text-statement font-medium text-balance">{item.title}</h2>
              <p className="text-body mt-3 max-w-xl text-paragraph">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Casos hechos a traves de agencias. */}
      <section className="px-4 pt-24 md:px-8 md:pt-40">
        <p className="label text-paragraph">Hechos para agencias</p>
        {agencyCases.length > 0 && (
          <ul className="mt-6 grid gap-8 md:grid-cols-2">
            {agencyCases.map((item) => (
              <li key={item.slug}>
                <Link href={`/es/projects/${item.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                    <Image
                      src={item.image.src}
                      alt={item.image.alt ?? item.name}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-4">
                    <h3 className="text-statement font-medium">{item.name}</h3>
                    <span className="label text-foreground transition-transform group-hover:translate-x-1">
                      Ver caso →
                    </span>
                  </div>
                  <p className="text-body mt-2 text-paragraph">
                    Desarrollado para una agencia{item.excerpt ? `. ${item.excerpt}` : "."}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <ul className="mt-10 border-t border-foreground/20">
          {WORDPRESS_CASES.map((item) => (
            <li
              key={item.name}
              className="flex flex-col gap-2 border-b border-foreground/20 py-6 md:flex-row md:items-baseline md:justify-between md:gap-8"
            >
              <span className="text-statement font-medium">{item.name}</span>
              <span className="text-body text-paragraph">{item.text}</span>
            </li>
          ))}
        </ul>

        {TESTIMONIALS.length > 0 && (
          <ul className="mt-16 grid gap-10 md:grid-cols-2 md:gap-8">
            {TESTIMONIALS.map((item) => (
              <li key={item.author}>
                <blockquote className="text-statement font-medium text-balance">“{item.quote}”</blockquote>
                <p className="label mt-4 text-paragraph">
                  {item.author} · {item.role}
                </p>
              </li>
            ))}
          </ul>
        )}
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
            <h2 className="text-statement mt-6 font-medium text-balance">Lo que suelen preguntarme las agencias.</h2>
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
            ¿Tenés un proyecto para cotizar?
          </h2>
          <p className="text-body mt-8 max-w-xl text-paragraph md:mt-10">
            Mandame el diseño o la idea y en menos de 24 horas tenés el presupuesto, con margen para tu agencia.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 md:mt-12">
            <ButtonPrimary
              href={WHATSAPP_URL}
              target="_blank"
              className="!px-10 !py-5 md:!px-14 md:!py-6 md:!text-2xl"
            >
              Escribime por WhatsApp
            </ButtonPrimary>
            <ButtonSecondary href={FORM_URL}>Prefiero el formulario</ButtonSecondary>
          </div>
          <p className="label mt-10 text-paragraph">{PROOF}</p>
        </div>
      </section>
    </main>
  );
}
