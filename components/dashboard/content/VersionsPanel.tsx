"use client";

import { useState } from "react";
import { History, Loader2, RotateCcw } from "lucide-react";
import { designedFormats, postLabel } from "@/lib/content/post-utils";
import type { ContentPost, PostVersion } from "./types";

type VersionsPanelProps = {
  post: ContentPost;
  onRestored: (post: ContentPost) => void;
};

const formatDate = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

// Historial de la pieza: cada cambio de contenido o diseño deja la version
// anterior. Restaurar tambien se puede deshacer, porque guarda la actual.
export function VersionsPanel({ post, onRestored }: VersionsPanelProps) {
  const [versions, setVersions] = useState<PostVersion[] | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/content/posts/${post.id}/versions`, { cache: "no-store" });
      if (!response.ok) throw new Error();
      setVersions(((await response.json()) as { versions: PostVersion[] }).versions);
      setLoadedFor(post.updatedAt);
    } catch {
      setError("No se pudo cargar el historial.");
    } finally {
      setIsLoading(false);
    }
  }

  async function restore(versionId: string) {
    setRestoring(versionId);
    setError(null);
    try {
      const response = await fetch(`/api/content/posts/${post.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      if (!response.ok) throw new Error();
      onRestored(((await response.json()) as { post: ContentPost }).post);
      setVersions(null);
    } catch {
      setError("No se pudo restaurar esa versión.");
    } finally {
      setRestoring(null);
    }
  }

  // La lista queda vieja en cuanto la pieza cambia; se vuelve a pedir a mano.
  const isStale = versions !== null && loadedFor !== post.updatedAt;

  if (versions === null || isStale) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => void load()}
          disabled={isLoading}
          className="inline-flex h-9 w-fit items-center gap-2 rounded-md bg-background px-3 text-sm text-paragraph hover:text-foreground disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <History className="h-3.5 w-3.5" />}
          {isStale ? "Actualizar historial" : "Ver versiones anteriores"}
        </button>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </div>
    );
  }

  if (versions.length === 0) {
    return <p className="text-sm text-paragraph">Todavía no hay versiones anteriores.</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {versions.map((version) => (
        <div key={version.id} className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-background">
          <div className="min-w-0">
            <p className="truncate text-sm text-foreground">{postLabel({ content: version.content, idea: post.idea })}</p>
            <p className="text-xs text-paragraph">
              {formatDate.format(new Date(version.createdAt))} · {version.editedBy === "claude" ? "Claude" : "Panel"}
              {" · "}
              {designedFormats(version).length} formato{designedFormats(version).length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void restore(version.id)}
            disabled={restoring !== null}
            aria-label="Restaurar esta versión"
            className="flex h-8 shrink-0 items-center gap-1.5 rounded px-2 text-xs text-paragraph hover:bg-white/[0.05] hover:text-foreground disabled:opacity-50"
          >
            {restoring === version.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            Restaurar
          </button>
        </div>
      ))}
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
