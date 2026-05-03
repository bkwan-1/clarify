import type { CourseEntry, Semester, GPAImpactEntry } from '../models/gpa';

function effectiveGrade(course: CourseEntry, scenarioMode: boolean): number | null {
  if (scenarioMode && course.scenarioGrade !== null) return course.scenarioGrade;
  return course.gradePercent;
}

function isEligible(course: CourseEntry, scenarioMode: boolean): boolean {
  return (
    course.isIncludedInGPA &&
    course.creditHours > 0 &&
    effectiveGrade(course, scenarioMode) !== null
  );
}

export function computeSemesterAverage(
  semester: Semester,
  scenarioMode: boolean,
): number | null {
  const eligible = semester.courses.filter((c) => isEligible(c, scenarioMode));
  if (eligible.length === 0) return null;
  let totalWeighted = 0;
  let totalCr = 0;
  for (const c of eligible) {
    totalWeighted += effectiveGrade(c, scenarioMode)! * c.creditHours;
    totalCr += c.creditHours;
  }
  return totalCr > 0 ? totalWeighted / totalCr : null;
}

export interface CumulativeAverageResult {
  average: number | null;
  totalWeighted: number;
  totalCredits: number;
}

export function computeCumulativeAverage(
  semesters: Semester[],
  scenarioMode: boolean,
): CumulativeAverageResult {
  let totalWeighted = 0;
  let totalCr = 0;
  for (const sem of semesters) {
    for (const c of sem.courses) {
      if (!isEligible(c, scenarioMode)) continue;
      totalWeighted += effectiveGrade(c, scenarioMode)! * c.creditHours;
      totalCr += c.creditHours;
    }
  }
  return {
    average: totalCr > 0 ? totalWeighted / totalCr : null,
    totalWeighted,
    totalCredits: totalCr,
  };
}

export function computeImpactRanking(semesters: Semester[]): GPAImpactEntry[] {
  const { average: baseAvg, totalWeighted: baseWP, totalCredits: baseCr } =
    computeCumulativeAverage(semesters, false);

  if (baseAvg === null || baseCr === 0) return [];

  const results: Omit<GPAImpactEntry, 'rankPosition'>[] = [];

  for (const sem of semesters) {
    for (const c of sem.courses) {
      if (!isEligible(c, false)) continue;
      const wp_i = c.gradePercent! * c.creditHours;
      const remainingCr = baseCr - c.creditHours;
      if (remainingCr <= 0) continue;
      const avgWithout = (baseWP - wp_i) / remainingCr;
      const delta = baseAvg - avgWithout;

      results.push({
        courseId: c.id,
        courseName: c.name,
        semesterId: sem.id,
        semesterName: sem.name,
        currentGrade: c.gradePercent!,
        averageWithoutThisCourse: avgWithout,
        averageImpactDelta: delta,
      });
    }
  }

  results.sort((a, b) => a.averageImpactDelta - b.averageImpactDelta);
  return results.map((r, i) => ({ ...r, rankPosition: i + 1 }));
}

export function semesterNameFromDate(date = new Date()): string {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  if (month >= 8) return `Fall ${year}`;
  if (month >= 6) return `Summer ${year}`;
  return `Spring ${year}`;
}

export function gradeColor(pct: number | null): string {
  if (pct === null) return 'text-[var(--text-secondary)]';
  if (pct >= 90) return 'text-[var(--success)]';
  if (pct >= 80) return 'text-[var(--accent)]';
  if (pct >= 70) return 'text-[var(--warning)]';
  return 'text-[var(--danger)]';
}

// Alias kept for components that import gpaColor
export { gradeColor as gpaColor };

export function roundGPA(val: number | null, digits = 1): number | null {
  if (val === null) return null;
  return Math.round(val * 10 ** digits) / 10 ** digits;
}
