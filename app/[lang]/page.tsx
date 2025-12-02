import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import Features from "@/components/Features";
import { About } from "@/components/About";
import { Cta } from "@/components/Cta";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return [
    { lang: "es" },
    { lang: "en" },
    { lang: "pt" },
  ];
}

interface Props {
  params: Promise<{
    lang: string;
  }>;
}

export default async function LangHome({ params }: Props) {
  
  const { lang } = await params;

  const validLangs = ["es", "en", "pt"];
  if (!validLangs.includes(lang)) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-4 md:px-20">
      <Hero lang={lang} />
      <Projects lang={lang} />
      <About lang={lang} />
      <Features lang={lang} />
      <Cta lang={lang} />
    </div>
  );
}