interface ProgressIndicatorProps {
  step: number;
  total: number;
  label: string;
}

export function ProgressIndicator({ step, total, label }: ProgressIndicatorProps) {
  return (
    <div className="mb-10">
      <p className="label mb-3 text-paragraph">{label}</p>
      <div className="h-1 w-full overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-orange transition-[width] duration-300 ease-out"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
