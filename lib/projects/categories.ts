import { getDictionary } from "@/lib/get-dictionary";

/**
 * Categorias de proyecto. La clave es lo que se guarda en `projects.category`;
 * el label sale de los locales (`project_categories`), asi que la misma
 * categoria se muestra traducida sin duplicar datos en la base.
 */
export const PROJECT_CATEGORIES = ["web", "app-saas", "diseno"] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const DEFAULT_CATEGORY: ProjectCategory = "web";

export function isProjectCategory(value: unknown): value is ProjectCategory {
  return PROJECT_CATEGORIES.includes(value as ProjectCategory);
}

/**
 * El panel admin es solo en espanol y es un client component: usa estos labels
 * en vez de `categoryLabel` para no arrastrar los tres diccionarios al bundle.
 */
export const CATEGORY_ADMIN_LABELS: Record<ProjectCategory, string> = {
  web: "Web",
  "app-saas": "App & SaaS",
  diseno: "Diseño & Marca",
};

export function categoryLabel(category: string, lang: string) {
  const labels = getDictionary(lang).project_categories as Record<string, string>;

  return labels[category] ?? labels[DEFAULT_CATEGORY];
}

export function allCategoriesLabel(lang: string) {
  return (getDictionary(lang).project_categories as Record<string, string>).all;
}
