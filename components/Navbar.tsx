"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RiGlobalLine, RiArrowDownSLine } from "react-icons/ri";

interface NavbarProps {
  lang: string;
  labels: {
    home: string;
    projects: string;
    contact: string;
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
    <nav className="w-full flex justify-between items-center py-6 bg-background text-foreground px-4 md:px-20">
      {/* 1. Logo */}
      <Link href={`/${lang}`} className="uppercase font-medium">
        Ignacio
      </Link>

      {/* 2. Menú */}
      <div className="flex items-center gap-8 font-medium">
        <div className="hidden md:flex gap-8">
          <Link
            href={`/${lang}`}
            className="transition-colors hover:text-orange"
          >
            {labels.home}
          </Link>
          <Link
            href={`/${lang}/projects`}
            className="transition-colors hover:text-orange"
          >
            {labels.projects}
          </Link>
          <Link
            href={`/${lang}#contacto`}
            className="transition-colors hover:text-orange"
          >
            {labels.contact}
          </Link>
        </div>

        {/* 3. Selector de Idioma */}
        <div className="relative">
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-1 transition-colors focus:outline-none hover:text-orange uppercase"
          >
            <RiGlobalLine size={20} />
            <span className="text-sm font-medium">{lang}</span>
            <RiArrowDownSLine
              size={14}
              className={`transition-transform ${
                isLangOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Menú Desplegable */}
          {isLangOpen && (
            <div className="absolute right-0 mt-2 w-36 py-2 z-50 bg-surface border border-assets rounded-md">
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
