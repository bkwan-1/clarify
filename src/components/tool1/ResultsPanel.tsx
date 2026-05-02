import { useState } from 'react';
import type { GradeRecoveryResult, GradeRecoveryClass, LetterGrade } from '../../models/gradeRecovery';
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

const TARGET_CHIP: Record<string, string> = {
  A: 'border-[var(--success)] bg-[var(--success-muted)] text-[var(--success)]',
  B: 'border-[var(--accent)]  bg-[var(--accent-muted)]  text-[var(--accent)]',
  C: 'border-[var(--warning)] bg-[var(--warning-muted)] text-[var(--warning)]',
  D: 'border-[var(--border)]  bg-[var(--bg-raised)]     text-[var(--text-secondary)]',
};

const ACHIEVABLE_CARD: Record<string, string> = {
  A: 'border-[var(--success)] bg-[var(--success-muted)]',
  B: 'border-[var(--accent)]  bg-[var(--accent-muted)]',
  C: 'border-[var(--warning)] bg-[var(--warning-muted)]',
  D: 'border-[var(--border)]  bg-[var(--bg-raised)]',
};

const ACHIEVABLE_NUM: Record<string, string> = {
  A: 'text-[var(--success)]',
  B: 'text-[var(--accent)]',
  C: 'text-[var(--warning)]',
  D: 'text-[var(--text-secondary)]',
};

function gradientBar(pct: number) {
  if (pct >= 90) return 'bg-[var(--success)]';
  if (pct >= 80) return 'bg-[var(--accent)]';
  if (pct >= 70) return 'bg-[var(--warning)]';
  return 'bg-[var(--danger)]';
}

function pctTextColor(pct: number) {
  if (pct >= 90) return 'text-[var(--success)]';
  if (pct >= 80) return 'text-[var(--accent)]';
  if (pct >= 70) return 'text-[var(--warning)]';
  return 'text-[var(--danger)]';
}

function remainingLabel(n: number): string {
  if (n === 0) return 'no upcoming work entered';
  if (n === 1) return '1 remaining assignment';
  return `${n} remaining assignments`;
}

// ---------------------------------------------------------------------------
// Shared breakdown row shown inside an expanded card
// ---------------------------------------------------------------------------

function BreakdownRow({
  name,
  weight,
  pct,
}: {
  name: string;
  weight: number | undefined;
  pct: number | null;
}) {
  const color =
    pct === null
      ? 'text-[var(--text-tertiary)]'
      : pct >= 90
      ? 'text-[var(--success)]'
      : pct >= 80
      ? 'text-[var(--accent)]'
      : pct >= 70
      ? 'text-[var(--warning)]'
      : 'text-[var(--danger)]';

  return (
    <div className="flex items-center justify-between text-[11px] py-0.5">
      <span className="text-[var(--text-secondary)] truncate mr-2">
        {name}
        {weight !== undefined && (
          <span className="text-[var(--text-tertiary)]"> ({weight.toFixed(0)}%)</span>
        )}
      </span>
      <span className={`tabular-nums shrink-0 font-medium ${color}`}>
        {pct !== null ? `${pct.toFixed(1)}%` : '—'}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ResultsPanel({
  cls,
  result,
  onToggleTarget,
  onSendToGPA,
  onSwitchTool,
  onAddCustomTarget,
  onRemoveCustomTarget,
}: ResultsPanelProps) {
  const [customInput, setCustomInput] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  function toggleExpanded(key: string) {
    setExpanded((prev) => (prev === key ? null : key));
  }

  if (!result) {
    return (
      <aside className="flex flex-col h-full overflow-y-auto w-full">
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-[12px] text-[var(--text-tertiary)] text-center">
            Add grades to see what you need.
          </p>
        </div>
      </aside>
    );
  }

  const currentPct = result.currentGradePercentage;
  const currentLetter = result.currentLetterGrade;

  // Count non-extra-credit remaining assignments (the ones that "cost" you)
  const totalRemaining = cls.categories.reduce(
    (sum, cat) => sum + cat.remainingAssignments.filter((r) => !r.isExtraCredit).length,
    0,
  );

  function handleAddCustom() {
    const val = parseFloat(customInput);
    if (isNaN(val) || val < 0 || val > 110) return;
    onAddCustomTarget(Math.round(val * 10) / 10);
    setCustomInput('');
  }

  return (
    <aside className="flex flex-col h-full overflow-y-auto w-full">
      {/* ── Current grade header ─────────────────────────────────── */}
      <div className="p-4 border-b border-[var(--border)]">
        <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">
          Current Grade
        </p>

        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-[28px] font-semibold tabular-nums leading-none ${pctTextColor(currentPct)}`}>
            {currentPct.toFixed(1)}%
          </span>
          <span className={`text-[16px] font-medium ${pctTextColor(currentPct)}`}>
            {currentLetter}
          </span>
        </div>

        {/* Thin progress bar */}
        <div className="w-full h-1.5 rounded-full bg-[var(--bg-raised)] overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${gradientBar(currentPct)}`}
            style={{ width: `${Math.min(currentPct, 100)}%` }}
          />
        </div>

        <p className="text-[11px] text-[var(--text-tertiary)]">{remainingLabel(totalRemaining)}</p>
      </div>

      {/* ── Target toggles ───────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">
          Show targets
        </p>

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
                    ? TARGET_CHIP[t]
                    : 'border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--text-tertiary)]'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Custom target input */}
        <div className="flex items-center gap-1.5 mt-2.5">
          <input
            type="number"
            min={0}
            max={110}
            step={0.1}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
            placeholder="Custom %"
            className="flex-1 min-w-0 px-2 py-1 rounded-[6px] border border-[var(--border)] bg-[var(--bg-raised)] text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-colors"
          />
          <button
            type="button"
            onClick={handleAddCustom}
            disabled={customInput === ''}
            className="px-2.5 py-1 rounded-[6px] border border-[var(--accent)] text-[var(--accent)] text-[12px] font-medium hover:bg-[var(--accent-muted)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* ── Result cards ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

        {/* Standard A/B/C/D cards */}
        {TARGETS.filter((t) => cls.activeTargets.includes(t)).map((target) => {
          const tr = result.targetResults[target];
          if (!tr) return null;
          const { status, requiredAverage, targetPercentage, maxAchievable, categorySnapshots } = tr;
          const isExpanded = expanded === target;

          const cardClass =
            status === 'already_achieved'
              ? 'border-[var(--success)] bg-[var(--success-muted)]'
              : status === 'impossible' || status === 'no_remaining_work'
              ? 'border-[var(--danger)] bg-[var(--danger-muted)]'
              : ACHIEVABLE_CARD[target];

          const numColor =
            status === 'impossible' || status === 'no_remaining_work'
              ? 'text-[var(--danger)]'
              : status === 'already_achieved'
              ? 'text-[var(--success)]'
              : ACHIEVABLE_NUM[target];

          return (
            <div key={target} className={`rounded-[8px] border p-3 ${cardClass}`}>
              {/* Label row */}
              <div className="flex items-center gap-1.5 mb-2">
                {status === 'already_achieved' && (
                  <CheckIcon className="text-[var(--success)]" />
                )}
                {(status === 'impossible' || status === 'no_remaining_work') && (
                  <XIcon className="text-[var(--danger)]" />
                )}
                <span className={`text-[12px] font-semibold ${numColor}`}>
                  {target} ({targetPercentage}%+)
                </span>
              </div>

              {/* Status body */}
              {status === 'already_achieved' && (
                <p className="text-[13px] font-medium text-[var(--success)]">Already secured</p>
              )}

              {status === 'no_remaining_work' && (
                <p className="text-[13px] font-medium text-[var(--danger)]">
                  Grade is locked — no remaining work
                </p>
              )}

              {status === 'impossible' && (
                <div>
                  <p className="text-[13px] font-semibold text-[var(--danger)]">Not achievable</p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    Best possible:{' '}
                    <span className="font-medium">{maxAchievable.toFixed(1)}%</span>
                    {requiredAverage !== null && (
                      <span className="text-[var(--text-tertiary)]">
                        {' '}· would need {requiredAverage.toFixed(0)}%
                      </span>
                    )}
                  </p>
                </div>
              )}

              {status === 'achievable' && requiredAverage !== null && (
                <div>
                  {/* Hero number */}
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-[22px] font-semibold tabular-nums leading-none ${numColor}`}>
                      {requiredAverage.toFixed(1)}%
                    </span>
                    <span className="text-[11px] text-[var(--text-tertiary)]">avg needed</span>
                  </div>
                  {totalRemaining > 0 && (
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                      on {remainingLabel(totalRemaining)}
                    </p>
                  )}
                </div>
              )}

              {/* Collapsible breakdown */}
              {categorySnapshots.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(target)}
                    className="flex items-center gap-1 mt-2.5 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    <ChevronIcon rotated={isExpanded} />
                    {isExpanded ? 'Hide' : 'Show'} breakdown
                  </button>

                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10 space-y-0.5">
                      {categorySnapshots.map((snap) => {
                        const cat = cls.categories.find((c) => c.id === snap.categoryId);
                        if (!cat) return null;
                        const w = result.normalizedWeights[snap.categoryId];
                        return (
                          <BreakdownRow
                            key={snap.categoryId}
                            name={cat.name}
                            weight={w}
                            pct={snap.currentEarnedPercentage}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Custom target cards */}
        {result.customTargetResults.map((ctr) => {
          const { targetPercentage, status, requiredAverage, maxAchievable } = ctr;
          const key = `custom-${targetPercentage}`;

          const cardClass =
            status === 'already_achieved'
              ? 'border-[var(--success)] bg-[var(--success-muted)]'
              : status === 'impossible' || status === 'no_remaining_work'
              ? 'border-[var(--danger)] bg-[var(--danger-muted)]'
              : 'border-[var(--accent)] bg-[var(--accent-muted)]';

          const numColor =
            status === 'impossible' || status === 'no_remaining_work'
              ? 'text-[var(--danger)]'
              : status === 'already_achieved'
              ? 'text-[var(--success)]'
              : 'text-[var(--accent)]';

          return (
            <div key={key} className={`rounded-[8px] border p-3 ${cardClass}`}>
              {/* Label row with remove button */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {status === 'already_achieved' && (
                    <CheckIcon className="text-[var(--success)]" />
                  )}
                  {(status === 'impossible' || status === 'no_remaining_work') && (
                    <XIcon className="text-[var(--danger)]" />
                  )}
                  <span className={`text-[12px] font-semibold ${numColor}`}>
                    {targetPercentage}%
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveCustomTarget(targetPercentage)}
                  aria-label="Remove custom target"
                  className="w-5 h-5 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {status === 'already_achieved' && (
                <p className="text-[13px] font-medium text-[var(--success)]">Already secured</p>
              )}
              {status === 'no_remaining_work' && (
                <p className="text-[13px] font-medium text-[var(--danger)]">
                  Grade is locked — no remaining work
                </p>
              )}
              {status === 'impossible' && (
                <div>
                  <p className="text-[13px] font-semibold text-[var(--danger)]">Not achievable</p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    Best possible:{' '}
                    <span className="font-medium">{maxAchievable.toFixed(1)}%</span>
                    {requiredAverage !== null && (
                      <span className="text-[var(--text-tertiary)]">
                        {' '}· would need {requiredAverage.toFixed(0)}%
                      </span>
                    )}
                  </p>
                </div>
              )}
              {status === 'achievable' && requiredAverage !== null && (
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-[22px] font-semibold tabular-nums leading-none ${numColor}`}>
                      {requiredAverage.toFixed(1)}%
                    </span>
                    <span className="text-[11px] text-[var(--text-tertiary)]">avg needed</span>
                  </div>
                  {totalRemaining > 0 && (
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                      on {remainingLabel(totalRemaining)}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {cls.activeTargets.length === 0 && (cls.customTargets ?? []).length === 0 && (
          <p className="text-[12px] text-[var(--text-tertiary)] text-center py-6">
            Pick a target above to see what you need.
          </p>
        )}
      </div>

      {/* ── GPA handoff CTA ──────────────────────────────────────── */}
      <div className="p-4 border-t border-[var(--border)]">
        <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">
          GPA impact
        </p>
        <button
          type="button"
          onClick={() => {
            onSendToGPA();
            onSwitchTool('gpa-tracker');
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-[6px] border border-[var(--accent)] text-[var(--accent)] text-[12px] font-medium hover:bg-[var(--accent-muted)] transition-colors"
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

// ---------------------------------------------------------------------------
// Tiny icon components (avoids repetition)
// ---------------------------------------------------------------------------

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`shrink-0 ${className ?? ''}`}>
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`shrink-0 ${className ?? ''}`}>
      <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ rotated }: { rotated: boolean }) {
  return (
    <svg
      width="10" height="10" viewBox="0 0 10 10" fill="none"
      className={`shrink-0 transition-transform duration-150 ${rotated ? 'rotate-180' : ''}`}
    >
      <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
