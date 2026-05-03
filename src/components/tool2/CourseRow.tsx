import { useState } from 'react';
import type { CourseEntry } from '../../models/gpa';
import { gradeColor } from '../../lib/gpaCalculator';
import { Tooltip } from '../shared/Tooltip';

interface CourseRowProps {
  course: CourseEntry;
  onUpdate: (patch: Partial<CourseEntry>) => void;
  onDelete: () => void;
  scenarioMode: boolean;
  currentAverage: number | null;
  averageWithout?: number | null;
}

function PercentInput({
  value,
  onChange,
  placeholder,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
}) {
  const [raw, setRaw] = useState(value !== null ? String(value) : '');

  function commit(str: string) {
    const n = parseFloat(str);
    if (str.trim() === '' || isNaN(n)) {
      onChange(null);
    } else {
      onChange(Math.max(0, Math.min(100, n)));
    }
  }

  return (
    <div className="flex items-center gap-0.5">
      <input
        type="number"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={(e) => {
          commit(e.target.value);
          const n = parseFloat(e.target.value);
          if (!isNaN(n)) setRaw(String(Math.max(0, Math.min(100, n))));
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        placeholder={placeholder ?? '—'}
        min={0}
        max={100}
        step={0.1}
        className={`w-16 bg-[var(--bg-raised)] hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-hover)] border border-transparent focus:border-[var(--accent)] rounded-[4px] px-1.5 py-0.5 text-[13px] outline-none transition-colors tabular-nums ${
          value !== null ? gradeColor(value) : 'text-[var(--text-tertiary)]'
        }`}
      />
      <span className="text-[11px] text-[var(--text-tertiary)]">%</span>
    </div>
  );
}

export function CourseRow({
  course,
  onUpdate,
  onDelete,
  scenarioMode,
  currentAverage,
  averageWithout,
}: CourseRowProps) {
  const [hovering, setHovering] = useState(false);

  const scenarioChanged =
    scenarioMode &&
    course.scenarioGrade !== null &&
    course.scenarioGrade !== course.gradePercent;

  const delta =
    averageWithout !== null && averageWithout !== undefined && currentAverage !== null
      ? currentAverage - averageWithout
      : null;
  const hurtsAverage = delta !== null && delta < -0.05;

  return (
    <tr
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={`border-b border-[var(--border-subtle)] last:border-0 transition-colors ${
        scenarioChanged ? 'bg-[var(--accent-muted)]/40' : ''
      }`}
    >
      {/* Course name */}
      <td className="py-2 px-4 pr-3">
        <input
          type="text"
          value={course.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Course name"
          className="w-full bg-transparent text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
        />
      </td>

      {/* Grade % */}
      <td className="py-2 px-2">
        <PercentInput
          value={course.gradePercent}
          onChange={(v) => onUpdate({ gradePercent: v })}
        />
      </td>

      {/* Scenario grade — only in scenario mode */}
      {scenarioMode && (
        <td className="py-2 px-2">
          <div className="flex items-center gap-1.5">
            <svg
              width="10" height="10" viewBox="0 0 10 10" fill="none"
              className={`shrink-0 ${scenarioChanged ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}
            >
              <path
                d="M2 5h6M5 2l3 3-3 3"
                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
            <PercentInput
              value={course.scenarioGrade}
              onChange={(v) => onUpdate({ scenarioGrade: v })}
            />
          </div>
        </td>
      )}

      {/* Credits */}
      <td className="py-2 px-2 w-16">
        <input
          type="number"
          value={course.creditHours}
          onChange={(e) =>
            onUpdate({ creditHours: Math.max(0.5, Number(e.target.value) || 0) })
          }
          min={0.5}
          max={12}
          step={0.5}
          className="w-full text-right bg-[var(--bg-raised)] hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-hover)] border border-transparent focus:border-[var(--accent)] rounded-[4px] px-1.5 py-0.5 text-[13px] text-[var(--text-primary)] outline-none transition-colors"
        />
      </td>

      {/* Average impact indicator — hidden on mobile */}
      <td className="hidden sm:table-cell py-2 w-6">
        {hurtsAverage && averageWithout !== null && averageWithout !== undefined && (
          <Tooltip
            content={`Removing this would raise avg: ${(currentAverage ?? 0).toFixed(1)}% → ${averageWithout.toFixed(1)}%`}
            side="left"
          >
            <span className="text-[var(--danger)] text-[11px] cursor-help select-none">↓</span>
          </Tooltip>
        )}
      </td>

      {/* Delete */}
      <td className="py-2 pr-2 w-6">
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete course"
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
