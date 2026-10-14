"use client";

import { useState } from "react";
import Link from "next/link";
import { getDictionary } from "@/lib/get-dictionary";
import { useContactForm } from "./useContactForm";
import { ProgressIndicator } from "./ProgressIndicator";
import { StepProjectType } from "./steps/StepProjectType";
import { StepDetails } from "./steps/StepDetails";
import { StepContact } from "./steps/StepContact";

export function ContactFlow({ lang }: { lang: string }) {
  const copy = getDictionary(lang).contact_modal;
  const form = useContactForm();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const progressLabel = copy.progress
    .replace("{step}", String(form.state.step))
    .replace("{total}", "3");

  if (isSubmitted) {
    return (
      <div>
        <h2 className="mb-4 text-statement font-medium text-foreground">
          {copy.success.title}
        </h2>
        <p className="mb-10 text-body text-paragraph">
          {form.state.prefiere_whatsapp
            ? copy.success.message_whatsapp
            : copy.success.message}
        </p>
        <Link
          href={`/${lang}`}
          className="label inline-flex items-center justify-center rounded-full bg-orange px-6 py-4 text-dark transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange"
        >
          {copy.success.close}
        </Link>
      </div>
    );
  }

  return (
    <>
      <ProgressIndicator step={form.state.step} total={3} label={progressLabel} />

      {form.state.step === 1 && (
        <StepProjectType lang={lang} onSelect={form.selectTipoProyecto} />
      )}
      {form.state.step === 2 && (
        <StepDetails
          lang={lang}
          state={form.state}
          onChange={form.setFields}
          onBack={form.back}
          onNext={form.next}
        />
      )}
      {form.state.step === 3 && (
        <StepContact
          lang={lang}
          state={form.state}
          onChange={form.setFields}
          onBack={form.back}
          onSubmitted={() => setIsSubmitted(true)}
        />
      )}
    </>
  );
}
