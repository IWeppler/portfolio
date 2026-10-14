"use client";

import { cn } from "@/lib/utils";

interface OptionCardProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  size?: "lg" | "sm";
}

export function OptionCard({ label, selected, onClick, size = "lg" }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full cursor-pointer items-center justify-between gap-4 rounded-2xl text-left font-medium",
        "transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.98]",
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange",
        selected
          ? "bg-orange text-dark"
          : "bg-surface text-foreground hover:bg-foreground/[0.1]",
        size === "lg"
          ? "p-5 text-lg md:p-6 md:text-xl"
          : "p-4 text-sm md:text-base"
      )}
    >
      {label}
      {size === "lg" && <span aria-hidden="true">→</span>}
    </button>
  );
}

