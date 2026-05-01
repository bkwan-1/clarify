import { useState } from 'react';
import { Modal } from '../shared/Modal';
import type { GradeStructure } from '../../models/gradeRecovery';

interface CategoryDraft {
  name: string;
  weight: string;
}

interface NewClassModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    name: string,
    structure: GradeStructure,
    categories: { name: string; weight: number }[],
  ) => void;
}

const DEFAULT_CATS: CategoryDraft[] = [
  { name: 'Homework', weight: '25' },
  { name: 'Quizzes', weight: '15' },
  { name: 'Midterm', weight: '25' },
  { name: 'Final Exam', weight: '35' },
];

export function NewClassModal({ open, onClose, onSubmit }: NewClassModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [structure, setStructure] = useState<GradeStructure>('weighted');
  const [categories, setCategories] = useState<CategoryDraft[]>(DEFAULT_CATS);

  function reset() {
    setStep(1);
    setName('');
    setStructure('weighted');
    setCategories(DEFAULT_CATS);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleNext() {
    if (!name.trim()) return;
    if (structure !== 'weighted') {
      handleSubmit();
    } else {
      setStep(2);
    }
  }

  function handleSubmit() {
    const cats = categories
      .filter((c) => c.name.trim())
      .map((c) => ({ name: c.name.trim(), weight: parseFloat(c.weight) || 0 }));
    onSubmit(name.trim(), structure, cats);
    handleClose();
  }

  const weightSum = categories.reduce((s, c) => s + (parseFloat(c.weight) || 0), 0);
  const weightOk = Math.abs(weightSum - 100) < 0.01;

  return (
    <Modal open={open} onClose={handleClose} title={step === 1 ? 'New Class' : 'Categories & Weights'}>
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">
              Class name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              placeholder="e.g. ECON 201"
              autoFocus
              className="w-full px-3 py-2 rounded-[6px] border border-[var(--border)] bg-[var(--bg-raised)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">
              Grading structure
            </label>
            <div className="flex flex-col gap-2">
              {(
                [
                  { val: 'weighted', label: 'Weighted categories', sub: 'Homework 25%, Exams 50%, etc.' },
                  { val: 'simple', label: 'Simple average', sub: 'All assignments count equally' },
                  { val: 'points', label: 'Points-based', sub: 'Total points out of a maximum' },
                ] as { val: GradeStructure; label: string; sub: string }[]
              ).map(({ val, label, sub }) => (
                <label key={val} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value={val}
                    checked={structure === val}
                    onChange={() => setStructure(val)}
                    className="mt-0.5 accent-[var(--accent)]"
                  />
                  <span>
                    <span className="text-[13px] font-medium text-[var(--text-primary)]">{label}</span>
                    <br />
                    <span className="text-[12px] text-[var(--text-secondary)]">{sub}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleNext}
              disabled={!name.trim()}
              className="px-4 py-2 bg-[var(--accent)] text-white text-[13px] font-medium rounded-[6px] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {structure === 'weighted' ? 'Continue →' : 'Create class →'}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
            {categories.map((cat, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => {
                    const updated = [...categories];
                    updated[i] = { ...updated[i], name: e.target.value };
                    setCategories(updated);
                  }}
                  placeholder="Category name"
                  className="flex-1 px-3 py-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--bg-raised)] text-[13px] outline-none focus:border-[var(--accent)] transition-colors"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={cat.weight}
                    onChange={(e) => {
                      const updated = [...categories];
                      updated[i] = { ...updated[i], weight: e.target.value };
                      setCategories(updated);
                    }}
                    min="0"
                    max="200"
                    placeholder="0"
                    className="w-16 px-2 py-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--bg-raised)] text-[13px] text-right outline-none focus:border-[var(--accent)] transition-colors"
                  />
                  <span className="text-[12px] text-[var(--text-tertiary)]">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCategories(categories.filter((_, j) => j !== i))}
                  className="w-6 h-6 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCategories([...categories, { name: '', weight: '0' }])}
            className="text-[12px] text-[var(--accent)] hover:opacity-80 transition-opacity text-left"
          >
            + Add category
          </button>

          {/* Weight total */}
          <div className={`flex items-center gap-2 text-[12px] px-3 py-2 rounded-[6px] ${weightOk ? 'bg-[var(--success-muted)] text-[var(--success)]' : 'bg-[var(--warning-muted)] text-[var(--warning)]'}`}>
            <span>Weights total: {weightSum.toFixed(weightSum % 1 === 0 ? 0 : 1)}%</span>
            {weightOk ? (
              <span>✓</span>
            ) : (
              <span>— will be auto-normalized to 100%</span>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={categories.filter((c) => c.name.trim()).length === 0}
              className="px-4 py-2 bg-[var(--accent)] text-white text-[13px] font-medium rounded-[6px] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              Create class →
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
