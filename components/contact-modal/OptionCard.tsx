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
        "w-full text-left rounded-xl border transition-colors cursor-pointer",
        "border-assets bg-surface hover:border-orange/60 hover:bg-white/5",
        selected && "border-orange bg-orange/10 text-orange",
        size === "lg"
          ? "p-5 md:p-6 text-base md:text-lg font-medium"
          : "p-4 text-sm md:text-base font-medium"
      )}
    >
      {label}
    </button>
  );
}
