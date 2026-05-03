import { useState } from 'react';
import type { GradeCategory, RemainingAssignment } from '../../models/gradeRecovery';
import { AssignmentRow } from './AssignmentRow';
import { computeCategoryCurrentPercentage } from '../../lib/gradeRecoveryCalculator';

interface CategoryBlockProps {
  category: GradeCategory;
  mode: 'completed' | 'remaining';
  /** Called when adding a grade. Pass earned/total for quick-add; omit for a blank row. */
  onAddAssignment: (earned?: number, total?: number) => void;
  onUpdateAssignment: (assignmentId: string, patch: Partial<GradeCategory['completedAssignments'][0]>) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onUpdateRemaining?: (assignmentId: string, patch: Partial<RemainingAssignment>) => void;
  onDeleteRemaining?: (assignmentId: string) => void;
  onAddRemaining?: () => void;
  onUpdateCategory: (patch: Partial<Pick<GradeCategory, 'name' | 'weight' | 'dropLowest'>>) => void;
  onDeleteCategory?: () => void;
}

export function CategoryBlock({
  category,
  mode,
  onAddAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onUpdateRemaining,
  onDeleteRemaining,
  onAddRemaining,
  onUpdateCategory,
  onDeleteCategory,
}: CategoryBlockProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [headerHovered, setHeaderHovered] = useState(false);
  const { pct } = computeCategoryCurrentPercentage(category);

  const pctColor =
    pct === null
      ? 'text-[var(--text-tertiary)]'
      : pct >= 90
      ? 'text-[var(--success)]'
      : pct >= 80
      ? 'text-[var(--accent)]'
      : pct >= 70
      ? 'text-[var(--warning)]'
      : 'text-[var(--danger)]';

  function handleQuickAdd() {
    // Accept comma- or space-separated numbers: "88, 92, 76" or "88 92 76"
    const tokens = quickInput.split(/[\s,;]+/).filter(Boolean);
    const grades = tokens
      .map((v) => parseFloat(v))
      .filter((n) => !isNaN(n) && n >= 0);
    if (grades.length === 0) return;
    grades.forEach((earned) => onAddAssignment(earned, 100));
    setQuickInput('');
  }

  return (
    <div className="mb-5 last:mb-0">
      {/* Category header */}
      <div
        className="flex items-center gap-2 mb-2 group/cat"
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
      >
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-1.5 min-w-0"
        >
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            className={`shrink-0 text-[var(--text-tertiary)] transition-transform ${collapsed ? '-rotate-90' : ''}`}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={category.name}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onUpdateCategory({ name: e.target.value })}
            className="text-[13px] font-semibold text-[var(--text-primary)] bg-transparent outline-none min-w-0 truncate"
          />
        </button>

        <span className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-0.5">
          <input
            type="number"
            value={category.weight}
            onChange={(e) => onUpdateCategory({ weight: parseFloat(e.target.value) || 0 })}
            min={0}
            max={200}
            className="w-9 text-right bg-transparent outline-none text-[var(--text-tertiary)] tabular-nums hover:bg-[var(--bg-raised)] focus:bg-[var(--bg-raised)] rounded-[3px] px-0.5"
          />
          %
        </span>

        {mode === 'completed' && pct !== null && (
          <span className={`ml-auto text-[12px] font-semibold tabular-nums ${pctColor}`}>
            {pct.toFixed(1)}%
          </span>
        )}
        {mode === 'remaining' && (
          <span className="ml-auto text-[11px] text-[var(--text-tertiary)]">
            {category.remainingAssignments.length}{' '}
            {category.remainingAssignments.length === 1 ? 'item' : 'items'}
          </span>
        )}
        {onDeleteCategory && (
          <button
            type="button"
            onClick={onDeleteCategory}
            aria-label="Delete category"
            className={`w-5 h-5 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-all ${
              headerHovered ? 'opacity-100' : 'opacity-0'
            } ${mode === 'completed' && pct === null && 'ml-auto'}`}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="pl-4">
          {/* ── Completed mode ─────────────────────────────── */}
          {mode === 'completed' && (
            <>
              {/* Quick-paste input */}
              <div className="flex items-center gap-1.5 mb-3">
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                  placeholder="Paste grades: 88, 92, 76"
                  className="flex-1 min-w-0 px-2 py-1 rounded-[5px] border border-[var(--border)] bg-[var(--bg-raised)] text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-colors"
                />
                <button
                  type="button"
                  onClick={handleQuickAdd}
                  disabled={quickInput.trim() === ''}
                  className="px-2 py-1 rounded-[5px] border border-[var(--border)] text-[11px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Grades table */}
              {category.completedAssignments.length > 0 && (
                <table className="w-full mb-2">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left py-1 text-[11px] font-medium text-[var(--text-tertiary)] pr-2">Assignment</th>
                      <th className="text-right py-1 text-[11px] font-medium text-[var(--text-tertiary)] pr-1 w-16">Score</th>
                      <th className="w-4" />
                      <th className="text-right py-1 text-[11px] font-medium text-[var(--text-tertiary)] pr-2 w-16">Out of</th>
                      <th className="text-right py-1 text-[11px] font-medium text-[var(--text-tertiary)] w-14">%</th>
                      <th className="w-6" />
                    </tr>
                  </thead>
                  <tbody>
                    {category.completedAssignments.map((a) => (
                      <AssignmentRow
                        key={a.id}
                        assignment={a}
                        onUpdate={(patch) => onUpdateAssignment(a.id, patch)}
                        onDelete={() => onDeleteAssignment(a.id)}
                      />
                    ))}
                  </tbody>
                </table>
              )}

              {/* First-time hint — shown only when no grades yet */}
              {category.completedAssignments.length === 0 && (
                <p className="text-[11px] text-[var(--text-tertiary)] mt-1 mb-2">
                  Type a grade and press Enter, or paste multiple: <span className="font-mono">88, 92, 76</span>
                </p>
              )}

              <button
                type="button"
                onClick={() => onAddAssignment()}
                className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
              >
                + Add grade
              </button>
            </>
          )}

          {/* ── Upcoming mode ──────────────────────────────── */}
          {mode === 'remaining' && (
            <>
              {category.remainingAssignments.length > 0 && (
                <table className="w-full mb-2">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left py-1 text-[11px] font-medium text-[var(--text-tertiary)] pr-2">Assignment</th>
                      <th className="text-right py-1 text-[11px] font-medium text-[var(--text-tertiary)] pr-2 w-20">Points</th>
                      <th className="text-center py-1 text-[11px] font-medium text-[var(--text-tertiary)] w-16">EC?</th>
                      <th className="w-6" />
                    </tr>
                  </thead>
                  <tbody>
                    {category.remainingAssignments.map((r) => (
                      <RemainingRow
                        key={r.id}
                        assignment={r}
                        onUpdate={(patch) => onUpdateRemaining?.(r.id, patch)}
                        onDelete={() => onDeleteRemaining?.(r.id)}
                      />
                    ))}
                  </tbody>
                </table>
              )}

              <button
                type="button"
                onClick={onAddRemaining}
                className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
              >
                + Add upcoming
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Remaining assignment row (internal)
// ---------------------------------------------------------------------------

function RemainingRow({
  assignment,
  onUpdate,
  onDelete,
}: {
  assignment: RemainingAssignment;
  onUpdate: (patch: Partial<RemainingAssignment>) => void;
  onDelete: () => void;
}) {
  const [hovering, setHovering] = useState(false);

  return (
    <tr
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="border-b border-[var(--border-subtle)] last:border-0"
    >
      <td className="py-1.5 pr-2">
        <input
          type="text"
          value={assignment.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="w-full bg-transparent text-[13px] text-[var(--text-secondary)] outline-none hover:text-[var(--text-primary)] focus:text-[var(--text-primary)]"
          placeholder="Assignment"
        />
      </td>
      <td className="py-1.5 pr-2 w-20">
        <input
          type="number"
          value={assignment.pointValue}
          onChange={(e) => onUpdate({ pointValue: Number(e.target.value) || 0 })}
          min={0}
          className="w-full text-right bg-[var(--bg-raised)] hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-hover)] border border-transparent focus:border-[var(--accent)] rounded-[4px] px-1.5 py-0.5 text-[13px] outline-none transition-colors"
        />
      </td>
      <td className="py-1.5 w-16 text-center">
        <input
          type="checkbox"
          checked={assignment.isExtraCredit}
          onChange={(e) => onUpdate({ isExtraCredit: e.target.checked })}
          className="accent-[var(--accent)]"
        />
      </td>
      <td className="py-1.5 pl-2 w-6">
        {hovering && (
          <button
            type="button"
            onClick={onDelete}
            className="w-5 h-5 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </td>
    </tr>
  );
}
