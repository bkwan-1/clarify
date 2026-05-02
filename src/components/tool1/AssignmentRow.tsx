import { useState } from 'react';
import type { AssignmentEntry } from '../../models/gradeRecovery';

interface AssignmentRowProps {
  assignment: AssignmentEntry;
  onUpdate: (patch: Partial<AssignmentEntry>) => void;
  onDelete: () => void;
}

export function AssignmentRow({ assignment, onUpdate, onDelete }: AssignmentRowProps) {
  const [hovering, setHovering] = useState(false);

  const earned = assignment.earnedPoints ?? null;
  const total = assignment.totalPoints ?? null;
  const pct =
    earned !== null && total !== null && total > 0
      ? ((earned / total) * 100).toFixed(1)
      : null;

  const pctNum = pct !== null ? Number(pct) : null;
  const pctColor =
    pct === null      ? 'text-[var(--text-tertiary)]'
    : pctNum! > 110   ? 'text-[var(--warning)]'   // suspiciously high — amber flag
    : pctNum! >= 90   ? 'text-[var(--success)]'
    : pctNum! >= 80   ? 'text-[var(--accent)]'
    : pctNum! >= 70   ? 'text-[var(--warning)]'
    : 'text-[var(--danger)]';

  return (
    <tr
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={`border-b border-[var(--border-subtle)] last:border-0 ${assignment.isDropped ? 'opacity-40' : ''}`}
    >
      {/* Label */}
      <td className="py-1.5 pr-2">
        <input
          type="text"
          value={assignment.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="w-full bg-transparent text-[13px] text-[var(--text-secondary)] outline-none hover:text-[var(--text-primary)] focus:text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
          placeholder="Assignment"
        />
      </td>

      {/* Score */}
      <td className="py-1.5 pr-1 w-16">
        <input
          type="number"
          value={earned ?? ''}
          onChange={(e) => {
            if (e.target.value === '') { onUpdate({ earnedPoints: undefined }); return; }
            const n = Number(e.target.value);
            if (!isNaN(n)) onUpdate({ earnedPoints: Math.max(0, n) });
          }}
          placeholder="—"
          min={0}
          className="w-full text-right bg-[var(--bg-raised)] hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-hover)] border border-transparent focus:border-[var(--accent)] rounded-[4px] px-1.5 py-0.5 text-[13px] text-[var(--text-primary)] outline-none transition-colors"
        />
      </td>
      <td className="py-1.5 px-1 text-[var(--text-tertiary)] text-[11px] text-center">/</td>

      {/* Out of */}
      <td className="py-1.5 pr-2 w-16">
        <input
          type="number"
          value={total ?? ''}
          onChange={(e) => {
            if (e.target.value === '') { onUpdate({ totalPoints: undefined }); return; }
            const n = Number(e.target.value);
            if (!isNaN(n)) onUpdate({ totalPoints: Math.max(0.01, n) });
          }}
          placeholder="100"
          min={0.01}
          className={`w-full text-right bg-[var(--bg-raised)] hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-hover)] rounded-[4px] px-1.5 py-0.5 text-[13px] text-[var(--text-primary)] outline-none transition-colors border ${
            total !== null && total <= 0
              ? 'border-[var(--danger)]'
              : 'border-transparent focus:border-[var(--accent)]'
          }`}
        />
      </td>

      {/* Percentage */}
      <td className={`py-1.5 w-14 tabular-nums text-right text-[12px] font-medium ${pctColor}`}>
        {pct !== null ? `${pct}%` : '—'}
      </td>

      {/* Delete — always in DOM; .delete-btn CSS makes it visible on touch devices */}
      <td className="py-1.5 pl-2 w-6">
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete assignment"
          className={`delete-btn w-5 h-5 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors ${
            hovering ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </td>
    </tr>
  );
}
