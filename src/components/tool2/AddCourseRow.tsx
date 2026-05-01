import { useState } from 'react';
import type { LetterGrade } from '../../models/gradeRecovery';
import { GradeDropdown } from '../shared/GradeDropdown';

interface AddCourseRowProps {
  onAdd: (name: string, grade: LetterGrade | null, credits: number, weighted: boolean) => void;
  onCancel: () => void;
  colSpan?: number;
  scenarioMode?: boolean;
}

export function AddCourseRow({ onAdd, onCancel, scenarioMode }: AddCourseRowProps) {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<LetterGrade | null>(null);
  const [credits, setCredits] = useState(3);
  const [weighted, setWeighted] = useState(false);

  function handleConfirm() {
    onAdd(name.trim(), grade, credits, weighted);
    setName('');
    setGrade(null);
    setCredits(3);
    setWeighted(false);
  }

  return (
    <tr className="border-b border-[var(--border-subtle)] bg-[var(--accent-muted)]">
      <td className="py-2 pr-3">
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
      <td className="py-2 pr-2">
        <GradeDropdown value={grade} onChange={setGrade} compact allowNull />
      </td>
      {scenarioMode && <td className="py-2 pr-2" />}
      <td className="py-2 pr-2 w-16">
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
      <td className="py-2 pr-2 w-14 text-right text-[12px] text-[var(--text-tertiary)]">—</td>
      <td className="py-2 pr-2 w-12 text-center">
        <button
          type="button"
          onClick={() => setWeighted((w) => !w)}
          className={`w-7 h-5 rounded-[4px] text-[10px] font-medium transition-colors ${
            weighted ? 'bg-[var(--accent-muted)] text-[var(--accent)]' : 'bg-[var(--bg-raised)] text-[var(--text-tertiary)]'
          }`}
        >
          {weighted ? 'W' : '—'}
        </button>
      </td>
      <td className="py-2 w-6" />
      <td className="py-2">
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
