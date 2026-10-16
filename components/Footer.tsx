import Link from "next/link";
import { getDictionary } from "@/lib/get-dictionary";
import { LocalTime } from "./ui/LocalTime";
import { TextPressure } from "./ui/TextPressure";

const SOCIALS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/ignacioweppler/" },
  { label: "GitHub", href: "https://github.com/IWeppler" },
  { label: "Instagram", href: "https://www.instagram.com/ignacioweppler/" },
];

const EMAIL = "ignacionweppler@gmail.com";

// Queda disponible, pero chico: el contacto principal es el email.
const WHATSAPP_URL =
  "https://wa.me/5491154702118?text=Hola%20Ignacio,%20vengo%20de%20tu%20portfolio%20y%20me%20gustar%C3%ADa%20hablar%20sobre%20un%20proyecto.";

/**
 * Cierre de todas las paginas: la invitacion a hablar en grande (abre el
 * email) y una sola fila con los datos de contacto.
 */
export default function Footer({ lang }: { lang: string }) {
  const t = getDictionary(lang);

  return (
    <footer id="contacto" className="w-full bg-background px-4 pt-24 pb-8 text-foreground md:px-8 md:pt-40 md:pb-10">
      <p className="label text-paragraph">{t.footer.cta_label}</p>

      {/* Mismo efecto que el nombre del hero: las letras reaccionan al cursor.
          El link lleva el nombre accesible; las letras son solo visuales. */}
      <a
        href={`mailto:${EMAIL}`}
        aria-label={t.footer.cta}
        className="mt-6 block w-full transition-colors duration-200 select-none hover:text-orange focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-orange"
      >
        <TextPressure as="div" entrance={false} lines={[{ text: t.footer.cta }]} lineClassName="w-full" />
      </a>

      <div className="label mt-20 grid grid-cols-2 gap-x-6 gap-y-6 text-paragraph md:mt-28 lg:grid-cols-[auto_1fr_auto_auto] lg:items-center lg:gap-x-16">
        <a href={`mailto:${EMAIL}`} className="col-span-2 w-fit max-w-full break-all text-foreground transition-colors hover:text-orange lg:col-span-1">
          {EMAIL}
        </a>

        <div className="col-span-2 flex flex-wrap gap-x-6 gap-y-2 lg:col-span-1 lg:justify-center">
          {SOCIALS.map((social) => (
            <a key={social.label} href={social.href} target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">
              {social.label}
            </a>
          ))}
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">
            WhatsApp
          </a>
        </div>

        <p className="col-span-2 lg:col-span-1">
          {t.hero.location} <LocalTime />
        </p>

        <Link href={`/${lang}`} className="col-span-2 w-fit transition-colors hover:text-foreground lg:col-span-1 lg:justify-self-end">
          {t.footer.back_to_top} ↑
        </Link>
      </div>

      <p className="label mt-10 text-paragraph/60">
        © {new Date().getFullYear()} {t.footer.rights}
      </p>
    </footer>
  );
}
