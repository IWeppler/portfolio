"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

type ConversionLinkProps = {
  href: string;
  projectId: string;
  children: ReactNode;
  className?: string;
  title?: string;
};

/**
 * Link externo que cuenta como conversion. No trae estilo propio: el que lo usa
 * decide si es el titulo del proyecto, un chip o un boton.
 */
export function ConversionLink({ href, projectId, children, className, title }: ConversionLinkProps) {
  const pathname = usePathname();

  function trackClick() {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname ?? href,
        referrer: document.referrer,
        projectId,
        kind: "click",
      }),
      keepalive: true,
    }).catch(() => {
      // El tracking nunca debe interrumpir la navegación del visitante.
    });
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className={className}
      onClick={trackClick}
    >
      {children}
    </a>
  );
}
