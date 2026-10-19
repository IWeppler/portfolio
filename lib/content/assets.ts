import { getPublishedProjects } from "@/lib/projects/published";
import { getKit, type BrandId } from "./kits";
import { listLibrary, type AssetCategory, type AssetOrigin, type LibraryItem, type Scope, type Viewport } from "./library";

// Catalogo de lo que puede ir dentro de una pieza: logos y capturas del kit,
// imagenes de los proyectos publicados (portfolio) y los recursos de la
// biblioteca, de la marca y globales. find_assets busca aca y, si no hay nada
// que sirva, dice como conseguirlo en vez de improvisar.

export type CatalogAsset = {
  /** Id de la biblioteca, o una clave estable para lo que viene del kit o de un proyecto. */
  ref: string;
  /** Lo que va en src de una capa image. */
  url: string;
  source: "kit" | "project" | "library";
  scope: Scope;
  /** null: imagen de proyecto que todavia nadie describio (annotate_asset). */
  category: AssetCategory | null;
  origin: AssetOrigin | null;
  viewport: Viewport | null;
  project: { slug: string; name: string } | null;
  title: string;
  note: string;
  tags: string[];
  ratio: number | null;
  hasAlpha: boolean | null;
  dominantColor: string | null;
  demoData: boolean;
};

type ProjectInfo = { slug: string; name: string; category: string; excerpt: string; deployUrl: string | null };

export type Catalog = { assets: CatalogAsset[]; projects: ProjectInfo[] };

const fromLibrary = (item: LibraryItem, project: ProjectInfo | null): CatalogAsset => ({
  ref: item.id,
  url: item.url,
  source: item.stored ? "library" : "project",
  scope: item.scope,
  category: item.category,
  origin: item.origin,
  viewport: item.viewport,
  project: project ? { slug: project.slug, name: project.name } : item.projectSlug ? { slug: item.projectSlug, name: item.projectSlug } : null,
  title: item.title,
  note: item.note,
  tags: item.tags,
  ratio: item.height ? Math.round((item.width / item.height) * 100) / 100 : null,
  hasAlpha: item.hasAlpha,
  dominantColor: item.dominantColor || null,
  demoData: item.demoData,
});

export async function listCatalog(brand: BrandId): Promise<Catalog> {
  const kit = getKit(brand);
  const assets: CatalogAsset[] = [
    ...kit.logos.map((logo) => ({
      ref: `kit:${logo.src}`,
      url: logo.src,
      source: "kit" as const,
      scope: brand,
      category: "logo" as const,
      origin: "own" as const,
      viewport: null,
      project: null,
      title: "",
      note: logo.use,
      tags: [],
      ratio: logo.ratio,
      hasAlpha: logo.src.endsWith(".png"),
      dominantColor: null,
      demoData: false,
    })),
    ...kit.assets.map((asset) => ({
      ref: `kit:${asset.src}`,
      url: asset.src,
      source: "kit" as const,
      scope: brand,
      category: asset.category ?? ("mockup" as const),
      origin: asset.category === "capture" ? ("real" as const) : ("own" as const),
      viewport: null,
      project: null,
      title: "",
      note: asset.use,
      tags: [],
      ratio: asset.ratio,
      hasAlpha: false,
      dominantColor: null,
      demoData: asset.demoData ?? false,
    })),
  ];

  const [library, published] = await Promise.all([
    // Sin la biblioteca (migracion pendiente, Supabase caido) el catalogo sigue con el kit y los proyectos.
    listLibrary({ brand, kind: "recurso" }).catch((error) => {
      console.error("content/assets: library unavailable", error);
      return [];
    }),
    brand === "portfolio" ? getPublishedProjects("es") : Promise.resolve([]),
  ]);
  const projects: ProjectInfo[] = published.map((project) => ({
    slug: project.slug,
    name: project.name,
    category: project.category,
    excerpt: project.excerpt,
    deployUrl: project.deployUrl,
  }));
  const bySlug = new Map(projects.map((project) => [project.slug, project]));
  const described = new Map(library.map((item) => [item.url, item]));

  // Las imagenes de proyectos: con su descripcion si alguien la cargo.
  for (const project of published) {
    project.images.forEach((url, index) => {
      const item = described.get(url);
      const info = bySlug.get(project.slug) ?? null;
      assets.push(
        item
          ? fromLibrary(item, info)
          : {
              ref: `project:${project.slug}:${index}`,
              url,
              source: "project",
              scope: "portfolio",
              category: null,
              origin: null,
              viewport: null,
              project: { slug: project.slug, name: project.name },
              title: "",
              note: project.alts[url] ?? "",
              tags: [],
              ratio: null,
              hasAlpha: null,
              dominantColor: null,
              demoData: false,
            },
      );
      described.delete(url);
    });
  }

  // El resto de la biblioteca (lo que no es una imagen de proyecto).
  for (const item of described.values()) {
    assets.push(fromLibrary(item, item.projectSlug ? (bySlug.get(item.projectSlug) ?? null) : null));
  }

  return { assets, projects };
}

// --- Busqueda

export type AssetQuery = {
  need?: string;
  category?: AssetCategory;
  viewport?: Viewport;
  project?: string;
  /** Necesita fondo transparente (un objeto o logo que flota). */
  alpha?: boolean;
  /** Por defecto false: una imagen con cifras de demo no sirve como prueba de nada. */
  allowDemo?: boolean;
  limit?: number;
};

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const words = (text: string) => normalize(text).split(/[^a-z0-9]+/).filter((word) => word.length >= 3);

const PROJECT_CATEGORIES = new Set<AssetCategory>(["capture", "mockup", "photo"]);

// Lo existente y real antes que lo generado: una captura propia dice mas que cualquier imagen nueva.
const ORIGIN_WEIGHT: Record<AssetOrigin, number> = { real: 2, own: 1.5, procedural: 1, stock: 0, ai: -0.5 };

function matchesProject(asset: CatalogAsset, project: string) {
  const wanted = normalize(project);
  return !!asset.project && (asset.project.slug === project || normalize(asset.project.name).includes(wanted));
}

export function rankAssets(catalog: Catalog, query: AssetQuery) {
  const needWords = words(query.need ?? "");
  const projectInfo = new Map(catalog.projects.map((project) => [project.slug, project]));
  const ranked: { asset: CatalogAsset; score: number; why: string[] }[] = [];

  for (const asset of catalog.assets) {
    const why: string[] = [];
    let score = 0;

    if (asset.demoData && !query.allowDemo) continue;
    if (query.category) {
      if (asset.category === query.category) {
        score += 6;
        why.push(`es ${asset.category}`);
      } else if (asset.category !== null || !PROJECT_CATEGORIES.has(query.category)) {
        // Una imagen de proyecto sin describir puede ser captura, mockup o foto; nunca una textura.
        continue;
      }
    }
    if (query.project) {
      if (!matchesProject(asset, query.project)) continue;
      score += 5;
      why.push(`es de ${asset.project?.name}`);
    }
    if (query.viewport && asset.viewport) {
      if (asset.viewport !== query.viewport) continue;
      score += 3;
      why.push(`vista ${asset.viewport}`);
    }
    if (query.alpha) {
      if (asset.hasAlpha === false) continue;
      if (asset.hasAlpha) {
        score += 3;
        why.push("fondo transparente");
      }
    }

    const info = asset.project ? projectInfo.get(asset.project.slug) : undefined;
    const haystack = new Set(
      words([asset.title, asset.note, asset.tags.join(" "), asset.category ?? "", asset.project?.name ?? "", info?.category ?? "", info?.excerpt ?? ""].join(" ")),
    );
    const hits = needWords.filter((word) => haystack.has(word) || [...haystack].some((candidate) => candidate.startsWith(word)));
    if (hits.length > 0) {
      score += hits.length * 1.5;
      why.push(`coincide: ${hits.join(", ")}`);
    }

    if (asset.origin) score += ORIGIN_WEIGHT[asset.origin];
    if (asset.category === null) {
      score -= 1;
      why.push("sin describir: mirarla antes (annotate_asset)");
    }

    ranked.push({ asset, score, why });
  }

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, query.limit ?? 8);
}

/** Como conseguir lo que no esta: siempre lo mas real y barato primero. */
export function suggestSource(catalog: Catalog, query: AssetQuery) {
  const project = query.project ? catalog.projects.find((candidate) => candidate.slug === query.project || normalize(candidate.name).includes(normalize(query.project!))) : undefined;
  const viewport = query.viewport ?? "mobile";

  switch (query.category) {
    case "capture":
      return project?.deployUrl
        ? `Sacar la captura real: node scripts/content-capture.mjs ${project.deployUrl} <salida.png> --viewport ${viewport} (y --full para la pagina entera), revisar si muestra datos de demo y subirla con category capture, origin real, projectSlug ${project.slug}.`
        : "Pedirle a Ignacio la URL o la pantalla exacta y capturarla con scripts/content-capture.mjs; una captura nunca se inventa ni se genera.";
    case "mockup":
    case "device-frame":
      return "Armarlo con una captura real y device (browser | phone) en la capa image; si no hay captura, conseguirla primero.";
    case "texture":
    case "background":
      return "No hace falta un archivo: backdrop (gradient, glows, grain) o una capa graphic (grid, lines, glow) lo resuelven con la paleta del kit.";
    case "icon":
    case "illustration":
      return "Probar con una capa graphic; si hace falta un dibujo concreto, pedirle a Ignacio un SVG o PNG y subirlo como recurso (global si sirve para las dos marcas).";
    case "logo":
      return "Los logos salen del kit; si falta uno, pedirlo y cargarlo en el kit de la marca.";
    default:
      return (
        "Pedirle a Ignacio exactamente esa imagen (que se ve, encuadre, orientacion). Si la idea pide un objeto o una foto que nadie tiene, proponer generarla con IA " +
        "(los MCP de Higgsfield o Canva consumen creditos: confirmar antes) y subirla con origin ai y su prompt; nunca para mostrar la interfaz de un proyecto."
      );
  }
}
