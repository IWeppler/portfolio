"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { getDictionary } from "@/lib/get-dictionary";
import { useContactForm } from "./useContactForm";
import { ProgressIndicator } from "./ProgressIndicator";
import { StepProjectType } from "./steps/StepProjectType";
import { StepDetails } from "./steps/StepDetails";
import { StepContact } from "./steps/StepContact";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ContactModalProps {
  lang: string;
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

export function ContactModal({ lang, isOpen, onClose, triggerRef }: ContactModalProps) {
  const t = getDictionary(lang);
  const copy = t.contact_modal;
  const form = useContactForm();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Focus trap: keep Tab/Shift+Tab cycling within the dialog while open.
  useEffect(() => {
    if (!isOpen) return;

    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab" || !panelRef.current) return;

      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  // Move focus into the dialog on open and whenever the visible step changes.
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const focusables = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusables[0]?.focus();
  }, [isOpen, form.state.step, isSubmitted]);

  const progressLabel = copy.progress
    .replace("{step}", String(form.state.step))
    .replace("{total}", "3");

  return (
    <AnimatePresence
      onExitComplete={() => {
        if (isSubmitted) {
          form.reset();
          setIsSubmitted(false);
        }
        triggerRef.current?.focus();
      }}
    >
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t.navbar.contact}
            className="modal-scroll relative w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl border border-assets bg-surface p-6 md:p-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={copy.close}
              className="absolute right-4 top-4 text-paragraph hover:text-foreground transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {isSubmitted ? (
              <div className="py-8 text-center">
                <h2 className="text-xl md:text-2xl font-medium text-foreground mb-2">
                  {copy.success.title}
                </h2>
                <p className="text-paragraph mb-6">
                  {form.state.prefiere_whatsapp
                    ? copy.success.message_whatsapp
                    : copy.success.message}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-full bg-orange px-6 py-3 text-sm font-medium text-dark transition-opacity hover:opacity-90 cursor-pointer"
                >
                  {copy.success.close}
                </button>
              </div>
            ) : (
              <>
                <ProgressIndicator
                  step={form.state.step}
                  total={3}
                  label={progressLabel}
                />

                {form.state.step === 1 && (
                  <StepProjectType
                    lang={lang}
                    onSelect={form.selectTipoProyecto}
                  />
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
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
