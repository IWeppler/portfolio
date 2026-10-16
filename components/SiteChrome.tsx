"use client";

import { ViewTransition } from "react";
import { usePathname } from "next/navigation";
import { BackForwardTransition } from "@/components/BackForwardTransition";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

type SiteChromeProps = {
  lang: string;
  labels: {
    home: string;
    projects: string;
    contact: string;
    about: string;
    start: string;
    location: string;
  };
  children: React.ReactNode;
};

export function SiteChrome({ lang, labels, children }: SiteChromeProps) {
  const pathname = usePathname();
  // El dashboard y la landing de inmobiliarias van sin navbar ni footer.
  const bare = pathname?.includes("/dashboard") || pathname?.includes("/inmobiliarias");

  if (bare) {
    return <>{children}</>;
  }

  // Navbar y footer quedan quietos; solo el contenido hace la transicion.
  return (
    <>
      <Navbar lang={lang} labels={labels} />
      <BackForwardTransition />
      <ViewTransition default="page">
        <div>{children}</div>
      </ViewTransition>
      <Footer lang={lang} />
    </>
  );
}
