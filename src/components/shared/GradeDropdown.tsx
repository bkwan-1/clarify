import { useState, useRef, useEffect } from 'react';
import type { LetterGrade } from '../../models/gradeRecovery';
import { ALL_LETTER_GRADES, STANDARD_GRADE_POINTS } from '../../models/gpa';

interface GradeDropdownProps {
  value: LetterGrade | null;
  onChange: (grade: LetterGrade | null) => void;
  placeholder?: string;
  disabled?: boolean;
  allowNull?: boolean;
  compact?: boolean;
}

const gradeColor = (grade: LetterGrade): string => {
  const pts = STANDARD_GRADE_POINTS[grade];
  if (pts >= 3.7) return 'text-[var(--success)]';
  if (pts >= 3.0) return 'text-[var(--accent)]';
  if (pts >= 2.0) return 'text-[var(--warning)]';
  return 'text-[var(--danger)]';
};

export function GradeDropdown({
  value,
  onChange,
  placeholder = 'Grade',
  disabled = false,
  allowNull = true,
  compact = false,
}: GradeDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const extraGrades = ['IP', 'W', 'P', 'NP'] as const;

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 rounded-[6px] border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] transition-colors duration-100 font-medium tabular-nums ${
          compact ? 'px-2 py-0.5 text-[12px]' : 'px-2.5 py-1 text-[13px]'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${
          value ? gradeColor(value) : 'text-[var(--text-tertiary)]'
        }`}
      >
        {value ?? placeholder}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-50">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-28 rounded-[8px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-lg overflow-auto max-h-64 py-1">
          {allowNull && (
            <button
              type="button"
              onClick={() => { onChange(null); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[12px] hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)]"
            >
              <span>—</span>
            </button>
          )}
          {ALL_LETTER_GRADES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => { onChange(g); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-[12px] hover:bg-[var(--bg-hover)] ${g === value ? 'bg-[var(--accent-muted)]' : ''}`}
            >
              <span className={gradeColor(g)}>{g}</span>
              <span className="text-[var(--text-tertiary)] tabular-nums">
                {STANDARD_GRADE_POINTS[g].toFixed(1)}
              </span>
            </button>
          ))}
          {extraGrades.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => { onChange(null); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[12px] hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)]"
            >
              <span>{g}</span>
              <span className="text-[10px] opacity-50">—</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
