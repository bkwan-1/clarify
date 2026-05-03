import { useState } from 'react';
import { gradeColor } from '../../lib/gpaCalculator';

interface AddCourseRowProps {
  onAdd: (name: string, grade: number | null, credits: number) => void;
  onCancel: () => void;
  scenarioMode?: boolean;
}

export function AddCourseRow({ onAdd, onCancel, scenarioMode }: AddCourseRowProps) {
  const [name, setName] = useState('');
  const [gradeRaw, setGradeRaw] = useState('');
  const [credits, setCredits] = useState(3);

  function parsedGrade(): number | null {
    const n = parseFloat(gradeRaw);
    if (isNaN(n)) return null;
    return Math.max(0, Math.min(100, n));
  }

  function handleConfirm() {
    onAdd(name.trim(), parsedGrade(), credits);
    setName('');
    setGradeRaw('');
    setCredits(3);
  }

  const grade = parsedGrade();

  return (
    <tr className="border-b border-[var(--border-subtle)] bg-[var(--accent-muted)]">
      <td className="py-2 px-4 pr-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm();
            if (e.key === 'Escape') onCancel();
          }}
          placeholder="Course name"
          autoFocus
          className="w-full bg-transparent text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
        />
      </td>
      <td className="py-2 px-2">
        <div className="flex items-center gap-0.5">
          <input
            type="number"
            value={gradeRaw}
            onChange={(e) => setGradeRaw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
              if (e.key === 'Escape') onCancel();
            }}
            placeholder="—"
            min={0}
            max={100}
            step={0.1}
            className={`w-16 bg-[var(--bg-raised)] rounded-[4px] px-1.5 py-0.5 text-[13px] outline-none border border-[var(--accent)] tabular-nums ${
              grade !== null ? gradeColor(grade) : 'text-[var(--text-primary)]'
            }`}
          />
          <span className="text-[11px] text-[var(--text-tertiary)]">%</span>
        </div>
      </td>
      {scenarioMode && <td className="py-2 px-2" />}
      <td className="py-2 px-2 w-16">
        <input
          type="number"
          value={credits}
          onChange={(e) => setCredits(Math.max(0.5, Number(e.target.value) || 0))}
          min={0.5}
          max={12}
          step={0.5}
          className="w-full text-right bg-[var(--bg-raised)] rounded-[4px] px-1.5 py-0.5 text-[13px] text-[var(--text-primary)] outline-none border border-[var(--accent)]"
        />
      </td>
      <td className="py-2 w-6" />
      <td className="py-2 pr-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-5 h-5 flex items-center justify-center rounded-[4px] bg-[var(--success)] text-white hover:opacity-90"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 5l3 3 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-5 h-5 flex items-center justify-center rounded-[4px] text-[var(--text-tertiary)] hover:text-[var(--danger)]"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}
