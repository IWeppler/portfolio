import type { ProjectImage } from "./ImageManager";
import type { ProjectCategory } from "@/lib/projects/categories";

export type ProjectTranslation = {
  title?: string;
  excerpt?: string;
  content?: string;
};

export type ProjectTranslations = {
  es?: ProjectTranslation;
  en?: ProjectTranslation;
  pt?: ProjectTranslation;
};

export type ProjectRecord = {
  id: string;
  slug: string;
  client?: string | null;
  category: ProjectCategory;
  deployUrl?: string | null;
  githubUrl?: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  order: number | null;
  translations: ProjectTranslations;
  images: ProjectImage[];
  created_at?: string;
};

export const LANGS = [
  { code: "es", label: "Español", flag: "🇪🇸", isDefault: true },
  { code: "en", label: "English", flag: "🇺🇸", isDefault: false },
  { code: "pt", label: "Português (BR)", flag: "🇧🇷", isDefault: false },
] as const;

export type LangCode = (typeof LANGS)[number]["code"];

export function isTranslationComplete(translation?: ProjectTranslation) {
  return Boolean(
    translation?.title?.trim() &&
      translation?.excerpt?.trim() &&
      translation?.content?.trim(),
  );
}

export type { ProjectImage };
