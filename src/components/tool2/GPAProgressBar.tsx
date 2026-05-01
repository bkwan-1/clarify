interface GPAProgressBarProps {
  gpa: number | null;
  min?: number;
  max?: number;
}

export function GPAProgressBar({ gpa, min = 0, max = 4.0 }: GPAProgressBarProps) {
  const pct = gpa !== null ? Math.max(0, Math.min(100, ((gpa - min) / (max - min)) * 100)) : 0;

  const ticks = [2.0, 2.5, 3.0, 3.5, 4.0];

  return (
    <div className="relative h-3">
      {/* Track */}
      <div className="absolute inset-0 rounded-full bg-[var(--bg-raised)] overflow-hidden">
        {gpa !== null && (
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>

      {/* Tick marks */}
      {ticks.map((tick) => {
        const tickPct = ((tick - min) / (max - min)) * 100;
        return (
          <div
            key={tick}
            className="absolute top-0 bottom-0 flex items-end pointer-events-none"
            style={{ left: `${tickPct}%` }}
          >
            <span className="absolute bottom-[-14px] text-[9px] text-[var(--text-tertiary)] -translate-x-1/2">
              {tick.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
