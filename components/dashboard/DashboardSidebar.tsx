"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FolderKanban,
  ImageIcon,
  LayoutDashboard,
  Mail,
  PanelLeft,
} from "lucide-react";
import { LogoutButton } from "@/components/dashboard/LogoutButton";

type DashboardSidebarProps = {
  lang: string;
};

const navigationItems = [
  {
    label: "Dashboard",
    href: "",
    icon: LayoutDashboard,
  },
  {
    label: "Proyectos",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    label: "Leads",
    href: "/leads",
    icon: Mail,
  },
  {
    label: "Content",
    href: "/content",
    icon: ImageIcon,
  },
  {
    label: "Analíticas",
    href: "/analytics",
    icon: BarChart3,
  },
];

export function DashboardSidebar({ lang }: DashboardSidebarProps) {
  const pathname = usePathname();
  const dashboardBasePath = `/${lang}/dashboard`;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-[#090f12] lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-foreground">
            Portfolio
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2 px-4 py-6">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const href = `${dashboardBasePath}${item.href}`;
          const isActive =
            item.href === ""
              ? pathname === dashboardBasePath
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={item.label}
              href={href}
              className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-orange text-white"
                  : "text-paragraph hover:bg-white/[0.05] hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <LogoutButton lang={lang} />
      </div>
    </aside>
  );
}
