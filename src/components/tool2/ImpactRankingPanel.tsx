import type { GPAImpactEntry, Semester, CourseWeight } from '../../models/gpa';
import { computeWeightedGradePoints, roundGPA } from '../../lib/gpaCalculator';

interface ImpactRankingPanelProps {
  ranking: GPAImpactEntry[];
  semesters: Semester[];
  currentGPA: number | null;
  totalCredits: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type CourseInfo = { creditHours: number; courseWeight: CourseWeight };

function buildCourseMap(semesters: Semester[]): Map<string, CourseInfo> {
  const map = new Map<string, CourseInfo>();
  for (const sem of semesters) {
    for (const c of sem.courses) {
      map.set(c.id, { creditHours: c.creditHours, courseWeight: c.courseWeight });
    }
  }
  return map;
}

function gpaIfGrade(
  entry: GPAImpactEntry,
  gradePoints: number,
  totalCredits: number,
  course: CourseInfo,
): number | null {
  if (totalCredits === 0) return null;
  const qpWithout = entry.gpaWithoutThisCourse * (totalCredits - course.creditHours);
  return (qpWithout + gradePoints * course.creditHours) / totalCredits;
}

// ---------------------------------------------------------------------------
// Row sub-component
// ---------------------------------------------------------------------------

function ImpactRow({
  entry,
  rank,
  course,
  currentGPA,
  totalCredits,
  variant,
}: {
  entry: GPAImpactEntry;
  rank: number;
  course: CourseInfo;
  currentGPA: number;
  totalCredits: number;
  variant: 'dragging' | 'helping';
}) {
  const gpIfA = computeWeightedGradePoints('A', course.courseWeight);
  const newGPA = gpaIfGrade(entry, gpIfA, totalCredits, course);
  const deltaIfA = newGPA !== null ? newGPA - currentGPA : null;

  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-[var(--border-subtle)] last:border-0">
      <span className="text-[11px] font-bold text-[var(--text-tertiary)] w-4 shrink-0 mt-0.5 tabular-nums">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-[12px] font-medium text-[var(--text-primary)] truncate">
            {entry.courseName || 'Unnamed course'}
          </span>
          <span
            className={`text-[11px] font-semibold shrink-0 tabular-nums ${
              variant === 'dragging' ? 'text-[var(--danger)]' : 'text-[var(--success)]'
            }`}
          >
            {entry.currentGrade}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] text-[var(--text-tertiary)]">{entry.semesterName}</span>
          {deltaIfA !== null && variant === 'dragging' && (
            <span className="text-[10px] font-medium text-[var(--success)] tabular-nums">
              +{roundGPA(deltaIfA, 2)?.toFixed(2)} if A
            </span>
          )}
          {variant === 'helping' && (
            <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">
              +{Math.abs(entry.gpaImpactDelta).toFixed(2)} above avg
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export function ImpactRankingPanel({
  ranking,
  semesters,
  currentGPA,
  totalCredits,
}: ImpactRankingPanelProps) {
  const courseMap = buildCourseMap(semesters);

  // Courses with negative delta drag the GPA down (sorted worst-first already)
  const dragging = ranking.filter((e) => e.gpaImpactDelta < -0.005);
  // Courses with positive delta are propping it up; reverse to show best helpers first
  const helping = [...ranking].reverse().filter((e) => e.gpaImpactDelta > 0.005);

  const isEmpty = currentGPA === null || ranking.length === 0;

  return (
    <aside className="flex flex-col h-full overflow-y-auto w-full">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
          GPA Impact
        </p>
        <p className="text-[11px] text-[var(--text-secondary)]">Where to focus your effort</p>
      </div>

      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-[12px] text-[var(--text-tertiary)] text-center">
            Add courses with grades to see their impact on your GPA.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">

          {/* Dragging section */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              {dragging.length > 0 ? (
                <>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-[var(--danger)] shrink-0">
                    <path d="M5 1v8M2 6l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-[10px] font-semibold text-[var(--danger)] uppercase tracking-wider">
                    Dragging GPA down
                  </p>
                </>
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-[var(--success)] shrink-0">
                    <path d="M2 5l3 3 5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-[10px] font-semibold text-[var(--success)] uppercase tracking-wider">
                    All courses above average
                  </p>
                </>
              )}
            </div>

            {dragging.length > 0 ? (
              <div>
                {dragging.slice(0, 6).map((entry, i) => {
                  const course = courseMap.get(entry.courseId);
                  if (!course || currentGPA === null) return null;
                  return (
                    <ImpactRow
                      key={entry.courseId}
                      entry={entry}
                      rank={i + 1}
                      course={course}
                      currentGPA={currentGPA}
                      totalCredits={totalCredits}
                      variant="dragging"
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-[var(--text-secondary)]">
                Every course is helping your GPA. Nice work.
              </p>
            )}
          </div>

          {/* Helping section */}
          {helping.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-[var(--success)] shrink-0">
                  <path d="M5 9V1M2 4l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-[10px] font-semibold text-[var(--success)] uppercase tracking-wider">
                  Propping GPA up
                </p>
              </div>
              <div>
                {helping.slice(0, 4).map((entry, i) => {
                  const course = courseMap.get(entry.courseId);
                  if (!course || currentGPA === null) return null;
                  return (
                    <ImpactRow
                      key={entry.courseId}
                      entry={entry}
                      rank={i + 1}
                      course={course}
                      currentGPA={currentGPA}
                      totalCredits={totalCredits}
                      variant="helping"
                    />
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </aside>
  );
}
