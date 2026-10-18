import type { ContentPost, PostVersion } from "@/lib/content/posts";
import type { PostFormat } from "@/lib/content/formats";
import type { PostStatus } from "@/lib/content/schema";

export type { ContentPost, PostVersion };

export const STATUS_LABELS: Record<PostStatus, string> = {
  idea: "Idea",
  borrador: "Borrador",
  listo: "Listo",
  rechazado: "Rechazado",
};

export const STATUS_STYLES: Record<PostStatus, string> = {
  idea: "bg-white/[0.06] text-paragraph",
  borrador: "bg-swiss-blue/20 text-[#9db8e3]",
  listo: "bg-emerald-500/15 text-emerald-300",
  rechazado: "bg-red-500/15 text-red-300",
};

export function renderUrl(
  post: ContentPost,
  format: PostFormat,
  slide: number,
  scale: 0.5 | 1 | 2,
  download = false,
) {
  const params = new URLSearchParams({
    format,
    slide: String(slide),
    scale: String(scale),
    v: post.updatedAt,
  });
  if (download) params.set("download", "1");

  return `/api/content/posts/${post.id}/render?${params}`;
}
