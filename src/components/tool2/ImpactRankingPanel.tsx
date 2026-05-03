import type { GPAImpactEntry, Semester } from '../../models/gpa';
import { roundGPA, gradeColor } from '../../lib/gpaCalculator';

interface ImpactRankingPanelProps {
  ranking: GPAImpactEntry[];
  semesters: Semester[];
  currentAverage: number | null;
  totalCredits: number;
}

function buildCreditMap(semesters: Semester[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const sem of semesters) {
    for (const c of sem.courses) {
      map.set(c.id, c.creditHours);
    }
  }
  return map;
}

// What would the average be if this course got 100%?
function avgIf100(
  entry: GPAImpactEntry,
  creditHours: number,
  totalCredits: number,
): number | null {
  if (totalCredits === 0) return null;
  const remainingCr = totalCredits - creditHours;
  const wpWithout = entry.averageWithoutThisCourse * remainingCr;
  return (wpWithout + 100 * creditHours) / totalCredits;
}

function ImpactRow({
  entry,
  rank,
  creditHours,
  currentAverage,
  totalCredits,
  variant,
}: {
  entry: GPAImpactEntry;
  rank: number;
  creditHours: number;
  currentAverage: number;
  totalCredits: number;
  variant: 'dragging' | 'helping';
}) {
  const newAvg = avgIf100(entry, creditHours, totalCredits);
  const deltaIf100 = newAvg !== null ? newAvg - currentAverage : null;

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
            className={`text-[11px] font-semibold shrink-0 tabular-nums ${gradeColor(entry.currentGrade)}`}
          >
            {entry.currentGrade.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] text-[var(--text-tertiary)]">{entry.semesterName}</span>
          {deltaIf100 !== null && variant === 'dragging' && (
            <span className="text-[10px] font-medium text-[var(--success)] tabular-nums">
              +{roundGPA(deltaIf100, 1)?.toFixed(1)}% if 100
            </span>
          )}
          {variant === 'helping' && (
            <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">
              +{Math.abs(entry.averageImpactDelta).toFixed(1)}% above avg
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ImpactRankingPanel({
  ranking,
  semesters,
  currentAverage,
  totalCredits,
}: ImpactRankingPanelProps) {
  const creditMap = buildCreditMap(semesters);

  const dragging = ranking.filter((e) => e.averageImpactDelta < -0.05);
  const helping = [...ranking].reverse().filter((e) => e.averageImpactDelta > 0.05);

  const isEmpty = currentAverage === null || ranking.length === 0;

  return (
    <aside className="flex flex-col h-full overflow-y-auto w-full">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
          Grade Impact
        </p>
        <p className="text-[11px] text-[var(--text-secondary)]">Where to focus your effort</p>
      </div>

      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-[12px] text-[var(--text-tertiary)] text-center">
            Add courses with grades to see their impact on your average.
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
                    Dragging average down
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
                  const credits = creditMap.get(entry.courseId);
                  if (credits === undefined || currentAverage === null) return null;
                  return (
                    <ImpactRow
                      key={entry.courseId}
                      entry={entry}
                      rank={i + 1}
                      creditHours={credits}
                      currentAverage={currentAverage}
                      totalCredits={totalCredits}
                      variant="dragging"
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-[var(--text-secondary)]">
                Every course is helping your average. Nice work.
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
                  Propping average up
                </p>
              </div>
              <div>
                {helping.slice(0, 4).map((entry, i) => {
                  const credits = creditMap.get(entry.courseId);
                  if (credits === undefined || currentAverage === null) return null;
                  return (
                    <ImpactRow
                      key={entry.courseId}
                      entry={entry}
                      rank={i + 1}
                      creditHours={credits}
                      currentAverage={currentAverage}
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
