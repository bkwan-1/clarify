import { GPAProgressBar } from './GPAProgressBar';
import { roundGPA, gpaColor } from '../../lib/gpaCalculator';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';

interface GPASummaryBarProps {
  weightedGPA: number | null;
  unweightedGPA: number | null;
  actualWeightedGPA?: number | null;
  actualUnweightedGPA?: number | null;
  bestCaseGPA?: number | null;
  totalCredits: number;
  semesterCount: number;
  scenarioMode: boolean;
  onToggleScenario: () => void;
  onApplyScenario: () => void;
  onResetScenarios: () => void;
}

// ---------------------------------------------------------------------------
// Animated GPA block
// ---------------------------------------------------------------------------

function GPABlock({
  label,
  gpa,
  actualGPA,
  scenarioMode,
  large = false,
}: {
  label: string;
  gpa: number | null;
  actualGPA?: number | null;
  scenarioMode: boolean;
  large?: boolean;
}) {
  // Smooth count-up/down when GPA changes
  const animated = useAnimatedNumber(gpa, 380);
  const rounded = roundGPA(animated);
  const roundedActual = roundGPA(actualGPA ?? null);
  const delta =
    scenarioMode && rounded !== null && roundedActual !== null ? rounded - roundedActual : null;
  const changed = delta !== null && Math.abs(delta) >= 0.005;

  return (
    <div>
      <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span
          className={`${large ? 'text-[36px]' : 'text-[24px]'} font-semibold tabular-nums leading-none ${gpaColor(rounded)}`}
        >
          {rounded !== null ? rounded.toFixed(2) : '—'}
        </span>

        {scenarioMode && roundedActual !== null && changed && (
          <div className="flex flex-col leading-none gap-0.5">
            <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums">
              was {roundedActual.toFixed(2)}
            </span>
            <span
              className={`text-[11px] font-semibold tabular-nums ${
                delta! > 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'
              }`}
            >
              {delta! > 0 ? '+' : ''}{delta!.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main bar
// ---------------------------------------------------------------------------

export function GPASummaryBar({
  weightedGPA,
  unweightedGPA,
  actualWeightedGPA,
  actualUnweightedGPA,
  bestCaseGPA,
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
          <GPABlock
            label="Weighted GPA"
            gpa={weightedGPA}
            actualGPA={scenarioMode ? actualWeightedGPA : null}
            scenarioMode={scenarioMode}
            large
          />
          <GPABlock
            label="Unweighted"
            gpa={unweightedGPA}
            actualGPA={scenarioMode ? actualUnweightedGPA : null}
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
        <GPAProgressBar gpa={roundGPA(weightedGPA)} />
        <div className="mt-3" />
      </div>

      {scenarioMode && bestCaseGPA !== null && bestCaseGPA !== undefined && (
        <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
          Best case (all in-progress → A):{' '}
          <span className={`font-semibold tabular-nums ${gpaColor(roundGPA(bestCaseGPA))}`}>
            {roundGPA(bestCaseGPA)?.toFixed(2)}
          </span>{' '}
          weighted
        </p>
      )}
    </div>
  );
}
