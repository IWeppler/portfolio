import Link from "next/link";
import { ButtonSecondary } from "./ui/Buttons";
import { getDictionary } from "@/lib/get-dictionary";

export default function Footer({ lang }: { lang: string }) {
  const t = getDictionary(lang);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-surface text-foreground px-6 md:px-20 pt-24 pb-10 border-t border-foreground/10">
      {/* TÍTULO */}
      <div className="flex justify-between items-start md:items-center mb-16">
        <h2 className="text-4xl md:text-6xl font-medium text-foreground uppercase tracking-tight">
          {t.footer.title}
        </h2>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-24">
        {/* Columna izquierda: contacto directo */}
        <div className="space-y-12">
          <div>
            <p className="text-sm uppercase tracking-wide text-paragraph mb-2">
              {t.footer.email_label}
            </p>
            <ButtonSecondary href="mailto:ignacionweppler@gmail.com">
              ignacionweppler@gmail.com
            </ButtonSecondary>
          </div>

          <div>
            <p className="text-sm uppercase tracking-wide text-paragraph mb-2">
              {t.footer.phone_label}
            </p>
            <ButtonSecondary href="tel:+541154702118">
              +54 11 5470 2118
            </ButtonSecondary>
          </div>
        </div>

        {/* Columna derecha: navegación */}
        <div className="flex flex-col space-y-4 text-3xl md:text-4xl font-light">
          <Link href={`/${lang}/projects`} className="hover:text-paragraph transition-colors duration-150">
            {t.footer.links.projects}
          </Link>
          {/* Si tienes página de servicios: */}
          <Link href={`/${lang}/#servicios`} className="hover:text-paragraph transition-colors duration-150">
            {t.footer.links.services}
          </Link>
          <Link href={`/${lang}/about`} className="hover:text-paragraph transition-colors duration-150">
            {t.footer.links.about}
          </Link>
          <Link href={`/${lang}#contacto`} className="hover:text-paragraph transition-colors duration-150">
            {t.footer.links.contact}
          </Link>
        </div>
      </div>

      {/* Línea inferior */}
      <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center text-paragraph text-sm">
        <p className="mb-4 md:mb-0">
          © {currentYear} {t.footer.rights}
        </p>

        {/* Redes sociales  */}
        <div className="flex items-center gap-6 text-sm">
          <ButtonSecondary
            href="https://www.instagram.com/ignacioweppler/"
            target="_blank"
            className="flex text-paragraph text-sm items-center gap-1 hover:text-foreground transition-colors"
          >
            Instagram
          </ButtonSecondary>

          <ButtonSecondary
            href="https://github.com/IWeppler"
            target="_blank"
            className="flex text-paragraph text-sm items-center gap-1 hover:text-foreground transition-colors"
          >
            GitHub
          </ButtonSecondary>

          <ButtonSecondary
            href="https://www.linkedin.com/in/ignacioweppler/"
            target="_blank"
            className="flex text-paragraph text-sm items-center gap-1 hover:text-foreground transition-colors"
          >
            LinkedIn
          </ButtonSecondary>
        </div>
      </div>
    </footer>
  );
}
