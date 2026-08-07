import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel?: string;
};

export function StatCard({ icon: Icon, label, value, sublabel }: StatCardProps) {
  return (
    <div className="rounded-lg border border-assets bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-paragraph">{label}</span>
        <Icon className="h-4 w-4 text-swiss-blue" />
      </div>
      <p className="text-3xl font-medium tracking-tight text-foreground">{value}</p>
      {sublabel && <p className="mt-1 truncate text-xs text-paragraph">{sublabel}</p>}
    </div>
  );
}
