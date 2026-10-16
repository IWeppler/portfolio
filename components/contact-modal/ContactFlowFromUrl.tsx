"use client";

import { useSearchParams } from "next/navigation";
import { ContactFlow } from "./ContactFlow";
import type { TipoProyecto } from "./useContactForm";

// Lee ?tipo= de la URL (p. ej. /contacto?tipo=agencia desde /collabs) para
// arrancar el formulario con ese tipo ya elegido.
const TIPOS_DESDE_URL: TipoProyecto[] = ["agencia"];

export function ContactFlowFromUrl({ lang }: { lang: string }) {
  const tipo = useSearchParams().get("tipo") as TipoProyecto | null;
  const initialTipo = tipo && TIPOS_DESDE_URL.includes(tipo) ? tipo : undefined;

  return <ContactFlow key={initialTipo ?? "none"} lang={lang} initialTipo={initialTipo} />;
}
