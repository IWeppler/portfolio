import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Github } from "lucide-react";
import { getDictionary } from "@/lib/get-dictionary";
import { getPublishedProject, getPublishedProjects } from "@/lib/projects/published";
import { categoryLabel } from "@/lib/projects/categories";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { ConversionLink } from "@/components/analytics/ConversionLink";
import SuggestedProjects from "@/components/projects/SuggestedProjects";
import { OG_LOCALES, alternatesFor, isLang } from "@/lib/seo";

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
    // El openGraph de la pagina reemplaza entero al del layout.
    openGraph: {
      siteName: "Ignacio Weppler",
      type: "website",
      locale: OG_LOCALES[isLang(lang) ? lang : "es"],
      title: project.name,
      description: project.excerpt || undefined,
      ...(project.cover && { images: [{ url: project.cover, alt: project.name }] }),
    },
  };
}

const colors = {
  swissOrange: "#FF3B30",
  surface: "#141A1F",
  assets: "#2D3339",
  paragraph: "#9CA3AF",
  foreground: "#EDEDE9",
};

export default async function ProjectPage({ params }: Props) {
  const { lang, slug } = await params;
  const t = getDictionary(lang);

  const project = await getPublishedProject(slug, lang);

  if (!project) {
    notFound();
  }

  const visitLabel = t.projects?.visitProject || "Ver Proyecto";
  const backLabel = t.projects?.back || "Volver a proyectos";
  const codeLabel = t.projects?.viewCode || "Ver código";

  const [hero, ...rest] = project.cover
    ? [project.cover, ...project.images.filter((url) => url !== project.cover)]
    : project.images;

  return (
    <section className="w-full min-h-screen bg-background text-foreground pt-16 md:pt-32 pb-20 px-4 md:px-20">
      <PageViewTracker projectId={slug} />
      <div className="max-w-5xl mx-auto">
        <Link
          href={`/${lang}/projects`}
          className="group mb-10 inline-flex items-center gap-2 text-sm uppercase tracking-widest text-paragraph transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          {backLabel}
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <small
            className="uppercase tracking-widest text-sm"
            style={{ color: colors.swissOrange }}
          >
            {categoryLabel(project.category, lang)}
          </small>

          {project.githubUrl && (
            <ConversionLink
              href={project.githubUrl}
              projectId={slug}
              className="inline-flex items-center gap-2 rounded-full border border-assets px-4 py-1.5 text-sm text-paragraph transition-colors hover:border-foreground/40 hover:text-foreground"
              title={codeLabel}
            >
              <Github className="h-4 w-4" />
              {codeLabel}
            </ConversionLink>
          )}
        </div>

        {/* El titulo es el link a la web del proyecto; sin deploy queda plano. */}
        <h2 className="text-4xl md:text-7xl font-medium uppercase tracking-tight mb-6 text-balance">
          {project.deployUrl ? (
            <ConversionLink
              href={project.deployUrl}
              projectId={slug}
              className="group inline-flex items-start gap-3 transition-colors hover:text-orange"
              title={visitLabel}
            >
              {project.name}
              <ArrowUpRight className="h-6 w-6 shrink-0 md:h-10 md:w-10 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </ConversionLink>
          ) : (
            project.name
          )}
        </h2>

        {project.excerpt && (
          <p
            className="text-xl max-w-3xl leading-relaxed mb-12"
            style={{ color: colors.paragraph }}
          >
            {project.excerpt}
          </p>
        )}

        {hero && (
          <div
            className="relative w-full h-[380px] md:h-[620px] rounded-xl overflow-hidden mb-20 bg-zinc-900 border"
            style={{ borderColor: colors.assets }}
          >
            <Image src={hero} alt={project.name} fill className="object-cover" priority />
          </div>
        )}

        {project.content && (
          <div
            className="text-lg leading-relaxed whitespace-pre-line mb-20 max-w-3xl"
            style={{ color: colors.paragraph }}
          >
            {project.content}
          </div>
        )}

        {rest.map((url) => (
          <div
            key={url}
            className="relative w-full h-[380px] md:h-[620px] rounded-xl overflow-hidden mb-20 bg-zinc-900 border"
            style={{ borderColor: colors.assets }}
          >
            <Image src={url} alt={project.name} fill className="object-cover" />
          </div>
        ))}

        {/* Cierre: en vez de mandar al listado, se ofrecen dos proyectos mas. */}
        <SuggestedProjects lang={lang} currentSlug={slug} />
      </div>
    </section>
  );
}
