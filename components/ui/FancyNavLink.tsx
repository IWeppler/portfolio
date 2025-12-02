import { cn } from "@/lib/utils";
import Link from "next/link";

export function FancyNavLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-block items-center no-underline",
        "before:pointer-events-none before:absolute before:left-0 before:top-12",
        "before:h-[0.05em] before:w-full before:bg-current before:content-['']",
        "before:origin-right before:scale-x-0 before:transition-transform before:duration-300 before:ease-in-out",
        "hover:before:origin-left hover:before:scale-x-100",
        className
      )}
    >
      <span className="flex items-center">
        {children}{" "}
        <svg
          className="ml-[0.3em] size-[0.55em] translate-y-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none"
          fill="none"
          viewBox="0 0 10 10"
          aria-hidden="true"
        >
          <path
            d="M1.004 9.166 9.337.833m0 0v8.333m0-8.333H1.004"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}
