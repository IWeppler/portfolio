"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { EXPORT_SCALE, POST_FORMATS, POST_FORMAT_NAMES, type PostFormat } from "@/lib/content/formats";
import { BRAND_KITS } from "@/lib/content/kits";
import { missingFormats, postLabel } from "@/lib/content/post-utils";
import type { Content, PostStatus, UpdatePostInput } from "@/lib/content/schema";
import { ContentForm } from "./ContentForm";
import { CopyRequest } from "./CopyRequest";
import { VersionsPanel } from "./VersionsPanel";
import { STATUS_LABELS, renderUrl, type ContentPost } from "./types";

type PostDetailPageProps = {
  lang: string;
  initialPost: ContentPost;
};

const POLL_MS = 4000;
const STATUSES: PostStatus[] = ["idea", "borrador", "listo", "rechazado"];

export function PostDetailPage({ lang, initialPost }: PostDetailPageProps) {
  const router = useRouter();
  const [post, setPost] = useState(initialPost);
  const [format, setFormat] = useState<PostFormat>(initialPost.format);
  const [slide, setSlide] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  // Clave del ultimo render que termino de cargar; mientras no coincida con
  // el slide/version actual se muestra el spinner.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reviewNote, setReviewNote] = useState(initialPost.reviewNote);
  const [error, setError] = useState<string | null>(null);

  const listHref = `/${lang}/dashboard/content?brand=${post.brand}`;
  const kit = BRAND_KITS[post.brand];
  const slides = post.designs[format]?.slides ?? [];
  const slideCount = slides.length;
  const current = Math.min(slide, Math.max(0, slideCount - 1));
  const { width, height } = POST_FORMATS[format];
  const missing = missingFormats(post);
  // Pestañas: el principal, los que tienen diseño y los pedidos.
  const tabs = POST_FORMAT_NAMES.filter((name) => name === post.format || name in post.designs);
  const addable = POST_FORMAT_NAMES.filter((name) => !tabs.includes(name));
  const issues = post.issues.filter((issue) => issue.format === format);
  const label = postLabel(post);

  const previewKey = `${post.updatedAt}-${format}-${current}`;
  const isRendering = loadedKey !== previewKey;

  // Mientras Claude Code trabaja la pieza cambia por el MCP: se trae de nuevo
  // y solo se reemplaza si cambio updated_at.
  useEffect(() => {
    const interval = window.setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch(`/api/content/posts/${post.id}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { post: ContentPost };
        setPost((previous) => (previous.updatedAt === data.post.updatedAt ? previous : data.post));
      } catch {
        // Un poll fallido no importa: el proximo lo reintenta.
      }
    }, POLL_MS);

    return () => window.clearInterval(interval);
  }, [post.id]);

  async function save(patch: UpdatePostInput) {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/content/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!response.ok) throw new Error();
      setPost(((await response.json()) as { post: ContentPost }).post);
    } catch {
      setError("No se pudo guardar el cambio.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      window.setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    const response = await fetch(`/api/content/posts/${post.id}`, { method: "DELETE" });
    if (response.ok) {
      router.push(listHref);
      router.refresh();
    } else {
      setError("No se pudo borrar la pieza.");
    }
  }

  function selectFormat(name: PostFormat) {
    setFormat(name);
    setSlide(0);
  }

  function requestFormat(name: PostFormat) {
    // Un formato vacio queda como pedido pendiente para Claude.
    void save({ designs: { [name]: { slides: [] } } });
    selectFormat(name);
  }

  function download(index: number) {
    const link = document.createElement("a");
    link.href = renderUrl(post, format, index, EXPORT_SCALE, true);
    link.download = "";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function downloadAll() {
    // Un archivo por slide; con un respiro entre cada uno para que el
    // navegador no bloquee las descargas multiples.
    for (let index = 0; index < slideCount; index++) {
      download(index);
      await new Promise((resolve) => window.setTimeout(resolve, 700));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-assets pb-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <Link href={listHref} className="inline-flex items-center gap-1.5 text-sm text-paragraph hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Content · {kit.name}
          </Link>
          <h1 className="mt-3 text-3xl font-medium leading-tight tracking-tight text-foreground md:text-4xl">{label}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => download(current)}
            disabled={slideCount === 0}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-orange px-4 text-sm font-medium text-dark transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Descargar 2K
          </button>
          {slideCount > 1 && (
            <button
              type="button"
              onClick={() => void downloadAll()}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-assets"
            >
              <Download className="h-4 w-4" />
              Todo el carrusel ({slideCount})
            </button>
          )}
        </div>
      </header>

      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => selectFormat(name)}
                className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-medium transition-colors ${
                  format === name ? "bg-orange text-dark" : "bg-surface text-paragraph hover:text-foreground"
                }`}
              >
                {POST_FORMATS[name].label}
                {missing.includes(name) && <Loader2 className="h-3 w-3 animate-spin" />}
              </button>
            ))}
            {addable.length > 0 && (
              <label className="relative inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs text-paragraph hover:bg-surface hover:text-foreground">
                <Plus className="h-3.5 w-3.5" />
                Pedir formato
                <select
                  value=""
                  disabled={isSaving}
                  onChange={(event) => requestFormat(event.target.value as PostFormat)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Pedir otro formato"
                >
                  <option value="" disabled>
                    Pedir formato
                  </option>
                  {addable.map((name) => (
                    <option key={name} value={name}>
                      {POST_FORMATS[name].label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="flex items-center justify-center rounded-lg bg-surface p-4 md:p-8">
            <div
              className="relative w-full overflow-hidden rounded-md bg-background"
              style={{ aspectRatio: `${width} / ${height}`, maxWidth: `min(100%, calc(72vh * ${width / height}))` }}
            >
              {slideCount === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center text-sm text-paragraph">
                  Este formato todavía no tiene diseño. Copiá el pedido y pegalo en Claude Code.
                  <div className="w-full max-w-sm text-left">
                    <CopyRequest postId={post.id} format={format === post.format ? undefined : format} />
                  </div>
                </div>
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={previewKey}
                    src={renderUrl(post, format, current, 1)}
                    alt={`${label}, slide ${current + 1}`}
                    onLoad={() => setLoadedKey(previewKey)}
                    onError={() => setLoadedKey(previewKey)}
                    className="h-full w-full"
                  />
                  {isRendering && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                      <Loader2 className="h-5 w-5 animate-spin text-paragraph" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {slideCount > 1 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSlide(Math.max(0, current - 1))}
                disabled={current === 0}
                aria-label="Slide anterior"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface text-paragraph hover:text-foreground disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex flex-1 gap-2 overflow-x-auto">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSlide(index)}
                    aria-label={`Slide ${index + 1}`}
                    className={`w-16 shrink-0 overflow-hidden rounded transition-opacity ${
                      index === current ? "ring-2 ring-orange" : "opacity-60 hover:opacity-100"
                    }`}
                    style={{ aspectRatio: `${width} / ${height}` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={renderUrl(post, format, index, 0.5)} alt="" className="h-full w-full" loading="lazy" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSlide(Math.min(slideCount - 1, current + 1))}
                disabled={current === slideCount - 1}
                aria-label="Slide siguiente"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface text-paragraph hover:text-foreground disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {issues.length > 0 && (
            <div className="rounded-lg bg-amber-400/[0.07] p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                {issues.length} aviso{issues.length > 1 ? "s" : ""} del kit de {kit.name}
              </p>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-amber-100/80">
                {issues.map((issue, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => setSlide(issue.slide)}
                      className="text-left hover:text-amber-100"
                    >
                      <span className="font-mono text-xs text-amber-200/70">
                        Slide {issue.slide + 1}
                        {issue.layer !== undefined && ` · capa ${issue.layer + 1}`}
                      </span>{" "}
                      {issue.message}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <Panel title="Estado">
            <div className="grid grid-cols-4 gap-1 rounded-md bg-background p-1">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={isSaving}
                  onClick={() => status !== post.status && void save({ status })}
                  className={`h-8 rounded text-xs font-medium transition-colors ${
                    post.status === status ? "bg-orange text-dark" : "text-paragraph hover:text-foreground"
                  }`}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
            {(post.status === "listo" || post.status === "rechazado") && (
              <div className="mt-3 flex flex-col gap-2">
                <textarea
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  rows={2}
                  maxLength={1000}
                  placeholder={
                    post.status === "listo"
                      ? "Qué funciona de esta pieza (Claude la usa de ejemplo)"
                      : "Qué no funciona (Claude lo evita en las próximas)"
                  }
                  className="w-full resize-y rounded-md bg-background px-3 py-2 text-sm text-foreground placeholder:text-paragraph/50 focus:outline-none focus:ring-1 focus:ring-orange/50"
                />
                {reviewNote !== post.reviewNote && (
                  <button
                    type="button"
                    onClick={() => void save({ reviewNote })}
                    disabled={isSaving}
                    className="h-8 w-fit rounded-md bg-orange px-3 text-xs font-medium text-dark disabled:opacity-50"
                  >
                    Guardar nota
                  </button>
                )}
              </div>
            )}
          </Panel>

          <Panel title="Contenido">
            <ContentForm
              content={post.content}
              version={post.updatedAt}
              isSaving={isSaving}
              onSave={(content: Content) => save({ content })}
            />
          </Panel>

          {post.idea && (
            <Panel title="Idea">
              <p className="whitespace-pre-wrap text-sm text-paragraph">{post.idea}</p>
            </Panel>
          )}

          <Panel title="Historial">
            <VersionsPanel post={post} onRestored={setPost} />
          </Panel>

          <button
            type="button"
            onClick={() => void handleDelete()}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors ${
              confirmDelete ? "bg-red-500/20 text-red-200" : "text-paragraph hover:bg-surface hover:text-foreground"
            }`}
          >
            <Trash2 className="h-4 w-4" />
            {confirmDelete ? "Tocá de nuevo para borrar" : "Borrar pieza"}
          </button>
        </aside>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-surface p-4">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-paragraph">{title}</p>
      {children}
    </div>
  );
}
