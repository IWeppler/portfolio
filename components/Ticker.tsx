import { getDictionary } from "@/lib/get-dictionary";

/**
 * Franja que se desplaza sola con lo que hago. La lista va dos veces seguidas
 * y la animacion corre la mitad del ancho, asi el loop no tiene costura.
 */
export function Ticker({ lang }: { lang: string }) {
  const { hero } = getDictionary(lang);
  const items = hero.ticker as string[];

  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((item) => (
        <li key={item} className="flex items-center whitespace-nowrap">
          <span className="px-8 md:px-12">{item}</span>
          <span aria-hidden="true" className="size-2.5 rotate-45 bg-orange md:size-3" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="-mx-4 w-[calc(100%+2rem)] overflow-hidden bg-surface py-6 md:-mx-8 md:w-[calc(100%+4rem)] md:py-8">
      <div className="marquee-track flex w-max text-[clamp(2.25rem,5vw,4.5rem)] font-medium leading-none tracking-[-0.035em] text-foreground">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
