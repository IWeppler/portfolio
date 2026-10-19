"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import { Check, Copy } from "lucide-react";
import type { PostFormat } from "@/lib/content/formats";

// El pedido que se pega en Claude Code. La skill content-post lee la pieza
// por el MCP, arma el brief con todo lo que sabe, lo muestra para aprobarlo y
// recien despues diseña. Nada trabaja solo: sin pegar el pedido no pasa nada.

export function requestFor(postId?: string, format?: PostFormat) {
  return ["/content-post", postId, format].filter(Boolean).join(" ");
}

export function CopyRequest({
  postId,
  format,
  compact = false,
}: {
  postId?: string;
  format?: PostFormat;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const text = requestFor(postId, format);

  async function copy(event: MouseEvent) {
    // En la tarjeta de la lista el boton vive dentro de un link.
    event.preventDefault();
    event.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={(event) => void copy(event)}
        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-orange px-3 text-xs font-medium text-dark transition-opacity hover:opacity-90"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copiado" : "Copiar pedido"}
      </button>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-md bg-background p-3">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-paragraph">Pedido para Claude Code</p>
        <p className="mt-1 break-all font-mono text-xs text-foreground">{text}</p>
      </div>
      <button
        type="button"
        onClick={(event) => void copy(event)}
        aria-label="Copiar pedido"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-paragraph transition-colors hover:bg-white/[0.05] hover:text-foreground"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
