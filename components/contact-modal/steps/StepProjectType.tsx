"use client";

import { getDictionary } from "@/lib/get-dictionary";
import { OptionCard } from "../OptionCard";
import type { TipoProyecto } from "../useContactForm";

const ORDER: TipoProyecto[] = [
  "web_inmobiliaria",
  "app_gestion",
  "web_corporativa",
  "agencia",
  "otro",
];

interface StepProjectTypeProps {
  lang: string;
  onSelect: (value: TipoProyecto) => void;
}

export function StepProjectType({ lang, onSelect }: StepProjectTypeProps) {
  const t = getDictionary(lang);
  const copy = t.contact_modal.step1;

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-medium text-foreground mb-5">
        {copy.title}
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {ORDER.map((value) => (
          <OptionCard
            key={value}
            label={copy.options[value]}
            selected={false}
            onClick={() => onSelect(value)}
            size="lg"
          />
        ))}
      </div>
    </div>
  );
}
