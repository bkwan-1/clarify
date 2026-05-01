import { useState } from 'react';
import type { GradeRecoveryResult } from '../../models/gradeRecovery';
import type { GradeRecoveryClass, LetterGrade } from '../../models/gradeRecovery';
import type { ActiveTool } from '../shell/TopNav';

interface ResultsPanelProps {
  cls: GradeRecoveryClass;
  result: GradeRecoveryResult | null;
  onToggleTarget: (t: LetterGrade) => void;
  onSendToGPA: () => void;
  onSwitchTool: (tool: ActiveTool) => void;
  onAddCustomTarget: (pct: number) => void;
  onRemoveCustomTarget: (pct: number) => void;
}

const TARGETS: LetterGrade[] = ['A', 'B', 'C', 'D'];

const TARGET_STYLES: Record<string, string> = {
  A: 'border-[var(--success)] bg-[var(--success-muted)] text-[var(--success)]',
  B: 'border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]',
  C: 'border-[var(--warning)] bg-[var(--warning-muted)] text-[var(--warning)]',
  D: 'border-[var(--border)] bg-[var(--bg-raised)] text-[var(--text-secondary)]',
};

export function ResultsPanel({ cls, result, onToggleTarget, onSendToGPA, onSwitchTool, onAddCustomTarget, onRemoveCustomTarget }: ResultsPanelProps) {
  const [customInput, setCustomInput] = useState('');

  if (!result) {
    return (
      <aside className="w-[280px] shrink-0 border-l border-[var(--border)] p-4 flex items-center justify-center">
        <p className="text-[12px] text-[var(--text-tertiary)] text-center">
          Add grades to see what you need.
        </p>
      </aside>
    );
  }

  const currentPct = result.currentGradePercentage;
  const currentLetter = result.currentLetterGrade;

  const pctColor =
    currentPct >= 90
      ? 'text-[var(--success)]'
      : currentPct >= 80
      ? 'text-[var(--accent)]'
      : currentPct >= 70
      ? 'text-[var(--warning)]'
      : 'text-[var(--danger)]';

  function handleAddCustom() {
    const val = parseFloat(customInput);
    if (isNaN(val) || val < 0 || val > 110) return;
    onAddCustomTarget(Math.round(val * 10) / 10);
    setCustomInput('');
  }

  return (
    <aside className="w-[280px] shrink-0 border-l border-[var(--border)] flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-[var(--border)]">
        <p className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
          What You Need
        </p>
        <div className="flex items-baseline gap-2 mb-1">
          <span className={`text-[24px] font-semibold tabular-nums ${pctColor}`}>
            {currentPct.toFixed(1)}%
          </span>
          <span className={`text-[14px] font-medium ${pctColor}`}>{currentLetter}</span>
        </div>
        <p className="text-[11px] text-[var(--text-tertiary)]">Current grade</p>
      </div>

      {/* Scenario toggles */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <p className="text-[11px] text-[var(--text-tertiary)] mb-2">Show targets:</p>
        <div className="flex gap-1.5 flex-wrap">
          {TARGETS.map((t) => {
            const active = cls.activeTargets.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => onToggleTarget(t)}
                className={`px-2.5 py-1 rounded-[6px] text-[12px] font-medium border transition-all ${
                  active
                    ? TARGET_STYLES[t]
                    : 'border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--border)]'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Custom target input */}
        <div className="flex items-center gap-1.5 mt-2">
          <input
            type="number"
            min={0}
            max={110}
            step={0.1}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
            placeholder="Custom %"
            className="flex-1 min-w-0 px-2 py-1 rounded-[6px] border border-[var(--border)] bg-[var(--bg-raised)] text-[12px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-colors"
          />
          <button
            type="button"
            onClick={handleAddCustom}
            disabled={customInput === ''}
            className="px-2 py-1 rounded-[6px] border border-[var(--accent)] text-[var(--accent)] text-[12px] font-medium hover:bg-[var(--accent-muted)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Target results */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {TARGETS.filter((t) => cls.activeTargets.includes(t)).map((target) => {
          const tr = result.targetResults[target];
          if (!tr) return null;

          const { status, requiredAverage, targetPercentage, maxAchievable } = tr;

          return (
            <div
              key={target}
              className={`rounded-[8px] border p-3 ${
                status === 'already_achieved'
                  ? 'border-[var(--success)] bg-[var(--success-muted)]'
                  : status === 'impossible' || status === 'no_remaining_work'
                  ? 'border-[var(--danger)] bg-[var(--danger-muted)]'
                  : status === 'achievable'
                  ? target === 'A'
                    ? 'border-[var(--success)] bg-[var(--success-muted)]'
                    : target === 'B'
                    ? 'border-[var(--accent)] bg-[var(--accent-muted)]'
                    : target === 'C'
                    ? 'border-[var(--warning)] bg-[var(--warning-muted)]'
                    : 'border-[var(--border)] bg-[var(--bg-raised)]'
                  : 'border-[var(--border)] bg-[var(--bg-raised)]'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {status === 'already_achieved' && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[var(--success)]">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {(status === 'impossible' || status === 'no_remaining_work') && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[var(--danger)]">
                    <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                )}
                <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                  {target} ({targetPercentage}%+)
                </span>
              </div>

              {status === 'already_achieved' && (
                <p className="text-[12px] text-[var(--success)]">
                  Already secured — even scoring 0 on everything left.
                </p>
              )}
              {status === 'no_remaining_work' && (
                <p className="text-[12px] text-[var(--danger)]">
                  No remaining work — grade is locked.
                </p>
              )}
              {status === 'impossible' && (
                <div>
                  <p className="text-[12px] text-[var(--danger)] font-medium">
                    Not achievable.
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    You'd need {requiredAverage !== null ? `${requiredAverage.toFixed(0)}%` : '—'} on remaining work.
                    Best possible: {maxAchievable.toFixed(1)}%.
                  </p>
                </div>
              )}
              {status === 'achievable' && requiredAverage !== null && (
                <div>
                  <p className="text-[13px] font-semibold text-[var(--text-primary)] tabular-nums">
                    Need {requiredAverage.toFixed(1)}% avg
                  </p>
                  <p className="text-[11px] text-[var(--text-tertiary)]">on remaining work</p>
                </div>
              )}
            </div>
          );
        })}

        {/* Custom target cards */}
        {result.customTargetResults.map((ctr) => {
          const { targetPercentage, status, requiredAverage, maxAchievable } = ctr;
          const cardColor =
            status === 'already_achieved'
              ? 'border-[var(--success)] bg-[var(--success-muted)]'
              : status === 'impossible' || status === 'no_remaining_work'
              ? 'border-[var(--danger)] bg-[var(--danger-muted)]'
              : 'border-[var(--accent)] bg-[var(--accent-muted)]';

          return (
            <div key={targetPercentage} className={`rounded-[8px] border p-3 ${cardColor}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  {status === 'already_achieved' && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[var(--success)]">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {(status === 'impossible' || status === 'no_remaining_work') && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[var(--danger)]">
                      <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  )}
                  <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                    {targetPercentage}%
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveCustomTarget(targetPercentage)}
                  className="text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors leading-none"
                  aria-label="Remove target"
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {status === 'already_achieved' && (
                <p className="text-[12px] text-[var(--success)]">
                  Already secured — even scoring 0 on everything left.
                </p>
              )}
              {status === 'no_remaining_work' && (
                <p className="text-[12px] text-[var(--danger)]">
                  No remaining work — grade is locked.
                </p>
              )}
              {status === 'impossible' && (
                <div>
                  <p className="text-[12px] text-[var(--danger)] font-medium">Not achievable.</p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    You'd need {requiredAverage !== null ? `${requiredAverage.toFixed(0)}%` : '—'} on remaining work.
                    Best possible: {maxAchievable.toFixed(1)}%.
                  </p>
                </div>
              )}
              {status === 'achievable' && requiredAverage !== null && (
                <div>
                  <p className="text-[13px] font-semibold text-[var(--text-primary)] tabular-nums">
                    Need {requiredAverage.toFixed(1)}% avg
                  </p>
                  <p className="text-[11px] text-[var(--text-tertiary)]">on remaining work</p>
                </div>
              )}
            </div>
          );
        })}

        {cls.activeTargets.length === 0 && (cls.customTargets ?? []).length === 0 && (
          <p className="text-[12px] text-[var(--text-tertiary)] text-center py-4">
            Select a target above or enter a custom %.
          </p>
        )}
      </div>

      {/* Cross-tool CTA */}
      <div className="p-4 border-t border-[var(--border)]">
        <p className="text-[11px] text-[var(--text-tertiary)] mb-2">GPA impact</p>
        <button
          type="button"
          onClick={() => { onSendToGPA(); onSwitchTool('gpa-tracker'); }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[6px] border border-[var(--accent)] text-[var(--accent)] text-[12px] font-medium hover:bg-[var(--accent-muted)] transition-colors"
        >
          Add to GPA Tracker
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
