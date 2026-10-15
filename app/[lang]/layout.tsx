import "../globals.css";
import { SiteChrome } from "@/components/SiteChrome";
import SmoothScroll from "@/components/SmoothScroll";
import { getDictionary } from "@/lib/get-dictionary";
import StructuredData from "@/components/StructuredData";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Geist, Geist_Mono, Roboto_Flex } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

// Solo para el nombre del hero (TextPressure): necesita ejes de ancho e
// inclinacion, que Geist no tiene.
const robotoFlex = Roboto_Flex({
  subsets: ["latin"],
  display: "swap",
  axes: ["wdth", "slnt"],
  variable: "--font-roboto-flex",
});

// Solo para las etiquetas chicas (ubicacion, hora, "(Hola)", indices).
const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export const metadata = {
  title: "Ignacio Weppler",
  descriptPion: "Ignacio Weppler, desarrollador Web Full Stack.",
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

  const base = "https://ignacioweppler.dev";

  return (
    <html
      lang={lang}
      className={`${geist.variable} ${geistMono.variable} ${robotoFlex.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="canonical" href={`${base}/${lang}`} />
        <link rel="alternate" href={`${base}/es`} hrefLang="es" />
        <link rel="alternate" href={`${base}/en`} hrefLang="en" />
        <link rel="alternate" href={`${base}/pt`} hrefLang="pt" />
        <link rel="alternate" href={base} hrefLang="x-default" />
        {/* Marca que hay JS antes del primer pintado: las entradas al scrollear
            (`[data-reveal]`) solo ocultan contenido cuando esto corrio. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
      </head>

      <body className="font-general bg-background text-foreground">
        <SmoothScroll />
        <StructuredData />
        <Analytics />
        <SpeedInsights />
        <GoogleAnalytics
          gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || ""}
        />
        <SiteChrome lang={lang} labels={t.navbar}>
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
