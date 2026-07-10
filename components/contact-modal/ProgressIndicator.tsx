interface ProgressIndicatorProps {
  step: number;
  total: number;
  label: string;
}

export function ProgressIndicator({ step, total, label }: ProgressIndicatorProps) {
  return (
    <div className="mb-4">
      <p className="text-xs text-paragraph mb-2">{label}</p>
      <div className="h-1 w-full rounded-full bg-assets overflow-hidden">
        <div
          className="h-full bg-orange transition-all duration-300"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
