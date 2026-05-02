import { useState } from 'react';
import type { Semester, CourseEntry } from '../../models/gpa';
import type { LetterGrade } from '../../models/gradeRecovery';
import { CourseRow } from './CourseRow';
import { AddCourseRow } from './AddCourseRow';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { roundGPA, gpaColor } from '../../lib/gpaCalculator';
import type { GPAImpactEntry } from '../../models/gpa';

interface SemesterSectionProps {
  semester: Semester;
  semesterGPA: number | null;
  weightedSemesterGPA: number | null;
  cumulativeGPA: number | null;
  scenarioMode: boolean;
  impactMap: Record<string, GPAImpactEntry>;
  onUpdateCourse: (courseId: string, patch: Partial<CourseEntry>) => void;
  onDeleteCourse: (courseId: string) => void;
  onAddCourse: (name: string, grade: LetterGrade | null, credits: number, weighted: boolean) => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  preExpanded?: boolean;
}

export function SemesterSection({
  semester,
  semesterGPA,
  weightedSemesterGPA,
  cumulativeGPA,
  scenarioMode,
  impactMap,
  onUpdateCourse,
  onDeleteCourse,
  onAddCourse,
  onDelete,
  onRename,
  preExpanded = true,
}: SemesterSectionProps) {
  const [expanded, setExpanded] = useState(preExpanded);
  const [addingCourse, setAddingCourse] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(semester.name);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const uwGPA = roundGPA(semesterGPA);
  const wGPA = roundGPA(weightedSemesterGPA);
  const totalCredits = semester.courses.reduce((s, c) => s + c.creditHours, 0);

  return (
    <div className="border border-[var(--border)] rounded-[8px] overflow-hidden mb-3 last:mb-0">
      {/* ── Semester header ─────────────────────────────────────────────── */}
      {/* `group` here makes group-hover work on the delete button */}
      <div
        className="group flex items-center justify-between px-4 py-3 bg-[var(--bg-surface)] cursor-pointer hover:bg-[var(--bg-hover)] transition-colors select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3">
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            className={`shrink-0 text-[var(--text-tertiary)] transition-transform ${expanded ? '' : '-rotate-90'}`}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>

          {editingName ? (
            <input
              autoFocus
              type="text"
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={() => {
                if (nameVal.trim()) onRename(nameVal.trim());
                setEditingName(false);
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  if (nameVal.trim()) onRename(nameVal.trim());
                  setEditingName(false);
                }
                if (e.key === 'Escape') setEditingName(false);
              }}
              className="text-[14px] font-semibold text-[var(--text-primary)] bg-transparent border-b border-[var(--accent)] outline-none"
            />
          ) : (
            <span
              className="text-[14px] font-semibold text-[var(--text-primary)] tracking-tight"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingName(true);
              }}
            >
              {semester.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Unweighted GPA */}
          {uwGPA !== null && (
            <span className="text-[12px] text-[var(--text-secondary)]">
              U:{' '}
              <span className={`font-semibold tabular-nums ${gpaColor(uwGPA)}`}>
                {uwGPA.toFixed(2)}
              </span>
            </span>
          )}
          {/* Weighted GPA (only if it differs from unweighted) */}
          {wGPA !== null && uwGPA !== null && Math.abs(wGPA - uwGPA) > 0.005 && (
            <span className="text-[12px] text-[var(--text-secondary)]">
              W:{' '}
              <span className={`font-semibold tabular-nums ${gpaColor(wGPA)}`}>
                {wGPA.toFixed(2)}
              </span>
            </span>
          )}
          <span className="text-[12px] text-[var(--text-tertiary)] tabular-nums">
            {totalCredits} cr
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirm(true);
            }}
            className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-all"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Course table ─────────────────────────────────────────────────── */}
      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-raised)]">
                <th className="text-left py-2 px-4 text-[11px] font-medium text-[var(--text-tertiary)]">Course</th>
                <th className="text-left py-2 px-2 text-[11px] font-medium text-[var(--text-tertiary)]">Grade</th>
                {scenarioMode && (
                  <th className="text-left py-2 px-2 text-[11px] font-medium text-[var(--accent)]">
                    → Scenario
                  </th>
                )}
                <th className="text-right py-2 px-2 text-[11px] font-medium text-[var(--text-tertiary)] w-16">Credits</th>
                <th className="hidden sm:table-cell text-right py-2 px-2 text-[11px] font-medium text-[var(--text-tertiary)] w-14">QP</th>
                <th className="hidden sm:table-cell text-center py-2 px-2 text-[11px] font-medium text-[var(--text-tertiary)] w-12">Wt.</th>
                <th className="hidden sm:table-cell w-6" />
                <th className="w-6" />
              </tr>
            </thead>
            <tbody>
              {semester.courses.map((course) => (
                <CourseRow
                  key={course.id}
                  course={course}
                  onUpdate={(patch) => onUpdateCourse(course.id, patch)}
                  onDelete={() => onDeleteCourse(course.id)}
                  scenarioMode={scenarioMode}
                  cumulativeGPA={cumulativeGPA}
                  gpaWithout={impactMap[course.id]?.gpaWithoutThisCourse ?? null}
                />
              ))}
              {addingCourse && (
                <AddCourseRow
                  onAdd={(name, grade, credits, weighted) => {
                    onAddCourse(name, grade, credits, weighted);
                    setAddingCourse(false);
                  }}
                  onCancel={() => setAddingCourse(false)}
                  scenarioMode={scenarioMode}
                />
              )}
            </tbody>
          </table>

          <div className="px-4 py-2 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setAddingCourse(true)}
              className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
            >
              + Add course
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={onDelete}
        title={`Delete ${semester.name}?`}
        description="This will permanently remove the semester and all its courses."
        confirmLabel="Delete semester"
        destructive
      />
    </div>
  );
}
