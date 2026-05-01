import type {
  CourseEntry,
  Semester,
  StudentGPARecord,
  GPAImpactEntry,
  WeightedScale,
} from '../models/gpa';
import { STANDARD_GRADE_POINTS, WEIGHT_BONUS } from '../models/gpa';
import type { LetterGrade } from '../models/gradeRecovery';

export function computeWeightedGradePoints(
  grade: LetterGrade,
  courseWeight: CourseEntry['courseWeight'],
  scale: WeightedScale = 'plus-half',
): number {
  const base = STANDARD_GRADE_POINTS[grade];
  if (base === 0) return 0; // no bonus for F
  const bonus = WEIGHT_BONUS[courseWeight];
  if (scale === 'plus-half') {
    return Math.min(base + bonus, 5.0);
  }
  // five-point: AP/IB A = 5.0; otherwise standard
  if (courseWeight === 'AP' || courseWeight === 'IB' || courseWeight === 'college') {
    return Math.min(base + 1.0, 5.0);
  }
  return Math.min(base + bonus, 5.0);
}

function effectiveGrade(course: CourseEntry, scenarioMode: boolean): LetterGrade | null {
  if (scenarioMode && course.scenarioGrade) return course.scenarioGrade;
  return course.letterGrade;
}

function isEligible(course: CourseEntry, scenarioMode: boolean): boolean {
  return (
    course.isIncludedInGPA &&
    course.creditHours > 0 &&
    effectiveGrade(course, scenarioMode) !== null
  );
}

export function computeSemesterGPA(
  semester: Semester,
  useWeighted: boolean,
  scenarioMode: boolean,
  scale: WeightedScale = 'plus-half',
): number | null {
  const eligible = semester.courses.filter((c) => isEligible(c, scenarioMode));
  if (eligible.length === 0) return null;

  let totalQP = 0;
  let totalCr = 0;
  for (const c of eligible) {
    const grade = effectiveGrade(c, scenarioMode)!;
    const gp = useWeighted
      ? computeWeightedGradePoints(grade, c.courseWeight, scale)
      : STANDARD_GRADE_POINTS[grade];
    totalQP += gp * c.creditHours;
    totalCr += c.creditHours;
  }
  return totalCr > 0 ? totalQP / totalCr : null;
}

export interface CumulativeGPAResult {
  gpa: number | null;
  totalQualityPoints: number;
  totalCredits: number;
}

export function computeCumulativeGPA(
  semesters: Semester[],
  useWeighted: boolean,
  scenarioMode: boolean,
  scale: WeightedScale = 'plus-half',
): CumulativeGPAResult {
  let totalQP = 0;
  let totalCr = 0;

  for (const sem of semesters) {
    for (const c of sem.courses) {
      if (!isEligible(c, scenarioMode)) continue;
      const grade = effectiveGrade(c, scenarioMode)!;
      const gp = useWeighted
        ? computeWeightedGradePoints(grade, c.courseWeight, scale)
        : STANDARD_GRADE_POINTS[grade];
      totalQP += gp * c.creditHours;
      totalCr += c.creditHours;
    }
  }

  return {
    gpa: totalCr > 0 ? totalQP / totalCr : null,
    totalQualityPoints: totalQP,
    totalCredits: totalCr,
  };
}

export function computeGPAImpactRanking(
  semesters: Semester[],
  useWeighted: boolean,
  scale: WeightedScale = 'plus-half',
): GPAImpactEntry[] {
  const { gpa: baseGPA, totalQualityPoints: baseQP, totalCredits: baseCr } =
    computeCumulativeGPA(semesters, useWeighted, false, scale);

  if (baseGPA === null || baseCr === 0) return [];

  const results: Omit<GPAImpactEntry, 'rankPosition'>[] = [];

  for (const sem of semesters) {
    for (const c of sem.courses) {
      if (!isEligible(c, false)) continue;
      const grade = c.letterGrade!;
      const gp = useWeighted
        ? computeWeightedGradePoints(grade, c.courseWeight, scale)
        : STANDARD_GRADE_POINTS[grade];
      const qp_i = gp * c.creditHours;
      const cr_i = c.creditHours;

      const remainingCr = baseCr - cr_i;
      if (remainingCr <= 0) continue;
      const gpaWithout = (baseQP - qp_i) / remainingCr;
      const delta = baseGPA - gpaWithout;

      results.push({
        courseId: c.id,
        courseName: c.name,
        semesterId: sem.id,
        semesterName: sem.name,
        currentGrade: grade,
        currentGradePoints: STANDARD_GRADE_POINTS[grade],
        gpaWithoutThisCourse: gpaWithout,
        gpaImpactDelta: delta,
      });
    }
  }

  results.sort((a, b) => a.gpaImpactDelta - b.gpaImpactDelta);
  return results.map((r, i) => ({ ...r, rankPosition: i + 1 }));
}

export function computeO1ScenarioUpdate(
  oldTotalQP: number,
  oldQP_i: number,
  newQP_i: number,
  totalCr: number,
): number | null {
  if (totalCr <= 0) return null;
  return (oldTotalQP - oldQP_i + newQP_i) / totalCr;
}

export function roundGPA(gpa: number | null, digits = 2): number | null {
  if (gpa === null) return null;
  return Math.round(gpa * 10 ** digits) / 10 ** digits;
}

export function semesterNameFromDate(date = new Date()): string {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  if (month >= 8) return `Fall ${year}`;
  if (month >= 6) return `Summer ${year}`;
  return `Spring ${year}`;
}

export function gpaColor(gpa: number | null): string {
  if (gpa === null) return 'text-[var(--text-secondary)]';
  if (gpa >= 3.5) return 'text-[var(--success)]';
  if (gpa >= 3.0) return 'text-[var(--accent)]';
  if (gpa >= 2.0) return 'text-[var(--warning)]';
  return 'text-[var(--danger)]';
}

export function gradeColor(pct: number | null): string {
  if (pct === null) return 'text-[var(--text-secondary)]';
  if (pct >= 90) return 'text-[var(--success)]';
  if (pct >= 80) return 'text-[var(--accent)]';
  if (pct >= 70) return 'text-[var(--warning)]';
  return 'text-[var(--danger)]';
}

export function gradeRecoveryRecord(record: StudentGPARecord) {
  return record;
}
