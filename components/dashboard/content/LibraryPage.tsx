"use client";

import { useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import { ExternalLink, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { BRAND_KITS, type BrandId } from "@/lib/content/kits";
import type { AssetCategory, AssetOrigin, LibraryItem, LibraryKind, Scope } from "@/lib/content/library";
import { ContentNav } from "./ContentNav";

type LibraryPageProps = {
  lang: string;
  brand: BrandId;
};

type Filter = "todo" | LibraryKind;

type Draft = {
  key: string;
  file: File;
  preview: string;
  kind: LibraryKind;
  note: string;
  sourceUrl: string;
  tags: string;
  asset: AssetFields;
  status: "idle" | "saving" | "error";
};

type AssetFields = Pick<LibraryItem, "scope" | "category" | "origin" | "demoData">;

const KIND_LABELS: Record<LibraryKind, string> = { referencia: "Referencia", recurso: "Recurso" };

const NOTE_PLACEHOLDER: Record<LibraryKind, string> = {
  referencia: "Qué tomar de acá: la grilla, cómo recorta la captura, el título chico arriba...",
  recurso: "Qué se ve: POS en tablet, fondo naranja, vertical...",
};

const SCOPE_LABELS: Record<Scope, string> = { global: "Global", portfolio: "Ignacio Weppler", comerz: "Comerz" };

// Las mismas listas que lib/content/library.ts (ese modulo usa sharp y no entra al cliente).
const CATEGORY_LABELS: Record<AssetCategory, string> = {
  capture: "Captura real",
  mockup: "Mockup",
  "device-frame": "Marco de dispositivo",
  logo: "Logo",
  icon: "Ícono",
  illustration: "Ilustración",
  object3d: "Objeto 3D",
  texture: "Textura",
  background: "Fondo",
  photo: "Foto",
  other: "Otro",
};

const ORIGIN_LABELS: Record<AssetOrigin, string> = {
  real: "Real",
  own: "Diseño propio",
  procedural: "Generado por código",
  stock: "Banco de imágenes",
  ai: "IA",
};

const MAX_BYTES = 15 * 1024 * 1024;

export function LibraryPage({ lang, brand }: LibraryPageProps) {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loadedBrand, setLoadedBrand] = useState<BrandId | null>(null);
  const [filter, setFilter] = useState<Filter>("todo");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/content/library?brand=${brand}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const data = (await response.json()) as { items: LibraryItem[] };
        if (!cancelled) {
          setItems(data.items);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar la biblioteca. Revisá que la migración esté aplicada.");
      })
      .finally(() => {
        if (!cancelled) setLoadedBrand(brand);
      });
    return () => {
      cancelled = true;
    };
  }, [brand]);

  // Pegar una captura con Ctrl+V en cualquier parte de la pagina.
  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("textarea, input")) return;
      const files = [...(event.clipboardData?.files ?? [])];
      if (files.length > 0) {
        event.preventDefault();
        stage(files);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  function stage(files: File[]) {
    const images = files.filter((file) => file.type.startsWith("image/"));
    const tooBig = images.filter((file) => file.size > MAX_BYTES);
    if (tooBig.length > 0) setError(`${tooBig.length} imagen(es) pesan más de 15 MB y se omitieron.`);

    setDrafts((current) => [
      ...current,
      ...images
        .filter((file) => file.size <= MAX_BYTES)
        .map((file) => ({
          key: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          kind: filter === "recurso" ? ("recurso" as const) : ("referencia" as const),
          note: "",
          sourceUrl: "",
          tags: "",
          asset: { scope: brand, category: "other" as const, origin: "own" as const, demoData: false },
          status: "idle" as const,
        })),
    ]);
  }

  function updateDraft(key: string, patch: Partial<Draft>) {
    setDrafts((current) => current.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)));
  }

  function discardDraft(draft: Draft) {
    URL.revokeObjectURL(draft.preview);
    setDrafts((current) => current.filter((item) => item.key !== draft.key));
  }

  async function saveDraft(draft: Draft) {
    updateDraft(draft.key, { status: "saving" });
    const form = new FormData();
    form.set("file", draft.file);
    form.set("scope", draft.kind === "recurso" ? draft.asset.scope : brand);
    form.set("kind", draft.kind);
    if (draft.kind === "recurso") {
      form.set("category", draft.asset.category);
      form.set("origin", draft.asset.origin);
      form.set("demoData", String(draft.asset.demoData));
    }
    form.set("note", draft.note);
    form.set("sourceUrl", draft.sourceUrl.trim());
    form.set("tags", draft.tags);

    try {
      const response = await fetch("/api/content/library", { method: "POST", body: form });
      if (!response.ok) throw new Error();
      const { item } = (await response.json()) as { item: LibraryItem };
      setItems((current) => [item, ...current]);
      discardDraft(draft);
    } catch {
      updateDraft(draft.key, { status: "error" });
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    stage([...event.dataTransfer.files]);
  }

  const shown = filter === "todo" ? items : items.filter((item) => item.kind === filter);
  const isLoading = loadedBrand !== brand;
  const kit = BRAND_KITS[brand];

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8">
      <header className="flex flex-col gap-5 border-b border-assets pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-medium uppercase leading-none tracking-tight text-foreground md:text-6xl">
            Biblioteca
          </h1>
          <p className="mt-4 max-w-xl text-sm text-paragraph">
            Referencias para inspirar a Claude (con una nota de qué tomar) y recursos que van dentro de las piezas de {kit.name}, más los globales que comparten todas las marcas.
          </p>
        </div>
        <ContentNav lang={lang} brand={brand} section="library" />
      </header>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center transition-colors ${
          isDragging ? "border-orange bg-orange/[0.06]" : "border-assets bg-surface hover:border-paragraph/40"
        }`}
      >
        <ImagePlus className="h-6 w-6 text-paragraph" />
        <p className="text-sm text-foreground">Arrastrá imágenes, hacé clic para elegir o pegá una captura con Ctrl+V</p>
        <p className="text-xs text-paragraph">
          De Instagram o Pinterest subí la captura: los links piden login y no se pueden leer.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            stage([...(event.target.files ?? [])]);
            event.target.value = "";
          }}
        />
      </div>

      {drafts.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Por guardar ({drafts.length})</p>
            {drafts.length > 1 && (
              <button
                type="button"
                onClick={() => drafts.forEach((draft) => draft.status !== "saving" && void saveDraft(draft))}
                className="h-9 rounded-md bg-orange px-4 text-sm font-medium text-dark hover:opacity-90"
              >
                Guardar todas
              </button>
            )}
          </div>
          {drafts.map((draft) => (
            <DraftCard
              key={draft.key}
              draft={draft}
              onChange={(patch) => updateDraft(draft.key, patch)}
              onSave={() => void saveDraft(draft)}
              onDiscard={() => discardDraft(draft)}
            />
          ))}
        </section>
      )}

      <div className="flex w-fit gap-1 rounded-md bg-surface p-1" role="tablist" aria-label="Tipo">
        {(["todo", "referencia", "recurso"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            onClick={() => setFilter(key)}
            className={`h-8 rounded px-3 text-xs font-medium transition-colors ${
              filter === key ? "bg-white/[0.08] text-foreground" : "text-paragraph hover:text-foreground"
            }`}
          >
            {key === "todo"
              ? `Todo (${items.length})`
              : `${KIND_LABELS[key]}s (${items.filter((item) => item.kind === key).length})`}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-assets py-16 text-sm text-paragraph">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando biblioteca
        </div>
      ) : shown.length === 0 ? (
        <p className="rounded-lg border border-assets px-5 py-16 text-center text-sm text-paragraph">
          Todavía no hay nada acá. Subí la primera imagen arriba.
        </p>
      ) : (
        <section className="columns-1 gap-4 sm:columns-2 lg:columns-3 2xl:columns-4">
          {shown.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onChanged={(next) => setItems((current) => current.map((entry) => (entry.id === next.id ? next : entry)))}
              onDeleted={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function KindToggle({ value, onChange }: { value: LibraryKind; onChange: (kind: LibraryKind) => void }) {
  return (
    <div className="grid w-fit grid-cols-2 gap-1 rounded-md bg-background p-1">
      {(["referencia", "recurso"] as const).map((kind) => (
        <button
          key={kind}
          type="button"
          onClick={() => onChange(kind)}
          className={`h-7 rounded px-3 text-xs font-medium transition-colors ${
            value === kind ? "bg-orange text-dark" : "text-paragraph hover:text-foreground"
          }`}
        >
          {KIND_LABELS[kind]}
        </button>
      ))}
    </div>
  );
}

/**
 * Alcance, tipo, origen y si muestra datos de demo. Una captura siempre es
 * real; un logo nunca es global (el servidor tambien lo valida).
 */
function AssetControls({ value, onChange }: { value: AssetFields; onChange: (patch: Partial<AssetFields>) => void }) {
  const select = "h-8 rounded-md bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-orange/50";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Alcance"
        value={value.scope}
        onChange={(event) => onChange({ scope: event.target.value as Scope })}
        className={select}
      >
        {(Object.keys(SCOPE_LABELS) as Scope[]).map((scope) => (
          <option key={scope} value={scope} disabled={scope === "global" && value.category === "logo"}>
            {SCOPE_LABELS[scope]}
          </option>
        ))}
      </select>
      <select
        aria-label="Tipo"
        value={value.category}
        onChange={(event) => {
          const category = event.target.value as AssetCategory;
          onChange(category === "capture" ? { category, origin: "real" } : { category });
        }}
        className={select}
      >
        {(Object.keys(CATEGORY_LABELS) as AssetCategory[]).map((category) => (
          <option key={category} value={category}>
            {CATEGORY_LABELS[category]}
          </option>
        ))}
      </select>
      <select
        aria-label="Origen"
        value={value.origin}
        disabled={value.category === "capture"}
        onChange={(event) => onChange({ origin: event.target.value as AssetOrigin })}
        className={`${select} disabled:opacity-60`}
      >
        {(Object.keys(ORIGIN_LABELS) as AssetOrigin[]).map((origin) => (
          <option key={origin} value={origin}>
            {ORIGIN_LABELS[origin]}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-1.5 text-xs text-paragraph">
        <input
          type="checkbox"
          checked={value.demoData}
          onChange={(event) => onChange({ demoData: event.target.checked })}
          className="accent-orange"
        />
        Datos de demo
      </label>
    </div>
  );
}

const inputClass =
  "w-full rounded-md bg-background px-3 py-2 text-sm text-foreground placeholder:text-paragraph/50 focus:outline-none focus:ring-1 focus:ring-orange/50";

function DraftCard({
  draft,
  onChange,
  onSave,
  onDiscard,
}: {
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-surface p-4 sm:flex-row">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={draft.preview} alt="" className="max-h-56 w-full rounded-md bg-background object-contain sm:w-56" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <KindToggle value={draft.kind} onChange={(kind) => onChange({ kind })} />
        {draft.kind === "recurso" && (
          <AssetControls value={draft.asset} onChange={(asset) => onChange({ asset: { ...draft.asset, ...asset } })} />
        )}
        <textarea
          value={draft.note}
          onChange={(event) => onChange({ note: event.target.value })}
          rows={3}
          maxLength={1500}
          placeholder={NOTE_PLACEHOLDER[draft.kind]}
          className={`${inputClass} resize-y`}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={draft.sourceUrl}
            onChange={(event) => onChange({ sourceUrl: event.target.value })}
            placeholder="Link de origen (opcional)"
            className={inputClass}
          />
          <input
            value={draft.tags}
            onChange={(event) => onChange({ tags: event.target.value })}
            placeholder="Etiquetas, separadas por coma"
            className={inputClass}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={draft.status === "saving"}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-orange px-4 text-sm font-medium text-dark hover:opacity-90 disabled:opacity-50"
          >
            {draft.status === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Guardar
          </button>
          <button
            type="button"
            onClick={onDiscard}
            disabled={draft.status === "saving"}
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm text-paragraph hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Descartar
          </button>
          {draft.status === "error" && <span className="text-sm text-red-300">No se pudo subir. Reintentá.</span>}
        </div>
      </div>
    </div>
  );
}

function ItemCard({
  item,
  onChanged,
  onDeleted,
}: {
  item: LibraryItem;
  onChanged: (item: LibraryItem) => void;
  onDeleted: () => void;
}) {
  const [note, setNote] = useState(item.note);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [failed, setFailed] = useState(false);

  async function patch(body: Partial<Pick<LibraryItem, "note" | "kind"> & AssetFields>) {
    setIsSaving(true);
    setFailed(false);
    try {
      const response = await fetch(`/api/content/library/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error();
      onChanged(((await response.json()) as { item: LibraryItem }).item);
    } catch {
      setFailed(true);
    } finally {
      setIsSaving(false);
    }
  }

  async function remove() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      window.setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    const response = await fetch(`/api/content/library/${item.id}`, { method: "DELETE" });
    if (response.ok) onDeleted();
    else setFailed(true);
  }

  return (
    <article className="mb-4 flex break-inside-avoid flex-col gap-3 rounded-lg bg-surface p-3">
      <a href={item.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md bg-background">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.title || item.note.slice(0, 80)}
          width={item.width}
          height={item.height}
          loading="lazy"
          className="h-auto w-full"
        />
      </a>
      <div className="flex items-center justify-between gap-2">
        <KindToggle value={item.kind} onChange={(kind) => kind !== item.kind && void patch({ kind })} />
        <div className="flex items-center gap-1">
          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir origen"
              className="flex h-8 w-8 items-center justify-center rounded text-paragraph hover:bg-white/[0.05] hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={() => void remove()}
            aria-label={confirmDelete ? "Confirmar borrado" : "Borrar"}
            className={`flex h-8 items-center gap-1.5 rounded px-2 text-xs transition-colors ${
              confirmDelete ? "bg-red-500/20 text-red-200" : "text-paragraph hover:bg-white/[0.05] hover:text-foreground"
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {confirmDelete && "Borrar"}
          </button>
        </div>
      </div>
      {item.kind === "recurso" && (
        <AssetControls value={item} onChange={(asset) => void patch(asset)} />
      )}
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        onBlur={() => note !== item.note && void patch({ note })}
        rows={2}
        maxLength={1500}
        placeholder={NOTE_PLACEHOLDER[item.kind]}
        className={`${inputClass} resize-y`}
      />
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <span key={tag} className="rounded bg-background px-2 py-0.5 text-[11px] text-paragraph">
              {tag}
            </span>
          ))}
        </div>
      )}
      {(isSaving || failed) && (
        <p className={`text-xs ${failed ? "text-red-300" : "text-paragraph"}`}>
          {failed ? "No se pudo guardar." : "Guardando..."}
        </p>
      )}
    </article>
  );
}

