"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Plus, X } from "lucide-react";
import type { Content } from "@/lib/content/schema";

type ContentFormProps = {
  content: Content;
  /** Cambia cuando la pieza se guarda (desde aca o desde Claude). */
  version: string;
  isSaving: boolean;
  onSave: (content: Content) => Promise<void>;
};

const FIELDS: { key: Exclude<keyof Content, "points">; label: string; rows: number; hint?: string }[] = [
  { key: "title", label: "Título", rows: 2 },
  { key: "subtitle", label: "Subtítulo", rows: 2 },
  { key: "body", label: "Cuerpo", rows: 3 },
  { key: "cta", label: "CTA", rows: 1 },
  { key: "caption", label: "Caption", rows: 6, hint: "Texto del posteo en Instagram" },
  { key: "objective", label: "Objetivo", rows: 2 },
  { key: "audience", label: "Público", rows: 1 },
];

const sameContent = (a: Content, b: Content) => JSON.stringify(a) === JSON.stringify(b);

// Lo que dice la pieza. Los textos vinculados del diseño se actualizan solos
// al guardar, sin rehacer el diseño.
export function ContentForm({ content, version, isSaving, onSave }: ContentFormProps) {
  const [draft, setDraft] = useState(content);
  // Contenido sobre el que se empezo a editar; contra eso se mide si hay cambios.
  const [base, setBase] = useState({ version, content });
  const [copied, setCopied] = useState(false);

  const isDirty = !sameContent(draft, base.content);

  // Si la pieza cambio afuera (Claude por el MCP, o este mismo guardado) y no
  // hay cambios sin guardar, se toma la version nueva.
  if (version !== base.version) {
    if (!isDirty || sameContent(draft, content)) {
      setDraft(content);
      setBase({ version, content });
    } else {
      setBase((current) => ({ ...current, version }));
    }
  }

  const set = <K extends keyof Content>(key: K, value: Content[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  async function copyCaption() {
    await navigator.clipboard.writeText(draft.caption);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(draft);
      }}
      className="flex flex-col gap-3"
    >
      {FIELDS.map((field) => (
        <label key={field.key} className="flex flex-col gap-1.5">
          <span className="flex items-center justify-between text-xs text-paragraph">
            {field.label}
            {field.key === "caption" && draft.caption && (
              <button
                type="button"
                onClick={() => void copyCaption()}
                className="inline-flex items-center gap-1 text-paragraph hover:text-foreground"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copiar
              </button>
            )}
          </span>
          <textarea
            value={draft[field.key]}
            onChange={(event) => set(field.key, event.target.value)}
            rows={field.rows}
            placeholder={field.hint}
            className="w-full resize-y rounded-md bg-background px-3 py-2 text-sm text-foreground placeholder:text-paragraph/50 focus:outline-none focus:ring-1 focus:ring-orange/50"
          />
        </label>
      ))}

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-paragraph">Puntos</span>
        {draft.points.map((point, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="mt-2 w-5 shrink-0 font-mono text-[11px] text-paragraph">{index + 1}</span>
            <textarea
              value={point}
              onChange={(event) =>
                set(
                  "points",
                  draft.points.map((current, i) => (i === index ? event.target.value : current)),
                )
              }
              rows={2}
              className="w-full resize-y rounded-md bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-orange/50"
            />
            <button
              type="button"
              onClick={() => set("points", draft.points.filter((_, i) => i !== index))}
              aria-label={`Quitar punto ${index + 1}`}
              className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded text-paragraph hover:bg-white/[0.05] hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {draft.points.length < 10 && (
          <button
            type="button"
            onClick={() => set("points", [...draft.points, ""])}
            className="inline-flex h-8 w-fit items-center gap-1.5 rounded px-2 text-xs text-paragraph hover:bg-white/[0.05] hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar punto
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={!isDirty || isSaving}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-orange px-4 text-sm font-medium text-dark transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Guardar contenido
        </button>
        {isDirty && (
          <button
            type="button"
            onClick={() => {
              setDraft(content);
              setBase({ version, content });
            }}
            className="h-9 rounded-md px-3 text-sm text-paragraph hover:text-foreground"
          >
            Descartar
          </button>
        )}
      </div>
    </form>
  );
}
