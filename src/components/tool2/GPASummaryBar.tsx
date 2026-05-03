import { GPAProgressBar } from './GPAProgressBar';
import { roundGPA, gradeColor } from '../../lib/gpaCalculator';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';

interface GPASummaryBarProps {
  averageGrade: number | null;
  actualAverage?: number | null;
  bestCaseAverage?: number | null;
  totalCredits: number;
  semesterCount: number;
  scenarioMode: boolean;
  onToggleScenario: () => void;
  onApplyScenario: () => void;
  onResetScenarios: () => void;
}

function AverageBlock({
  averageGrade,
  actualAverage,
  scenarioMode,
}: {
  averageGrade: number | null;
  actualAverage?: number | null;
  scenarioMode: boolean;
}) {
  const animated = useAnimatedNumber(averageGrade, 380);
  const rounded = roundGPA(animated);
  const roundedActual = roundGPA(actualAverage ?? null);
  const delta =
    scenarioMode && rounded !== null && roundedActual !== null ? rounded - roundedActual : null;
  const changed = delta !== null && Math.abs(delta) >= 0.05;

  return (
    <div>
      <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
        Grade Average
      </p>
      <div className="flex items-baseline gap-2">
        <span
          className={`text-[36px] font-semibold tabular-nums leading-none ${gradeColor(rounded)}`}
        >
          {rounded !== null ? `${rounded.toFixed(1)}%` : '—'}
        </span>

        {scenarioMode && roundedActual !== null && changed && (
          <div className="flex flex-col leading-none gap-0.5">
            <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums">
              was {roundedActual.toFixed(1)}%
            </span>
            <span
              className={`text-[11px] font-semibold tabular-nums ${
                delta! > 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'
              }`}
            >
              {delta! > 0 ? '+' : ''}{delta!.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function GPASummaryBar({
  averageGrade,
  actualAverage,
  bestCaseAverage,
  totalCredits,
  semesterCount,
  scenarioMode,
  onToggleScenario,
  onApplyScenario,
  onResetScenarios,
}: GPASummaryBarProps) {
  return (
    <div className="border-b border-[var(--border)] px-5 py-4 bg-[var(--bg-surface)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-end gap-6">
          <AverageBlock
            averageGrade={averageGrade}
            actualAverage={scenarioMode ? actualAverage : null}
            scenarioMode={scenarioMode}
          />
          <div className="text-[12px] text-[var(--text-secondary)] space-y-0.5 pb-1">
            <div>
              <span className="text-[var(--text-tertiary)]">Credits: </span>
              <span className="font-medium tabular-nums">{totalCredits}</span>
            </div>
            <div>
              <span className="text-[var(--text-tertiary)]">Semesters: </span>
              <span className="font-medium tabular-nums">{semesterCount}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pb-1 self-end flex-wrap">
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
                className="px-2.5 py-1.5 rounded-[6px] text-[12px] border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-muted)] transition-colors"
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

      <div className="mt-4 hidden sm:block">
        <GPAProgressBar average={roundGPA(averageGrade)} />
        <div className="mt-3" />
      </div>

      {scenarioMode && bestCaseAverage !== null && bestCaseAverage !== undefined && (
        <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
          Best case (all in-progress → 100%):{' '}
          <span className={`font-semibold tabular-nums ${gradeColor(roundGPA(bestCaseAverage))}`}>
            {roundGPA(bestCaseAverage)?.toFixed(1)}%
          </span>
        </p>
      )}
    </div>
  );
}
