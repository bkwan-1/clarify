import { useState, useEffect, useMemo } from 'react';
import { GPASummaryBar } from './GPASummaryBar';
import { SemesterSection } from './SemesterSection';
import { ImpactRankingPanel } from './ImpactRankingPanel';
import { EmptyState } from '../shared/EmptyState';
import { useGPATracker } from '../../hooks/useGPATracker';
import { semesterNameFromDate, computeCumulativeAverage } from '../../lib/gpaCalculator';
import type { GPAImpactEntry } from '../../models/gpa';

interface GPATrackerPageProps {
  pendingHandoff?: { courseName: string; gradePercent: number } | null;
  onHandoffConsumed?: () => void;
}

export function GPATrackerPage({ pendingHandoff, onHandoffConsumed }: GPATrackerPageProps) {
  const {
    record,
    semesters,
    scenarioMode,
    averageGrade,
    totalCredits,
    impactRanking,
    semesterAverages,
    addSemester,
    deleteSemester,
    renameSemester,
    addCourse,
    updateCourse,
    deleteCourse,
    toggleScenarioMode,
    setScenarioGrade,
    applyScenarioAsActual,
    resetScenarios,
    injectHandoffCourse,
  } = useGPATracker();

  const [addingSemester, setAddingSemester] = useState(false);
  const [newSemName, setNewSemName] = useState('');

  // Build impact map for fast CourseRow lookup
  const impactMap: Record<string, GPAImpactEntry> = {};
  for (const entry of impactRanking) {
    impactMap[entry.courseId] = entry;
  }

  // "Actual" (non-scenario) average, only when scenario is active
  const actualAverage = useMemo(
    () =>
      scenarioMode
        ? computeCumulativeAverage(record.semesters, false).average
        : null,
    [scenarioMode, record],
  );

  // Best-case: all in-progress (null gradePercent) courses → 100%
  const bestCaseAverage = useMemo(() => {
    if (!scenarioMode) return null;
    const bestSemesters = record.semesters.map((sem) => ({
      ...sem,
      courses: sem.courses.map((c) => ({
        ...c,
        scenarioGrade:
          c.gradePercent === null ? 100 : (c.scenarioGrade ?? c.gradePercent),
      })),
    }));
    return computeCumulativeAverage(bestSemesters, true).average;
  }, [scenarioMode, record]);

  // ── Handoff from Tool 1 ─────────────────────────────────────────────────
  useEffect(() => {
    if (!pendingHandoff) return;
    const targetId =
      semesters.length === 0 ? addSemester() : semesters[0].id;
    injectHandoffCourse(targetId, pendingHandoff.courseName, pendingHandoff.gradePercent);
    onHandoffConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingHandoff]);

  function handleAddSemester() {
    const name = newSemName.trim() || semesterNameFromDate();
    addSemester(name);
    setNewSemName('');
    setAddingSemester(false);
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* ── Top bar: average summary + scenario controls ───────────────── */}
      <GPASummaryBar
        averageGrade={averageGrade}
        actualAverage={actualAverage}
        bestCaseAverage={bestCaseAverage}
        totalCredits={totalCredits}
        semesterCount={semesters.length}
        scenarioMode={scenarioMode}
        onToggleScenario={toggleScenarioMode}
        onApplyScenario={applyScenarioAsActual}
        onResetScenarios={resetScenarios}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Main column: semester sections ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5">
          {semesters.length === 0 ? (
            <EmptyState
              title="No semesters yet"
              description="Add your first semester to start tracking your grades."
              action={
                <button
                  type="button"
                  onClick={() => addSemester()}
                  className="px-4 py-2 bg-[var(--accent)] text-white text-[13px] font-medium rounded-[8px] hover:opacity-90 transition-opacity"
                >
                  + Add your first semester
                </button>
              }
            />
          ) : (
            <div className="max-w-3xl mx-auto">
              {semesters.map((sem, i) => {
                const avgData = semesterAverages.find((g) => g.id === sem.id);
                return (
                  <SemesterSection
                    key={sem.id}
                    semester={sem}
                    semesterAverage={avgData?.average ?? null}
                    scenarioMode={scenarioMode}
                    impactMap={impactMap}
                    onUpdateCourse={(courseId, patch) => updateCourse(sem.id, courseId, patch)}
                    onDeleteCourse={(courseId) => deleteCourse(sem.id, courseId)}
                    onAddCourse={(name, grade, credits) => {
                      const cid = addCourse(sem.id, {
                        name,
                        gradePercent: grade,
                        creditHours: credits,
                      });
                      if (scenarioMode && grade !== null) {
                        setScenarioGrade(sem.id, cid, grade);
                      }
                    }}
                    onDelete={() => deleteSemester(sem.id)}
                    onRename={(name) => renameSemester(sem.id, name)}
                    preExpanded={i === 0}
                  />
                );
              })}
            </div>
          )}

          {/* Add semester */}
          <div className="max-w-3xl mx-auto mt-4">
            {addingSemester ? (
              <div className="flex items-center gap-2 p-3 rounded-[8px] border border-dashed border-[var(--accent)] bg-[var(--accent-muted)]">
                <input
                  type="text"
                  value={newSemName}
                  onChange={(e) => setNewSemName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSemester();
                    if (e.key === 'Escape') setAddingSemester(false);
                  }}
                  placeholder={semesterNameFromDate()}
                  autoFocus
                  className="flex-1 bg-transparent text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                />
                <button
                  type="button"
                  onClick={handleAddSemester}
                  className="px-3 py-1.5 bg-[var(--accent)] text-white text-[12px] font-medium rounded-[6px] hover:opacity-90"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setAddingSemester(false)}
                  className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingSemester(true)}
                className="w-full py-3 rounded-[8px] border border-dashed border-[var(--border)] text-[12px] text-[var(--text-tertiary)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-muted)] transition-all"
              >
                + Add semester
              </button>
            )}
          </div>
        </div>

        {/* ── Right sidebar: impact ranking (desktop only) ─────────────────── */}
        {semesters.length > 0 && (
          <div className="hidden lg:flex w-[260px] shrink-0 border-l border-[var(--border)]">
            <ImpactRankingPanel
              ranking={impactRanking}
              semesters={semesters}
              currentAverage={averageGrade}
              totalCredits={totalCredits}
            />
          </div>
        )}
      </div>
    </div>
  );
}
