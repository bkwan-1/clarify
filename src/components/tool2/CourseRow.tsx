import { useState } from 'react';
import type { CourseEntry } from '../../models/gpa';
import { GradeDropdown } from '../shared/GradeDropdown';
import { STANDARD_GRADE_POINTS } from '../../models/gpa';
import { Tooltip } from '../shared/Tooltip';

interface CourseRowProps {
  course: CourseEntry;
  onUpdate: (patch: Partial<CourseEntry>) => void;
  onDelete: () => void;
  scenarioMode: boolean;
  cumulativeGPA: number | null;
  gpaWithout?: number | null;
}

export function CourseRow({
  course,
  onUpdate,
  onDelete,
  scenarioMode,
  cumulativeGPA,
  gpaWithout,
}: CourseRowProps) {
  const [hovering, setHovering] = useState(false);

  const effectiveGrade = (scenarioMode && course.scenarioGrade) ? course.scenarioGrade : course.letterGrade;
  const gp = effectiveGrade ? STANDARD_GRADE_POINTS[effectiveGrade] : null;
  const qp = gp !== null ? (gp * course.creditHours).toFixed(1) : null;

  const delta = gpaWithout !== null && gpaWithout !== undefined && cumulativeGPA !== null
    ? cumulativeGPA - gpaWithout
    : null;

  const hurtsGPA = delta !== null && delta < -0.005;

  return (
    <tr
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="border-b border-[var(--border-subtle)] last:border-0 group"
    >
      {/* Course name */}
      <td className="py-2 pr-3">
        <input
          type="text"
          value={course.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Course name"
          className="w-full bg-transparent text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
        />
      </td>

      {/* Grade */}
      <td className="py-2 pr-2">
        <GradeDropdown
          value={course.letterGrade}
          onChange={(g) => onUpdate({ letterGrade: g })}
          compact
        />
      </td>

      {/* Scenario grade (only in scenario mode) */}
      {scenarioMode && (
        <td className="py-2 pr-2">
          <div className="flex items-center gap-1.5">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-[var(--text-tertiary)]">
              <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <GradeDropdown
              value={course.scenarioGrade}
              onChange={(g) => onUpdate({ scenarioGrade: g })}
              compact
            />
          </div>
        </td>
      )}

      {/* Credits */}
      <td className="py-2 pr-2 w-16">
        <input
          type="number"
          value={course.creditHours}
          onChange={(e) => onUpdate({ creditHours: Math.max(0.5, Number(e.target.value) || 0) })}
          min={0.5}
          max={12}
          step={0.5}
          className="w-full text-right bg-[var(--bg-raised)] hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-hover)] border border-transparent focus:border-[var(--accent)] rounded-[4px] px-1.5 py-0.5 text-[13px] text-[var(--text-primary)] outline-none transition-colors"
        />
      </td>

      {/* Quality points */}
      <td className="py-2 pr-2 w-14 text-right text-[12px] text-[var(--text-tertiary)] tabular-nums">
        {qp ?? '—'}
      </td>

      {/* Weight toggle */}
      <td className="py-2 pr-2 w-12 text-center">
        <button
          type="button"
          onClick={() => onUpdate({ courseWeight: course.courseWeight === 'standard' ? 'AP' : 'standard' })}
          className={`w-7 h-5 rounded-[4px] text-[10px] font-medium transition-colors ${
            course.courseWeight !== 'standard'
              ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
              : 'bg-[var(--bg-raised)] text-[var(--text-tertiary)]'
          }`}
        >
          {course.courseWeight !== 'standard' ? 'W' : '—'}
        </button>
      </td>

      {/* GPA impact indicator */}
      <td className="py-2 w-6">
        {hurtsGPA && gpaWithout !== null && gpaWithout !== undefined && (
          <Tooltip
            content={`Removing ${course.name || 'this course'} would raise GPA from ${(cumulativeGPA ?? 0).toFixed(2)} → ${gpaWithout.toFixed(2)}`}
            side="left"
          >
            <span className="text-[var(--danger)] text-[11px] cursor-help">↓</span>
          </Tooltip>
        )}
      </td>

      {/* Delete */}
      <td className="py-2 w-6">
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
