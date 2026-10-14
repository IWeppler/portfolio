"use client";

import Link from "next/link";
import { TextPressure } from "./ui/TextPressure";
import { getDictionary } from "@/lib/get-dictionary";

export default function HeroSection({ lang }: { lang: string }) {
  const t = getDictionary(lang);
  const year = new Date().getFullYear();

  return (
    <section className="relative flex min-h-[100svh] w-full flex-col bg-background pt-24 pb-8 md:pt-28 md:pb-10">
      {/* Fila de datos: que es esto, quien y desde donde. */}
      <div className="hero-rise grid grid-cols-2 gap-y-2 text-paragraph md:grid-cols-3">
        <p className="label">
          ({t.hero.portfolio} / ©{year})
        </p>
        <p className="label text-right md:text-center">{t.hero.role}</p>
        <p className="label hidden text-right md:block">{t.hero.location}</p>
      </div>

      {/* El nombre en dos lineas: la primera a la izquierda, la segunda contra
          el margen derecho. Las letras reaccionan a la distancia del cursor. */}
      <TextPressure
        label={`${t.hero.name_first} ${t.hero.name_last}`}
        lines={[
          { text: t.hero.name_first, align: "start" },
          { text: t.hero.name_last, align: "end" },
        ]}
        className="my-auto py-10 text-foreground select-none"
        lineClassName="w-full md:w-[74%]"
      />

      <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-[1fr_auto_1fr]">
        <p className="hero-rise max-w-[40ch] text-[clamp(1.125rem,1.5vw,1.375rem)] leading-[1.35] tracking-[-0.01em] text-foreground [animation-delay:200ms]">
          {t.hero.statement}
        </p>

        <p className="label hero-rise hidden text-center text-paragraph md:block [animation-delay:260ms]">
          ↓ {t.hero.scroll}
        </p>

        <div className="hero-rise md:flex md:justify-end [animation-delay:300ms]">
          <Link
            href="#projects"
            className="label inline-flex items-center gap-2 rounded-full bg-foreground/[0.06] px-6 py-4 text-foreground transition-[transform,background-color] duration-150 ease-out hover:bg-foreground/[0.12] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange"
          >
            {t.hero.cta_works} →
          </Link>
        </div>
      </div>
    </section>
  );
}
