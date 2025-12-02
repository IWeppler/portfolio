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
        border border-white/25 px-10 py-3.5 rounded-full
        text-base md:text-lg font-light text-white
        hover:border-white hover:bg-white/5 transition-all
        ${className}
      `}
      {...props}
    >
      {children}
    </Link>
  );
}

// --- 2. Botón Secundario  ---
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
        text-cream font-medium text-xl
        py-3 px-1
        transition-colors duration-300
        hover:text-white 
        ${className}
      `}
      {...props}
    >
      {children}
    </FancyNavLink>
  );
}
