export const LANDING_PROJECT_LIMIT = 5;

/**
 * Productos propios: en la home van primero, separados de los trabajos para
 * clientes. Slugs de `projects`.
 */
export const OWN_PRODUCT_SLUGS = new Set(["comerz-pos", "inmobiliaria-terranova"]);

type LandingCandidate = {
  id: string;
  slug: string;
  isPublished: boolean;
  translations: { es?: { title?: string } };
  images: { url: string }[];
};

export function isLandingEligible(project: LandingCandidate) {
  return Boolean(
    project.isPublished &&
      project.slug &&
      project.translations.es?.title?.trim() &&
      project.images.length,
  );
}

/** The badge reflects the same ordered, published cards used by the landing. */
export function markLandingProjects<T extends LandingCandidate>(
  projects: T[],
): (T & { isFeatured: boolean })[] {
  const featured = new Set(
    projects
      .filter(isLandingEligible)
      .slice(0, LANDING_PROJECT_LIMIT)
      .map((project) => project.id),
  );
  return projects.map((project) => ({
    ...project,
    isFeatured: featured.has(project.id),
  }));
}
