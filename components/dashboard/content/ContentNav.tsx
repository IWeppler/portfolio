"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BRAND_IDS, BRAND_KITS, type BrandId } from "@/lib/content/kits";

type ContentNavProps = {
  lang: string;
  brand: BrandId;
  section: "posts" | "library";
};

// Piezas / Biblioteca y la marca activa; la marca viaja en ?brand=.
export function ContentNav({ lang, brand, section }: ContentNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const base = `/${lang}/dashboard/content`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <nav className="flex w-fit gap-1 rounded-md bg-surface p-1" aria-label="Sección">
        {(
          [
            ["posts", "Piezas", base],
            ["library", "Biblioteca", `${base}/library`],
          ] as const
        ).map(([key, label, href]) => (
          <Link
            key={key}
            href={`${href}?brand=${brand}`}
            aria-current={section === key ? "page" : undefined}
            className={`flex h-9 items-center rounded px-4 text-sm font-medium transition-colors ${
              section === key ? "bg-white/[0.08] text-foreground" : "text-paragraph hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="flex w-fit gap-1 rounded-md bg-surface p-1" role="tablist" aria-label="Marca">
        {BRAND_IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={brand === id}
            onClick={() => router.replace(`${pathname}?brand=${id}`, { scroll: false })}
            className={`h-9 rounded px-4 text-sm font-medium transition-colors ${
              brand === id ? "bg-orange text-dark" : "text-paragraph hover:text-foreground"
            }`}
          >
            {BRAND_KITS[id].name}
          </button>
        ))}
      </div>
    </div>
  );
}
