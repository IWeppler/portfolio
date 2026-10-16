import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/get-dictionary";
import {
  getPublishedProject,
  getPublishedProjects,
  type PublishedProject,
} from "@/lib/projects/published";
import { categoryLabel } from "@/lib/projects/categories";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { ConversionLink } from "@/components/analytics/ConversionLink";
import { CaseStudy } from "@/components/projects/CaseStudy";
import SuggestedProjects from "@/components/projects/SuggestedProjects";
import { SITE_URL, alternatesFor, ogBase } from "@/lib/seo";
import { coverTransition } from "@/lib/transitions";
import { getImageSize } from "@/lib/image-size";

// Si no se pudo medir una imagen: proporcion de captura de escritorio.
const FALLBACK_SIZE = { width: 1600, height: 1000 };

const LANGS = ["es", "en", "pt"];

export async function generateStaticParams() {
  // Los proyectos viven en Supabase: los slugs salen de lo que este publicado.
  const projects = await getPublishedProjects("es");

  return LANGS.flatMap((lang) => projects.map((project) => ({ lang, slug: project.slug })));
}

interface Props {
  params: Promise<{ lang: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const project = await getPublishedProject(slug, lang);

  if (!project) return {};

  return {
    title: project.name,
    description: project.excerpt || undefined,
    alternates: alternatesFor(lang, `/projects/${slug}`),
    openGraph: {
      ...ogBase(lang),
      url: `/${lang}/projects/${slug}`,
      title: project.name,
      description: project.excerpt || undefined,
      ...(project.cover && { images: [{ url: project.cover, alt: project.name }] }),
    },
  };
}

/** CreativeWork del proyecto + migas Inicio > Proyectos > Proyecto. */
function projectJsonLd(project: PublishedProject, lang: string, projectsLabel: string) {
  const url = `${SITE_URL}/${lang}/projects/${project.slug}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: project.name,
      description: project.excerpt || undefined,
      url,
      inLanguage: lang,
      ...(project.cover && { image: project.cover }),
      ...(project.deployUrl && { sameAs: project.deployUrl }),
      creator: { "@id": `${SITE_URL}/#person` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ignacio Weppler", item: `${SITE_URL}/${lang}` },
        { "@type": "ListItem", position: 2, name: projectsLabel, item: `${SITE_URL}/${lang}/projects` },
        { "@type": "ListItem", position: 3, name: project.name, item: url },
      ],
    },
  ];
}

const pad = (n: number) => String(n).padStart(2, "0");

export default async function ProjectPage({ params }: Props) {
  const { lang, slug } = await params;
  const t = getDictionary(lang);

  const [project, projects] = await Promise.all([getPublishedProject(slug, lang), getPublishedProjects(lang)]);

  if (!project) {
    notFound();
  }

  const visitLabel = t.projects?.visitProject || "Ver Proyecto";
  const backLabel = t.projects?.back || "Volver a proyectos";
  const codeLabel = t.projects?.viewCode || "Ver código";

  const [hero, ...rest] = project.cover
    ? [project.cover, ...project.images.filter((url) => url !== project.cover)]
    : project.images;

  // Posicion en el listado, con el mismo formato que la grilla: "(03/14)".
  const position = projects.findIndex((item) => item.slug === slug) + 1;

  // Tamano real de cada imagen: se muestran con su proporcion y nunca mas
  // grandes que el original (agrandar una captura chica la pixela).
  const sizes = new Map(
    await Promise.all([hero, ...rest].filter((url): url is string => Boolean(url)).map(async (url) => [url, await getImageSize(url)] as const)),
  );
  const frame = (url: string, maxHeight?: string): CSSProperties => {
    const size = sizes.get(url) ?? FALLBACK_SIZE;
    const ratio = size.width / size.height;
    const caps = [`${size.width}px`, maxHeight && `calc(${maxHeight} * ${ratio.toFixed(4)})`].filter(Boolean);
    return { aspectRatio: `${size.width} / ${size.height}`, width: `min(100%, ${caps.join(", ")})` };
  };

  return (
    <main className="w-full bg-background px-4 pb-24 pt-24 text-foreground md:px-8 md:pt-28">
      <PageViewTracker projectId={project.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(projectJsonLd(project, lang, t.navbar.projects)) }}
      />

      {/* Fila de datos, igual que en el hero del home. */}
      <div className="hero-rise grid grid-cols-2 gap-y-2 text-paragraph md:grid-cols-3">
        <Link
          href={`/${lang}/projects`}
          className="label group inline-flex items-center gap-2 justify-self-start transition-colors hover:text-foreground"
        >
          <span aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-x-1">
            ←
          </span>
          {backLabel}
        </Link>
        <p className="label text-right md:text-center">{categoryLabel(project.category, lang)}</p>
        {position > 0 && (
          <p className="label hidden text-right md:block">
            ({pad(position)}/{pad(projects.length)})
          </p>
        )}
      </div>

      {/* Titulo y extracto en la misma grilla que las filas de la lista. */}
      <header className="mt-16 grid grid-cols-1 gap-8 md:mt-24 md:grid-cols-12 md:items-end">
        <h1 className="hero-rise text-title font-medium text-balance [animation-delay:100ms] md:col-span-7">
          {project.name}
        </h1>
        <div className="hero-rise [animation-delay:200ms] md:col-span-4 md:col-start-9">
          {project.excerpt && <p className="text-body text-paragraph">{project.excerpt}</p>}
          {(project.deployUrl || project.githubUrl) && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {project.deployUrl && (
                <ConversionLink
                  href={project.deployUrl}
                  projectId={project.id}
                  className="inline-flex items-center gap-2 rounded-full bg-orange px-6 py-3.5 text-base font-medium text-dark transition-[transform,background-color] duration-150 ease-out hover:bg-[color-mix(in_srgb,var(--swiss-orange)_88%,white)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange"
                >
                  {visitLabel} <span aria-hidden="true">↗</span>
                </ConversionLink>
              )}
              {project.githubUrl && (
                <ConversionLink
                  href={project.githubUrl}
                  projectId={project.id}
                  className="label inline-flex items-center gap-2 rounded-full bg-foreground/[0.06] px-5 py-4 text-foreground transition-[transform,background-color] duration-150 ease-out hover:bg-foreground/[0.12] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange"
                >
                  {codeLabel} <span aria-hidden="true">↗</span>
                </ConversionLink>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Destino de la View Transition: la portada llega desde la lista. Sin
          animacion de entrada propia para que el viaje termine en su lugar. */}
      {hero && (
        <div
          style={{ ...frame(hero, "85svh"), ...coverTransition(project.slug) }}
          className="relative mx-auto mt-12 overflow-hidden bg-surface md:mt-16"
        >
          <Image
            src={hero}
            alt={project.alts[hero] ?? project.name}
            fill
            sizes={`min(100vw, ${(sizes.get(hero) ?? FALLBACK_SIZE).width}px)`}
            className="object-cover"
            priority
          />
        </div>
      )}

      {project.content && (
        <section className="mt-24 grid grid-cols-1 gap-8 md:mt-40 md:grid-cols-12">
          <p className="label text-paragraph md:sticky md:top-28 md:col-span-3 md:self-start">
            ({t.projects.caseStudy})
          </p>
          <div className="md:col-span-8 md:col-start-5">
            <CaseStudy content={project.content} />
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="mt-24 md:mt-40">
          <p className="label text-paragraph">({t.projects.gallery})</p>
          {/* Mosaico en dos columnas: cada imagen con su proporcion, sin recortes.
              Con una sola imagen no hay columnas: va centrada a su tamano. */}
          <ul className={`mt-6 gap-2 md:gap-3 ${rest.length > 1 ? "md:columns-2" : ""}`}>
            {rest.map((url) => (
              <li key={url} className="mb-2 break-inside-avoid md:mb-3">
                <div
                  style={frame(url, rest.length > 1 ? undefined : "85svh")}
                  className="relative mx-auto overflow-hidden bg-surface"
                >
                  <Image
                    src={url}
                    alt={project.alts[url] ?? project.name}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Cierre: en vez de mandar al listado, se ofrecen dos proyectos mas. */}
      <SuggestedProjects lang={lang} currentSlug={slug} />
    </main>
  );
}
