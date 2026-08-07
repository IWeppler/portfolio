import "../globals.css";
import { SiteChrome } from "@/components/SiteChrome";
import SmoothScroll from "@/components/SmoothScroll";
import { getDictionary } from "@/lib/get-dictionary";
import StructuredData from "@/components/StructuredData";
import { ContactModalProvider } from "@/components/contact-modal/ContactModalProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Familjen_Grotesk } from "next/font/google";


const familjenGrotesk = Familjen_Grotesk({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-familjen",
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

  const base = "https://ignacioweppler.com";

  return (
    <html lang={lang} className={familjenGrotesk.variable}>
      <head>
        <link rel="canonical" href={`${base}/${lang}`} />
        <link rel="alternate" href={`${base}/es`} hrefLang="es" />
        <link rel="alternate" href={`${base}/en`} hrefLang="en" />
        <link rel="alternate" href={`${base}/pt`} hrefLang="pt" />
        <link rel="alternate" href={base} hrefLang="x-default" />
      </head>

      <body className="font-general bg-background text-foreground">
        <SmoothScroll />
        <StructuredData />
        <Analytics />
        <SpeedInsights />
        <GoogleAnalytics
          gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || ""}
        />
        <ContactModalProvider lang={lang}>
          <SiteChrome lang={lang} labels={t.navbar}>
            {children}
          </SiteChrome>
        </ContactModalProvider>
      </body>
    </html>
  );
}
