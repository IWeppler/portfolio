"use client";

import { useId, useState } from "react";

export type FaqItem = { q: string; a: string };

/**
 * Preguntas que se abren y cierran con transicion de alto (grid 0fr -> 1fr,
 * funciona en todos los navegadores). La respuesta queda siempre en el HTML,
 * asi Google y las IA la leen aunque este cerrada.
 */
export function FaqList({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const baseId = useId();

  return (
    <ul className="border-t border-foreground/20">
      {items.map((item, index) => {
        const isOpen = open === index;
        const panelId = `${baseId}-${index}`;

        return (
          <li key={item.q} className="border-b border-foreground/20">
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : index)}
                className="flex w-full cursor-pointer items-baseline justify-between gap-6 py-6 text-left"
              >
                <span className="text-body font-medium text-foreground md:text-xl">{item.q}</span>
                <span
                  aria-hidden="true"
                  className={`label shrink-0 text-paragraph transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden" inert={!isOpen}>
                <p className="text-body max-w-2xl pb-6 text-paragraph">{item.a}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
