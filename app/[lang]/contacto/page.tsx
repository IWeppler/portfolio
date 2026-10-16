import { ContactFlow } from "@/components/contact-modal/ContactFlow";
import { getDictionary } from "@/lib/get-dictionary";
import { alternatesFor, ogBase, seoCopy } from "@/lib/seo";

export async function generateStaticParams() {
  return [{ lang: "es" }, { lang: "en" }, { lang: "pt" }];
}

interface Props {
  params: Promise<{ lang: "es" | "en" | "pt" }>;
}

export async function generateMetadata({ params }: Props) {
  const { lang } = await params;
  const title = getDictionary(lang).navbar.start;
  const description = seoCopy(lang).contact;
  return {
    title,
    description,
    alternates: alternatesFor(lang, "/contacto"),
    openGraph: { ...ogBase(lang), url: `/${lang}/contacto`, title, description },
  };
}

export default async function ContactPage({ params }: Props) {
  const { lang } = await params;
  const t = getDictionary(lang);
  const year = new Date().getFullYear();

  return (
    <main className="min-h-[100svh] w-full bg-background px-4 pt-24 pb-24 text-foreground md:px-8 md:pt-28">
      {/* Misma fila de datos que el hero. */}
      <div className="hero-rise grid grid-cols-2 gap-y-2 text-paragraph md:grid-cols-3">
        <p className="label">
          ({t.navbar.start} / ©{year})
        </p>
        <p className="label text-right md:text-center">{t.hero.role}</p>
        <p className="label hidden text-right md:block">{t.hero.location}</p>
      </div>

      <div className="mt-16 grid gap-16 lg:mt-24 lg:grid-cols-[1fr_minmax(0,36rem)] lg:gap-24">
        <h1 className="hero-rise text-title font-medium text-balance [animation-delay:100ms] lg:sticky lg:top-32 lg:self-start">
          {t.navbar.start}
        </h1>

        <div className="hero-rise [animation-delay:200ms]">
          <ContactFlow lang={lang} />
        </div>
      </div>
    </main>
  );
}
