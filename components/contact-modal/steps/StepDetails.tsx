"use client";

import { getDictionary } from "@/lib/get-dictionary";
import { OptionCard } from "../OptionCard";
import type { ContactFormState } from "../useContactForm";

interface StepDetailsProps {
  lang: string;
  state: ContactFormState;
  onChange: (payload: Partial<ContactFormState>) => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepDetails({
  lang,
  state,
  onChange,
  onBack,
  onNext,
}: StepDetailsProps) {
  const t = getDictionary(lang);
  const copy = t.contact_modal;
  const isAgencia = state.tipo_proyecto === "agencia";

  const canContinue = isAgencia
    ? Boolean(state.tipo_tercerizado && state.frecuencia_proyectos)
    : Boolean(state.estado_idea && state.presupuesto);

  return (
    <div>
      {isAgencia ? (
        <>
          <h2 className="text-lg md:text-xl font-medium text-foreground mb-4">
            {copy.step2_agencia.tipo_title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {(
              Object.keys(copy.step2_agencia.tipo_options) as Array<
                keyof typeof copy.step2_agencia.tipo_options
              >
            ).map((key) => (
              <OptionCard
                key={key}
                label={copy.step2_agencia.tipo_options[key]}
                selected={state.tipo_tercerizado === key}
                onClick={() => onChange({ tipo_tercerizado: key })}
                size="sm"
              />
            ))}
          </div>

          <h2 className="text-lg md:text-xl font-medium text-foreground mb-4">
            {copy.step2_agencia.frecuencia_title}
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {(
              Object.keys(copy.step2_agencia.frecuencia_options) as Array<
                keyof typeof copy.step2_agencia.frecuencia_options
              >
            ).map((key) => (
              <OptionCard
                key={key}
                label={copy.step2_agencia.frecuencia_options[key]}
                selected={state.frecuencia_proyectos === key}
                onClick={() => onChange({ frecuencia_proyectos: key })}
                size="sm"
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <h2 className="text-lg md:text-xl font-medium text-foreground mb-4">
            {copy.step2_cliente.idea_title}
          </h2>
          <div className="grid grid-cols-1 gap-3 mb-4">
            {(
              Object.keys(copy.step2_cliente.idea_options) as Array<
                keyof typeof copy.step2_cliente.idea_options
              >
            ).map((key) => (
              <OptionCard
                key={key}
                label={copy.step2_cliente.idea_options[key]}
                selected={state.estado_idea === key}
                onClick={() => onChange({ estado_idea: key })}
                size="sm"
              />
            ))}
          </div>

          <h2 className="text-lg md:text-xl font-medium text-foreground mb-4">
            {copy.step2_cliente.presupuesto_title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              Object.keys(copy.presupuesto_options) as Array<
                keyof typeof copy.presupuesto_options
              >
            ).map((key) => (
              <OptionCard
                key={key}
                label={copy.presupuesto_options[key]}
                selected={state.presupuesto === key}
                onClick={() => onChange({ presupuesto: key })}
                size="sm"
              />
            ))}
          </div>
        </>
      )}

      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-paragraph hover:text-foreground transition-colors cursor-pointer"
        >
          {copy.back}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="inline-flex items-center justify-center rounded-full bg-orange px-6 py-3 text-sm font-medium text-dark transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copy.continue}
        </button>
      </div>
    </div>
  );
}
