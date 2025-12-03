import Link from "next/link";
import { ReactNode } from "react";
import { FancyNavLink } from "./FancyNavLink";

interface ButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
  target?: string;
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
        border border-white/25 px-6 py-3.5 md:px-10 rounded-full
        text-base md:text-lg font-medium text-foreground
        hover:border-foreground hover:bg-white/5 transition-all
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
        text-cream font-medium text-base md:text-lg
        py-3 px-4 md:px-1
        transition-colors duration-300
        hover:text-foreground 
        ${className}
      `}
      {...props}
    >
      {children}
    </FancyNavLink>
  );
}
