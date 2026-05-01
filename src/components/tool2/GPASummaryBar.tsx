import { useState } from 'react';
import { GPAProgressBar } from './GPAProgressBar';
import { roundGPA, gpaColor } from '../../lib/gpaCalculator';

interface GPASummaryBarProps {
  weightedGPA: number | null;
  unweightedGPA: number | null;
  projectedWeightedGPA?: number | null;
  projectedUnweightedGPA?: number | null;
  totalCredits: number;
  semesterCount: number;
  scenarioMode: boolean;
  onToggleScenario: () => void;
  onApplyScenario: () => void;
  onResetScenarios: () => void;
}

export function GPASummaryBar({
  weightedGPA,
  unweightedGPA,
  projectedWeightedGPA,
  projectedUnweightedGPA,
  totalCredits,
  semesterCount,
  scenarioMode,
  onToggleScenario,
  onApplyScenario,
  onResetScenarios,
}: GPASummaryBarProps) {
  const [primary, setPrimary] = useState<'weighted' | 'unweighted'>('weighted');

  const displayGPA = roundGPA(primary === 'weighted' ? weightedGPA : unweightedGPA);
  const altGPA = roundGPA(primary === 'weighted' ? unweightedGPA : weightedGPA);
  const projGPA = roundGPA(
    primary === 'weighted' ? (projectedWeightedGPA ?? weightedGPA) : (projectedUnweightedGPA ?? unweightedGPA),
  );

  const delta = scenarioMode && projGPA !== null && displayGPA !== null ? projGPA - displayGPA : null;

  return (
    <div className="border-b border-[var(--border)] px-5 py-4 bg-[var(--bg-surface)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* GPA numbers */}
        <div className="flex items-end gap-5">
          <div>
            <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              Cumulative GPA
            </p>
            <div className="flex items-baseline gap-2">
              <span className={`text-[36px] font-semibold tabular-nums leading-none ${gpaColor(displayGPA)}`}>
                {displayGPA !== null ? displayGPA.toFixed(2) : '—'}
              </span>

              {scenarioMode && projGPA !== null && projGPA !== displayGPA && (
                <div className="flex flex-col">
                  <span className={`text-[13px] font-medium tabular-nums ${gpaColor(projGPA)}`}>
                    → {projGPA.toFixed(2)}
                  </span>
                  {delta !== null && (
                    <span className={`text-[11px] font-medium ${delta >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                      {delta >= 0 ? '+' : ''}{delta.toFixed(2)}
                    </span>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setPrimary((p) => (p === 'weighted' ? 'unweighted' : 'weighted'))}
                className="flex flex-col gap-0.5 cursor-pointer group"
                title="Switch between weighted and unweighted"
              >
                <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-[4px] ${primary === 'weighted' ? 'text-[var(--accent)] bg-[var(--accent-muted)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}>
                  W
                </span>
                <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-[4px] ${primary === 'unweighted' ? 'text-[var(--accent)] bg-[var(--accent-muted)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}>
                  U
                </span>
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
              {primary === 'weighted' ? 'Weighted' : 'Unweighted'} · Alt:{' '}
              <span className="tabular-nums">{altGPA !== null ? altGPA.toFixed(2) : '—'}</span>
            </p>
          </div>

          <div className="text-[12px] text-[var(--text-secondary)] space-y-0.5 pb-1">
            <div><span className="text-[var(--text-tertiary)]">Credits:</span> <span className="font-medium tabular-nums">{totalCredits}</span></div>
            <div><span className="text-[var(--text-tertiary)]">Semesters:</span> <span className="font-medium tabular-nums">{semesterCount}</span></div>
          </div>
        </div>

        {/* Scenario controls */}
        <div className="flex items-center gap-2 pb-1 self-end">
          {scenarioMode && (
            <>
              <button
                type="button"
                onClick={onResetScenarios}
                className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={onApplyScenario}
                className="text-[12px] px-2.5 py-1 rounded-[6px] border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-muted)] transition-colors"
              >
                Apply as actual
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onToggleScenario}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors ${
              scenarioMode
                ? 'bg-[var(--accent)] text-white'
                : 'border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${scenarioMode ? 'bg-white' : 'bg-[var(--text-tertiary)]'}`} />
            Scenario {scenarioMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 hidden sm:block">
        <GPAProgressBar gpa={displayGPA} />
        <div className="mt-3" /> {/* spacing for tick labels */}
      </div>
    </div>
  );
}
