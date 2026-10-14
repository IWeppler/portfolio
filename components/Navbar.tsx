"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RiArrowDownSLine } from "react-icons/ri";
import { LocalTime } from "./ui/LocalTime";
import { Wordmark } from "./ui/Wordmark";

interface NavbarProps {
  lang: string;
  labels: {
    home: string;
    projects: string;
    contact: string;
    about: string;
    start: string;
    location: string;
  };
}

export default function Navbar({ lang, labels }: NavbarProps) {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const languages = [
    { code: "es", label: "Español" },
    { code: "en", label: "English" },
    { code: "pt", label: "Português" },
  ];

  const handleLangSelect = (newLangCode: string) => {
    setIsLangOpen(false);

    if (newLangCode === lang) return;

    if (!pathname) return "/";

    const segments = pathname.split("/");
    segments[1] = newLangCode;
    const newUrl = segments.join("/");

    router.push(newUrl);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] grid w-full grid-cols-[1fr_auto] items-center gap-4 bg-background px-4 py-4 text-foreground md:grid-cols-[1fr_auto_1fr] md:px-8 md:py-5">
      {/* 1. Logo: nombre pesado y apellido en cursiva, con la "w" en un
          cuadrado de acento (components/ui/Wordmark.tsx). */}
      <Link
        href={`/${lang}`}
        aria-label="Ignacio Weppler"
        className="group w-fit focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange"
      >
        <Wordmark />
      </Link>

      {/* 2. Ubicacion y hora local, como en una firma. */}
      <p className="label hidden text-paragraph md:block">
        {labels.location} / <LocalTime />
      </p>

      {/* 3. Menú */}
      <div className="flex items-center justify-end gap-6 md:gap-8">
        <div className="label hidden gap-8 lg:flex">
          <Link href={`/${lang}#projects`} className="transition-colors duration-200 hover:text-paragraph">
            {labels.projects}
          </Link>
          <Link href={`/${lang}#sobremi`} className="transition-colors duration-200 hover:text-paragraph">
            {labels.about}
          </Link>
        </div>

        <Link
          href={`/${lang}/contacto`}
          className="label inline-flex rounded-full bg-orange px-4 py-2.5 text-dark sm:px-5 sm:py-3 transition-[transform,background-color] duration-150 ease-out hover:bg-[color-mix(in_srgb,var(--swiss-orange)_88%,white)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange"
        >
          <span className="sm:hidden">{labels.contact}</span>
          <span className="hidden sm:inline">{labels.start}</span>
        </Link>

        {/* 4. Selector de Idioma */}
        <div className="relative">
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="label flex items-center gap-1 transition-colors duration-200 hover:text-paragraph focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange"
          >
            {lang}
            <RiArrowDownSLine
              size={14}
              className={`transition-transform ${
                isLangOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Menú desplegable: es un menu flotante real, por eso lleva sombra. taste-skill-ignore */}
          {isLangOpen && (
            <div className="absolute right-0 mt-3 w-40 py-2 z-50 bg-surface rounded-md shadow-xl shadow-black/40">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleLangSelect(l.code)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors ${
                    lang === l.code
                      ? "font-medium text-orange"
                      : "text-white/80"
                  }`}
                >
                  {l.code.toUpperCase()} - {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
