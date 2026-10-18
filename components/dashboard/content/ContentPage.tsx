"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Check, Copy, Loader2, Plus, Sparkles, Terminal } from "lucide-react";
import { POST_FORMATS, POST_FORMAT_NAMES, type PostFormat } from "@/lib/content/formats";
import { BRAND_KITS, type BrandId } from "@/lib/content/kits";
import { designedFormats, missingFormats, postLabel } from "@/lib/content/post-utils";
import { ContentNav } from "./ContentNav";
import { STATUS_LABELS, STATUS_STYLES, renderUrl, type ContentPost } from "./types";

type ContentPageProps = {
  lang: string;
  brand: BrandId;
};

// Cada tanto se vuelve a pedir la lista: Claude Code escribe por el MCP y la
// pieza aparece sola, sin recargar.
const POLL_MS = 5000;

export function ContentPage({ lang, brand }: ContentPageProps) {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loadedBrand, setLoadedBrand] = useState<BrandId | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/content/posts?brand=${brand}`, { cache: "no-store" });
        if (!response.ok) throw new Error();
        const data = (await response.json()) as { posts: ContentPost[] };
        if (!cancelled) {
          setPosts(data.posts);
          setLoadedBrand(brand);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setLoadedBrand(brand);
          setError("No se pudo cargar el contenido. Revisá que la migración esté aplicada.");
        }
      }
    }

    void load();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [brand]);

  const isLoading = loadedBrand !== brand;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8">
      <header className="flex flex-col gap-5 border-b border-assets pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-medium uppercase leading-none tracking-tight text-foreground md:text-6xl">
            Content
          </h1>
          <p className="mt-4 max-w-xl text-sm text-paragraph">
            Cargá una idea, pedile a Claude Code que la diseñe con el kit de la marca y bajá cada slide en 2K.
          </p>
        </div>
        <ContentNav lang={lang} brand={brand} section="posts" />
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <IdeaForm key={brand} brand={brand} onCreated={(post) => setPosts((current) => [post, ...current])} />
        <ConnectCard />
      </div>

      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-assets py-16 text-sm text-paragraph">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando piezas
        </div>
      ) : posts.length === 0 ? (
        <p className="rounded-lg border border-assets px-5 py-16 text-center text-sm text-paragraph">
          Todavía no hay piezas de {BRAND_KITS[brand].name}. Cargá la primera idea arriba.
        </p>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} href={`/${lang}/dashboard/content/${post.id}`} />
          ))}
        </section>
      )}
    </div>
  );
}

function IdeaForm({ brand, onCreated }: { brand: BrandId; onCreated: (post: ContentPost) => void }) {
  const [idea, setIdea] = useState("");
  const [format, setFormat] = useState<PostFormat>("portrait");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = idea.trim();
    if (!text) return;

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/content/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, idea: text, format }),
      });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { post: ContentPost };
      onCreated(data.post);
      setIdea("");
    } catch {
      setError("No se pudo guardar la idea.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg bg-surface p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Sparkles className="h-4 w-4 text-orange" />
        Nueva idea para {BRAND_KITS[brand].name}
      </div>
      <textarea
        value={idea}
        onChange={(event) => setIdea(event.target.value)}
        rows={4}
        maxLength={4000}
        placeholder={
          brand === "comerz"
            ? "Ej: carrusel de 3 slides sobre cómo cerrar la caja del día sin planillas."
            : "Ej: carrusel de 3 slides sobre por qué una inmobiliaria necesita fichas de propiedad rápidas, con el mockup de Terranova."
        }
        className="w-full resize-y rounded-md bg-background px-4 py-3 text-sm text-foreground placeholder:text-paragraph/60 focus:outline-none focus:ring-1 focus:ring-orange/50"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Formato">
          {POST_FORMAT_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={format === name}
              onClick={() => setFormat(name)}
              className={`h-9 rounded-md px-3 text-xs font-medium transition-colors ${
                format === name ? "bg-orange text-dark" : "bg-background text-paragraph hover:text-foreground"
              }`}
            >
              {POST_FORMATS[name].label}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={isSaving || !idea.trim()}
          className="inline-flex h-10 w-fit shrink-0 items-center gap-2 rounded-md bg-orange px-4 text-sm font-medium text-dark transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Guardar idea
        </button>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </form>
  );
}

const noopSubscribe = () => () => {};

const PROMPT = "Diseñá los pedidos pendientes del módulo Content del portfolio.";

function ConnectCard() {
  const origin = useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => "https://tu-dominio",
  );
  const [copied, setCopied] = useState<string | null>(null);

  const command = `claude mcp add --transport http portfolio-content ${origin}/api/mcp --header "Authorization: Bearer $CONTENT_MCP_TOKEN"`;

  async function copy(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-surface p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Terminal className="h-4 w-4 text-orange" />
        Claude Code
      </div>
      <p className="text-sm text-paragraph">
        Conectá el MCP una vez (con <code className="font-mono text-xs">CONTENT_MCP_TOKEN</code> en tu entorno) y después pedile:
      </p>
      <CopyRow label="Conexión" text={command} copied={copied === "command"} onCopy={() => void copy("command", command)} />
      <CopyRow label="Pedido" text={PROMPT} copied={copied === "prompt"} onCopy={() => void copy("prompt", PROMPT)} />
    </div>
  );
}

function CopyRow({
  label,
  text,
  copied,
  onCopy,
}: {
  label: string;
  text: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-background p-3">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-paragraph">{label}</p>
        <p className="mt-1 break-all font-mono text-xs text-foreground">{text}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        aria-label={`Copiar ${label.toLowerCase()}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-paragraph transition-colors hover:bg-white/[0.05] hover:text-foreground"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

function PostCard({ post, href }: { post: ContentPost; href: string }) {
  const [format] = designedFormats(post);
  const shown = format ?? post.format;
  const { width, height } = POST_FORMATS[shown];
  const slides = format ? (post.designs[format]?.slides.length ?? 0) : 0;
  const pending = missingFormats(post).length;
  const label = postLabel(post);

  return (
    <Link href={href} className="group flex flex-col gap-3 rounded-lg bg-surface p-3 transition-colors hover:bg-assets">
      <div
        className="relative flex w-full items-center justify-center overflow-hidden rounded-md bg-background"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {format ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={renderUrl(post, format, 0, 0.5)} alt={label} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 text-center text-xs text-paragraph">
            <Loader2 className="h-4 w-4 animate-spin" />
            Esperando a Claude Code
          </div>
        )}
        {slides > 1 && (
          <span className="absolute right-2 top-2 rounded bg-dark/70 px-2 py-0.5 font-mono text-[11px] text-foreground">
            1/{slides}
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-3 px-1 pb-1">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{label}</p>
          <p className="mt-0.5 text-xs text-paragraph">
            {designedFormats(post).map((name) => POST_FORMATS[name].label).join(" · ") || POST_FORMATS[post.format].label}
            {format && pending > 0 && ` · ${pending} pendiente${pending > 1 ? "s" : ""}`}
          </p>
        </div>
        <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[post.status]}`}>
          {STATUS_LABELS[post.status]}
        </span>
      </div>
    </Link>
  );
}
