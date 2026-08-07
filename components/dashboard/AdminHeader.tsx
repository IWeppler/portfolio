"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, LogOut, User } from "lucide-react";
import { signOut } from "@/app/actions/auth";

type AdminHeaderProps = {
  lang: string;
  userEmail?: string | null;
};

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Proyectos",
  leads: "Leads",
  analytics: "Analíticas",
};

export function AdminHeader({ lang, userEmail }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const dashboardBasePath = `/${lang}/dashboard`;
  const segments = (pathname ?? "")
    .replace(dashboardBasePath, "")
    .split("/")
    .filter(Boolean);

  const crumbs = ["Dashboard", ...segments.map((s) => LABELS[s] ?? s)];
  const initial = (userEmail ?? "A").charAt(0).toUpperCase();

  async function handleLogout() {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push(`/${lang}/panel-acceso`);
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-background/80 px-4 backdrop-blur-md md:px-8 lg:px-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
        {crumbs.map((crumb, index) => (
          <span key={`${crumb}-${index}`} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-paragraph" />}
            <span
              className={
                index === crumbs.length - 1
                  ? "font-medium text-foreground"
                  : "text-paragraph"
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-orange text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {initial}
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-md border border-white/10 bg-surface py-2 shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 pb-3">
              <User className="h-4 w-4 text-paragraph" />
              <span className="truncate text-sm text-paragraph">
                {userEmail ?? "Admin"}
              </span>
            </div>
            <Link
              href={`/${lang}`}
              className="block px-4 py-2 text-sm text-paragraph transition-colors hover:bg-white/[0.05] hover:text-foreground"
            >
              Ver sitio público
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isSigningOut}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-paragraph transition-colors hover:bg-white/[0.05] hover:text-foreground disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {isSigningOut ? "Cerrando sesión" : "Cerrar sesión"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
