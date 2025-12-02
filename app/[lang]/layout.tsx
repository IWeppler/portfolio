import type { Metadata } from "next";
import "../globals.css";
import Footer from "@/components/Footer";
import Cursor from "@/components/ui/skiper-ui/skiper61";
import Navbar from "@/components/Navbar";
import { getDictionary } from "@/lib/get-dictionary";

export const metadata: Metadata = {
  title: "Ignacio Weppler - Portfolio",
  description: "Portfolio de Ignacio Weppler, desarrollador Web Full Stack.",
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

  return (
    <html lang={lang}>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,401,500,501,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-general bg-background text-white">
        <Navbar lang={lang} labels={t.navbar} />
        <Cursor />
        {children}
        <Footer lang={lang} />
      </body>
    </html>
  );
}
