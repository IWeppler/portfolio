import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import { ParallaxHero } from "@/components/ParallaxHero";
import Features from "@/components/Features";
import { About } from "@/components/About";
import { Cta } from "@/components/Cta";
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
    <div className="flex flex-col min-h-screen items-center justify-center px-4 md:px-20">
      <PageViewTracker />
      <ParallaxHero>
        <Hero lang={lang} />
      </ParallaxHero>

      {/* Todo lo que sigue al hero viaja en una capa opaca por encima de el:
          asi lo tapa al scrollear y el hero fijo no come clicks despues. */}
      {/* Los margenes negativos cancelan el padding de la pagina para que el
          borde llegue de punta a punta, y el padding propio devuelve la sangria
          al contenido. */}
      <div className="relative z-10 -mx-4 md:-mx-20 w-[calc(100%+2rem)] md:w-[calc(100%+10rem)] px-4 md:px-20 bg-background border-t border-assets/50">
        <Projects lang={lang} />
        <About lang={lang} />
        <Features lang={lang} />
        <Cta lang={lang} />
      </div>
    </div>
  );
}
