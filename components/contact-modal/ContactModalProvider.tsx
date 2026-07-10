"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

const ContactModal = dynamic(
  () => import("./ContactModal").then((mod) => mod.ContactModal),
  { ssr: false }
);

type ContactModalContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const ContactModalContext = createContext<ContactModalContextValue | null>(null);

export function useContactModal() {
  const ctx = useContext(ContactModalContext);
  if (!ctx) {
    throw new Error("useContactModal must be used within a ContactModalProvider");
  }
  return ctx;
}

interface ContactModalProviderProps {
  lang: string;
  children: ReactNode;
}

export function ContactModalProvider({ lang, children }: ContactModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <ContactModalContext.Provider value={{ isOpen, open, close }}>
      {children}
      <ContactModal lang={lang} isOpen={isOpen} onClose={close} triggerRef={triggerRef} />
    </ContactModalContext.Provider>
  );
}
