import { useState } from 'react';
import type { GradeCategory, RemainingAssignment } from '../../models/gradeRecovery';
import { AssignmentRow } from './AssignmentRow';
import { computeCategoryCurrentPercentage } from '../../lib/gradeRecoveryCalculator';

interface CategoryBlockProps {
  category: GradeCategory;
  mode: 'completed' | 'remaining';
  onUpdateAssignment: (assignmentId: string, patch: Partial<GradeCategory['completedAssignments'][0]>) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onAddAssignment: () => void;
  onUpdateRemaining?: (assignmentId: string, patch: Partial<RemainingAssignment>) => void;
  onDeleteRemaining?: (assignmentId: string) => void;
  onAddRemaining?: () => void;
  onUpdateCategory: (patch: Partial<Pick<GradeCategory, 'name' | 'weight' | 'dropLowest'>>) => void;
}

export function CategoryBlock({
  category,
  mode,
  onUpdateAssignment,
  onDeleteAssignment,
  onAddAssignment,
  onUpdateRemaining,
  onDeleteRemaining,
  onAddRemaining,
  onUpdateCategory,
}: CategoryBlockProps) {
  const [collapsed, setCollapsed] = useState(false);
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

  return (
    <div className="mb-4 last:mb-0">
      {/* Category header */}
      <div className="flex items-center gap-2 mb-2">
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

        <span className="text-[11px] text-[var(--text-tertiary)]">
          <input
            type="number"
            value={category.weight}
            onChange={(e) => onUpdateCategory({ weight: parseFloat(e.target.value) || 0 })}
            min={0}
            max={200}
            className="w-8 text-right bg-transparent outline-none text-[var(--text-tertiary)] tabular-nums"
          />
          %
        </span>

        {mode === 'completed' && pct !== null && (
          <span className={`ml-auto text-[12px] font-medium tabular-nums ${pctColor}`}>
            {pct.toFixed(1)}%
          </span>
        )}
        {mode === 'remaining' && (
          <span className="ml-auto text-[11px] text-[var(--text-tertiary)]">
            {category.remainingAssignments.length} remaining
          </span>
        )}
      </div>

      {!collapsed && (
        <div className="pl-4">
          {mode === 'completed' && (
            <>
              <table className="w-full">
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
              <button
                type="button"
                onClick={onAddAssignment}
                className="mt-2 text-[12px] text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
              >
                + Add grade
              </button>
            </>
          )}

          {mode === 'remaining' && (
            <>
              <table className="w-full">
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
              <button
                type="button"
                onClick={onAddRemaining}
                className="mt-2 text-[12px] text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
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
          <button type="button" onClick={onDelete} className="w-5 h-5 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--danger)]">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </td>
    </tr>
  );
}
