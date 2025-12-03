import "../globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Cursor from "@/components/ui/skiper-ui/skiper61";
import { getDictionary } from "@/lib/get-dictionary";
import StructuredData from "@/components/StructuredData";

export const metadata = {
  title: "Ignacio Weppler",
  description: "Ignacio Weppler, desarrollador Web Full Stack.",
};

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
   params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = getDictionary(lang);

  const base = "https://ignacioweppler.com";

  return (
    <html lang={lang}>
      <head>
        {/* Fuente */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,401,500,501,600,700&display=swap"
          rel="stylesheet"
        />

        {/* Canonical general para cada idioma */}
        <link rel="canonical" href={`${base}/${lang}`} />

        {/* HREFLANG (muy importante!) */}
        <link rel="alternate" href={`${base}/es`} hrefLang="es" />
        <link rel="alternate" href={`${base}/en`} hrefLang="en" />
        <link rel="alternate" href={`${base}/pt`} hrefLang="pt" />
        <link rel="alternate" href={base} hrefLang="x-default" />
      </head>

      <body className="font-general bg-background text-white">
        <StructuredData />
        <Navbar lang={lang} labels={t.navbar} />
        <Cursor />
        {children}
        <Footer lang={lang} />
      </body>
    </html>
  );
}
