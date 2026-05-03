import { gradeColor } from '../../lib/gpaCalculator';

interface GPAProgressBarProps {
  average: number | null;
}

export function GPAProgressBar({ average }: GPAProgressBarProps) {
  const pct = average !== null ? Math.max(0, Math.min(100, average)) : 0;
  const ticks = [50, 60, 70, 80, 90, 100];

  const fillColor =
    average === null
      ? ''
      : average >= 90
      ? 'bg-[var(--success)]'
      : average >= 80
      ? 'bg-[var(--accent)]'
      : average >= 70
      ? 'bg-[var(--warning)]'
      : 'bg-[var(--danger)]';

  return (
    <div className="relative h-3">
      {/* Track */}
      <div className="absolute inset-0 rounded-full bg-[var(--bg-raised)] overflow-hidden">
        {average !== null && (
          <div
            className={`h-full rounded-full transition-all duration-500 ${fillColor}`}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>

      {/* Tick marks */}
      {ticks.map((tick) => (
        <div
          key={tick}
          className="absolute top-0 bottom-0 flex items-end pointer-events-none"
          style={{ left: `${tick}%` }}
        >
          <span className="absolute bottom-[-14px] text-[9px] text-[var(--text-tertiary)] -translate-x-1/2">
            {tick}%
          </span>
        </div>
      ))}
    </div>
  );
}

// Keep old export name for compatibility
export { gradeColor };
