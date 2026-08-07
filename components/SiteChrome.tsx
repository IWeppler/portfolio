"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Cursor from "@/components/ui/skiper-ui/skiper61";

type SiteChromeProps = {
  lang: string;
  labels: {
    home: string;
    projects: string;
    contact: string;
  };
  children: React.ReactNode;
};

export function SiteChrome({ lang, labels, children }: SiteChromeProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.includes("/dashboard");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar lang={lang} labels={labels} />
      <Cursor />
      {children}
      <Footer lang={lang} />
    </>
  );
}
