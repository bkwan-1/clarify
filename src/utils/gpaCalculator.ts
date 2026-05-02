/**
 * gpaCalculator.ts
 *
 * Standalone GPA math. All functions accept plain objects and have no
 * dependency on the app's persisted data models.
 *
 * GPA formula
 * -----------
 * GPA = Σ(gradePoints_i × credits_i) / Σ(credits_i)
 *
 * Quality points (QP) are grade points × credits. Cumulative GPA pools QP and
 * credits across all semesters — it does NOT average semester GPAs, which
 * would produce wrong results when credit loads differ between semesters.
 *
 * Weighted courses
 * ----------------
 * When weighted=true, bonus points are added per course type before the QP
 * product, capped at 5.0:
 *   standard: +0   honors: +0.5   AP / IB: +1.0
 *
 * 4.0 scale note: A+ = 4.0 (not 4.3). Many universities use this cap.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type LetterGrade =
  | 'A+' | 'A' | 'A-'
  | 'B+' | 'B' | 'B-'
  | 'C+' | 'C' | 'C-'
  | 'D+' | 'D' | 'D-'
  | 'F';

export type CourseWeight = 'standard' | 'honors' | 'AP' | 'IB';

export interface ClassEntry {
  id?: string;
  name: string;
  /** Null means the course is in-progress and is excluded from GPA. */
  letterGrade: LetterGrade | null;
  credits: number;
  /** Defaults to 'standard'. Only matters when weighted=true. */
  weight?: CourseWeight;
  /**
   * Set to false to exclude this course (e.g. pass/fail, audit, transferred
   * credit that shouldn't count here). Defaults to true.
   */
  includeInGPA?: boolean;
}

export interface Semester {
  id?: string;
  name: string;
  classes: ClassEntry[];
}

// ---------------------------------------------------------------------------
// Grade-point tables
// ---------------------------------------------------------------------------

/**
 * Standard 4.0 grade-point values.
 * A+ is capped at 4.0 (not 4.3) — the most common university policy.
 */
export const GRADE_POINTS: Record<LetterGrade, number> = {
  'A+': 4.0,
  'A':  4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B':  3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C':  2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D':  1.0,
  'D-': 0.7,
  'F':  0.0,
};

const WEIGHT_BONUS: Record<CourseWeight, number> = {
  standard: 0.0,
  honors:   0.5,
  AP:       1.0,
  IB:       1.0,
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isEligible(cls: ClassEntry): boolean {
  return (
    cls.letterGrade !== null &&
    cls.credits > 0 &&
    (cls.includeInGPA ?? true)
  );
}

/**
 * Returns grade points for a course, applying a weight bonus when requested.
 * Bonus is capped at 5.0; F always stays at 0.0 (no bonus for failing).
 */
function gradePoints(cls: ClassEntry, weighted: boolean): number {
  const base = GRADE_POINTS[cls.letterGrade!];
  if (!weighted || base === 0) return base;
  const bonus = WEIGHT_BONUS[cls.weight ?? 'standard'];
  return Math.min(base + bonus, 5.0);
}

// ---------------------------------------------------------------------------
// calculateGPA
// ---------------------------------------------------------------------------

export interface GPAResult {
  /** Null when no eligible courses exist. */
  gpa: number | null;
  totalQualityPoints: number;
  totalCredits: number;
}

/**
 * Computes the GPA for a flat list of courses (single semester or ad-hoc group).
 *
 * Courses with null grades, 0 credits, or includeInGPA=false are silently skipped.
 *
 * @param classes  - Array of course entries.
 * @param weighted - When true, adds honors/AP/IB bonus points (default false).
 */
export function calculateGPA(classes: ClassEntry[], weighted = false): GPAResult {
  const eligible = classes.filter(isEligible);
  if (eligible.length === 0) {
    return { gpa: null, totalQualityPoints: 0, totalCredits: 0 };
  }

  let totalQP = 0;
  let totalCr = 0;

  for (const cls of eligible) {
    totalQP += gradePoints(cls, weighted) * cls.credits;
    totalCr += cls.credits;
  }

  return {
    gpa: totalCr > 0 ? totalQP / totalCr : null,
    totalQualityPoints: totalQP,
    totalCredits: totalCr,
  };
}

// ---------------------------------------------------------------------------
// calculateCumulativeGPA
// ---------------------------------------------------------------------------

export interface SemesterBreakdown {
  name: string;
  gpa: number | null;
  credits: number;
}

export interface CumulativeGPAResult extends GPAResult {
  semesterBreakdown: SemesterBreakdown[];
}

/**
 * Computes the cumulative GPA across multiple semesters.
 *
 * Implementation pools all quality points and credits together rather than
 * averaging semester GPAs. Averaging semester GPAs gives wrong results when
 * credit loads differ — a 6-credit semester counts the same as an 18-credit
 * semester in a simple average, but should count 3× as much in a real GPA.
 *
 * Example showing why pooling matters:
 *   Semester 1: A in 15 credits (all 4.0) → GPA 4.0, 60 QP
 *   Semester 2: C in 3 credits (2.0)      → GPA 2.0,  6 QP
 *   Correct cumulative = 66 QP / 18 cr = 3.67
 *   Wrong (averaged)   = (4.0 + 2.0) / 2  = 3.00
 *
 * @param semesters - Academic history, ordered however is convenient.
 * @param weighted  - Whether to apply honors/AP/IB bonus (default false).
 */
export function calculateCumulativeGPA(
  semesters: Semester[],
  weighted = false,
): CumulativeGPAResult {
  let totalQP = 0;
  let totalCr = 0;
  const semesterBreakdown: SemesterBreakdown[] = [];

  for (const sem of semesters) {
    const { gpa, totalQualityPoints, totalCredits } = calculateGPA(sem.classes, weighted);
    semesterBreakdown.push({ name: sem.name, gpa, credits: totalCredits });
    totalQP += totalQualityPoints;
    totalCr += totalCredits;
  }

  return {
    gpa: totalCr > 0 ? totalQP / totalCr : null,
    totalQualityPoints: totalQP,
    totalCredits: totalCr,
    semesterBreakdown,
  };
}

// ---------------------------------------------------------------------------
// getClassImpactRanking
// ---------------------------------------------------------------------------

export interface ImpactEntry {
  classId: string | undefined;
  className: string;
  semesterName: string;
  currentGrade: LetterGrade;
  currentGradePoints: number;
  /**
   * What the cumulative GPA would be if this class were removed from the record.
   * Null when removing this class would leave no other graded credits.
   */
  gpaWithoutThisClass: number | null;
  /**
   * currentCumulativeGPA − gpaWithoutThisClass.
   *
   * Negative → this class is below the overall average, dragging the GPA down.
   * Positive → this class is above the overall average, propping the GPA up.
   *
   * Rank 1 = most negative delta = highest leverage to improve.
   */
  gpaImpactDelta: number;
  rankPosition: number;
}

/**
 * Ranks every graded class by how much its grade is affecting the cumulative GPA.
 *
 * Classes with the most negative delta are pulling the GPA down the most — they
 * are the highest-priority targets for grade improvement or retaking.
 *
 * Algorithm (O(n) per class, O(n²) total):
 *   gpaWithout_i = (totalQP − qp_i) / (totalCr − cr_i)
 *   delta_i = cumulativeGPA − gpaWithout_i
 *
 * @param semesters - Full academic history.
 * @param weighted  - Whether to apply honors/AP/IB bonus points.
 */
export function getClassImpactRanking(
  semesters: Semester[],
  weighted = false,
): ImpactEntry[] {
  const { gpa: baseGPA, totalQualityPoints: baseQP, totalCredits: baseCr } =
    calculateCumulativeGPA(semesters, weighted);

  if (baseGPA === null || baseCr === 0) return [];

  const entries: Omit<ImpactEntry, 'rankPosition'>[] = [];

  for (const sem of semesters) {
    for (const cls of sem.classes) {
      if (!isEligible(cls)) continue;

      const gp = gradePoints(cls, weighted);
      const qp_i = gp * cls.credits;
      const remainingCr = baseCr - cls.credits;

      // Skip the only-course edge case: removing it leaves nothing to compute
      if (remainingCr <= 0) continue;

      const gpaWithout = (baseQP - qp_i) / remainingCr;
      const delta = baseGPA - gpaWithout;

      entries.push({
        classId: cls.id,
        className: cls.name,
        semesterName: sem.name,
        currentGrade: cls.letterGrade!,
        currentGradePoints: GRADE_POINTS[cls.letterGrade!],
        gpaWithoutThisClass: gpaWithout,
        gpaImpactDelta: delta,
      });
    }
  }

  // Sort ascending: most-negative delta (biggest drag) gets rank 1
  entries.sort((a, b) => a.gpaImpactDelta - b.gpaImpactDelta);
  return entries.map((e, i) => ({ ...e, rankPosition: i + 1 }));
}

// ---------------------------------------------------------------------------
// getScenarioGPA
// ---------------------------------------------------------------------------

export interface ScenarioGPAResult {
  /** New cumulative GPA after the hypothetical grade change. */
  newGPA: number | null;
  /** newGPA − currentGPA. Positive means the change helps. Null if either GPA is null. */
  gpaDelta: number | null;
  /** Cumulative GPA before any scenario change. */
  currentGPA: number | null;
}

/**
 * Returns the cumulative GPA that would result if one class's grade changed.
 *
 * Uses an O(1) update: subtract the original class's quality points, add the
 * new ones, and recompute the GPA without re-scanning all courses.
 *
 * Matching: the class is found by `id` if provided, otherwise by `name`. When
 * no match is found (the class is new / not yet in the record), the modified
 * class is treated as an additional course being added to the cumulative GPA.
 *
 * @param semesters     - Full academic history.
 * @param modifiedClass - The class with the hypothetical new `letterGrade`.
 * @param weighted      - Whether to apply honors/AP/IB bonus points.
 */
export function getScenarioGPA(
  semesters: Semester[],
  modifiedClass: ClassEntry,
  weighted = false,
): ScenarioGPAResult {
  const { gpa: currentGPA, totalQualityPoints: baseQP, totalCredits: baseCr } =
    calculateCumulativeGPA(semesters, weighted);

  // Find original class to remove its contribution
  let original: ClassEntry | null = null;
  outer: for (const sem of semesters) {
    for (const cls of sem.classes) {
      const byId = modifiedClass.id !== undefined && cls.id === modifiedClass.id;
      const byName = modifiedClass.id === undefined && cls.name === modifiedClass.name;
      if (byId || byName) {
        original = cls;
        break outer;
      }
    }
  }

  // Subtract original's contribution (0 if not found → treated as a new addition)
  const oldQP = original && isEligible(original) ? gradePoints(original, weighted) * original.credits : 0;
  const oldCr = original && isEligible(original) ? original.credits : 0;

  // Add modified class's contribution
  const newQP = isEligible(modifiedClass) ? gradePoints(modifiedClass, weighted) * modifiedClass.credits : 0;
  const newCr = isEligible(modifiedClass) ? modifiedClass.credits : 0;

  const updatedTotalQP = baseQP - oldQP + newQP;
  const updatedTotalCr = baseCr - oldCr + newCr;

  const newGPA = updatedTotalCr > 0 ? updatedTotalQP / updatedTotalCr : null;
  const gpaDelta =
    newGPA !== null && currentGPA !== null ? newGPA - currentGPA : null;

  return { newGPA, gpaDelta, currentGPA };
}
