"use client";

import { useState } from "react";
import { getDictionary } from "@/lib/get-dictionary";
import { submitLead, type SubmitLeadInput } from "@/app/actions/submit-lead";
import { HoneypotField } from "../HoneypotField";
import type { ContactFormState } from "../useContactForm";

interface StepContactProps {
  lang: string;
  state: ContactFormState;
  onChange: (payload: Partial<ContactFormState>) => void;
  onBack: () => void;
  onSubmitted: () => void;
}

type FieldErrors = Partial<Record<"nombre" | "email" | "link_referencia", string>>;

const inputClassName =
  "w-full rounded-xl bg-surface px-4 py-3.5 text-foreground placeholder:text-paragraph/60 outline-2 outline-transparent transition-[background-color,outline-color] duration-150 focus:bg-foreground/[0.08] focus-visible:outline-orange";
const errorInputClassName = "outline-red-500 focus-visible:outline-red-500";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function StepContact({
  lang,
  state,
  onChange,
  onBack,
  onSubmitted,
}: StepContactProps) {
  const t = getDictionary(lang);
  const copy = t.contact_modal.step3;
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (!state.nombre.trim()) errors.nombre = copy.error_nombre;
    if (!EMAIL_REGEX.test(state.email.trim())) errors.email = copy.error_email;
    if (state.link_referencia.trim() && !isValidUrl(state.link_referencia.trim())) {
      errors.link_referencia = copy.error_link;
    }

    return errors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus("submitting");

    const payload: SubmitLeadInput = {
      tipo_proyecto: state.tipo_proyecto!,
      estado_idea: state.estado_idea,
      frecuencia_proyectos: state.frecuencia_proyectos,
      presupuesto: state.presupuesto,
      tipo_tercerizado: state.tipo_tercerizado,
      nombre: state.nombre,
      email: state.email,
      whatsapp: state.whatsapp,
      mensaje: state.mensaje,
      link_referencia: state.link_referencia,
      prefiere_whatsapp: state.prefiere_whatsapp,
      idioma: lang as SubmitLeadInput["idioma"],
      honeypot: state.honeypot,
      referrer: document.referrer || undefined,
      utm_source:
        new URLSearchParams(window.location.search).get("utm_source") || undefined,
    };

    try {
      const result = await submitLead(payload);
      if (result.success) {
        onSubmitted();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const submitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} noValidate className="relative">
      <HoneypotField
        value={state.honeypot}
        onChange={(value) => onChange({ honeypot: value })}
      />

      <div className="space-y-4">
        <div>
          <label htmlFor="nombre" className="label block text-paragraph mb-2">
            {copy.nombre_label}
          </label>
          <input
            id="nombre"
            type="text"
            value={state.nombre}
            onChange={(e) => onChange({ nombre: e.target.value })}
            placeholder={copy.nombre_placeholder}
            aria-invalid={Boolean(fieldErrors.nombre)}
            className={`${inputClassName} ${fieldErrors.nombre ? errorInputClassName : ""}`}
          />
          {fieldErrors.nombre && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.nombre}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="label block text-paragraph mb-2">
            {copy.email_label}
          </label>
          <input
            id="email"
            type="email"
            value={state.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder={copy.email_placeholder}
            aria-invalid={Boolean(fieldErrors.email)}
            className={`${inputClassName} ${fieldErrors.email ? errorInputClassName : ""}`}
          />
          {fieldErrors.email && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="whatsapp" className="label block text-paragraph mb-2">
            {copy.whatsapp_label}
          </label>
          <input
            id="whatsapp"
            type="tel"
            value={state.whatsapp}
            onChange={(e) => onChange({ whatsapp: e.target.value })}
            placeholder={copy.whatsapp_placeholder}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="mensaje" className="label block text-paragraph mb-2">
            {copy.mensaje_label}
          </label>
          <textarea
            id="mensaje"
            rows={3}
            value={state.mensaje}
            onChange={(e) => onChange({ mensaje: e.target.value })}
            placeholder={copy.mensaje_placeholder}
            className={`${inputClassName} resize-none`}
          />
        </div>

        <div>
          <label htmlFor="link_referencia" className="label block text-paragraph mb-2">
            {copy.link_label}
          </label>
          <input
            id="link_referencia"
            type="url"
            value={state.link_referencia}
            onChange={(e) => onChange({ link_referencia: e.target.value })}
            placeholder={copy.link_placeholder}
            aria-invalid={Boolean(fieldErrors.link_referencia)}
            className={`${inputClassName} ${fieldErrors.link_referencia ? errorInputClassName : ""}`}
          />
          {fieldErrors.link_referencia && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.link_referencia}</p>
          )}
        </div>

        <label className="flex items-start gap-2.5 text-note text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={state.prefiere_whatsapp}
            onChange={(e) => onChange({ prefiere_whatsapp: e.target.checked })}
            className="mt-0.5 accent-orange"
          />
          {copy.prefiere_whatsapp_label}
        </label>
      </div>

      <div role="status" aria-live="polite">
        {status === "error" && (
          <p className="text-sm text-red-500 mt-4">{copy.error_message}</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-10">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="label inline-flex cursor-pointer rounded-full bg-foreground/[0.06] px-6 py-4 text-foreground transition-[transform,background-color] duration-150 ease-out hover:bg-foreground/[0.12] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t.contact_modal.back}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="label inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-orange px-6 py-4 text-dark transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && (
            <span
              aria-hidden="true"
              className="h-3.5 w-3.5 rounded-full border-2 border-dark/30 border-t-dark animate-spin"
            />
          )}
          {status === "error" ? copy.retry : submitting ? copy.submitting : copy.submit}
        </button>
      </div>

      <p className="label text-paragraph mt-6">{copy.disclaimer}</p>
    </form>
  );
}
