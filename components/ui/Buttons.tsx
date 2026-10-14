import Link from "next/link";
import { MouseEventHandler, ReactNode } from "react";
import { FancyNavLink } from "./FancyNavLink";

interface ButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
  target?: string;
  onClick?: MouseEventHandler;
}

// --- 1. Botón Principal ---
export function ButtonPrimary({
  href,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <Link
      href={href}
      className={`
        inline-flex items-center justify-center
        whitespace-nowrap
        rounded-full bg-orange px-6 py-3.5 md:px-8
        text-base md:text-lg font-medium text-dark
        transition-[transform,background-color] duration-150 ease-out
        hover:bg-[color-mix(in_srgb,var(--swiss-orange)_88%,white)]
        active:scale-[0.97]
        focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange
        ${className}
      `}
      {...props}
    >
      {children}
    </Link>
  );
}

// --- 2. Botón Secundario ---
export function ButtonSecondary({
  href,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <FancyNavLink
      href={href}
      className={`
        inline-flex items-center
        whitespace-nowrap
        text-foreground font-medium text-base md:text-lg
        py-3 px-1
        transition-colors duration-200
        hover:text-paragraph
        ${className}
      `}
      {...props}
    >
      {children}
    </FancyNavLink>
  );
}
