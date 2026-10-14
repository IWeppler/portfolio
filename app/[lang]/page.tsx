import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import { ParallaxHero } from "@/components/ParallaxHero";
import { About } from "@/components/About";
import { Ticker } from "@/components/Ticker";
import { UpClose } from "@/components/UpClose";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return [{ lang: "es" }, { lang: "en" }, { lang: "pt" }];
}

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { lang } = await params;

  return {
    alternates: {
      canonical: `https://ignacioweppler.com/${lang}`,
    },
  };
}

export default async function LangHome({ params }: Props) {
  const { lang } = await params;

  const validLangs = ["es", "en", "pt"];
  if (!validLangs.includes(lang)) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col px-4 md:px-8">
      <PageViewTracker />

      {/* El hero queda pegado solo mientras pasa la lista de proyectos: el
          `sticky` se suelta cuando termina este contenedor, asi no queda
          escondido detras del resto de la pagina. */}
      <div className="relative">
        <ParallaxHero>
          <Hero lang={lang} />
        </ParallaxHero>

        {/* Capa opaca por encima del hero: lo tapa al scrollear y el hero fijo
            no come clicks despues. */}
        <div className="relative z-10 bg-background">
          <Ticker lang={lang} />
          <Projects lang={lang} />
        </div>
      </div>

      {/* El cierre ("Hablemos" y contacto) es el footer, comun a todo el sitio. */}
      <div className="relative z-10 bg-background">
        <UpClose lang={lang} />
        <About lang={lang} />
      </div>
    </div>
  );
}
