/**
 * gradeCalculator.ts
 *
 * Standalone grade-recovery math. All functions operate on plain objects
 * with no dependency on the app's persisted data models, making them easy
 * to unit-test and reuse outside React.
 *
 * Core model
 * ----------
 * A class is broken into weighted Categories (e.g. Homework 40%, Exams 60%).
 * Each Category has Completed assignments (already graded) and Remaining ones
 * (upcoming, not yet scored). The key insight is that every "what do I need?"
 * question reduces to a single linear equation:
 *
 *   finalGrade = numeratorConstant·100 + remainingCoefficient·R
 *
 * where R is the unknown average on all remaining work. Solving for R gives
 * calculateNeeded. The maximum grade is at R = 100, which gives isTargetPossible.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface Assignment {
  /** Points earned. When mode is 'percentage', this is the raw % (0–110 allowed for EC). */
  earned: number;
  /** Total possible points. Ignored when mode is 'percentage'. */
  total: number;
  /** Defaults to 'points'. Use 'percentage' when the teacher reports a raw % instead. */
  mode?: 'points' | 'percentage';
  isExtraCredit?: boolean;
}

export interface RemainingWork {
  /** Point weight of this upcoming assignment within the category. */
  points: number;
  isExtraCredit?: boolean;
}

export interface Category {
  /** Human-readable name used as the map key in returned breakdowns. */
  name: string;
  /**
   * How much this category contributes to the final grade, e.g. 30 = 30%.
   * Weights do not need to sum to 100 — they are normalized automatically.
   */
  weight: number;
  completed: Assignment[];
  remaining: RemainingWork[];
  /**
   * Drop the N lowest-scoring completed assignments before any calculation.
   * At least one assignment is always kept even if dropLowest ≥ completed.length.
   */
  dropLowest?: number;
}

/** Standard minimum percentages for the four letter-grade scenarios. */
export type TargetGrade = 'A' | 'B' | 'C' | 'D';

const GRADE_THRESHOLDS: Record<TargetGrade, number> = {
  A: 93,
  B: 83,
  C: 73,
  D: 63,
};

const LETTER_CUTOFFS: Array<{ min: number; letter: string }> = [
  { min: 97, letter: 'A+' },
  { min: 93, letter: 'A' },
  { min: 90, letter: 'A-' },
  { min: 87, letter: 'B+' },
  { min: 83, letter: 'B' },
  { min: 80, letter: 'B-' },
  { min: 77, letter: 'C+' },
  { min: 73, letter: 'C' },
  { min: 70, letter: 'C-' },
  { min: 67, letter: 'D+' },
  { min: 63, letter: 'D' },
  { min: 60, letter: 'D-' },
  { min: 0, letter: 'F' },
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Returns a single assignment's percentage, or null if data is incomplete. */
function assignmentPct(a: Assignment): number | null {
  if (a.mode === 'percentage') return a.earned;
  if (!a.total || a.total === 0) return null;
  if (a.earned === undefined || a.earned === null) return null;
  return (a.earned / a.total) * 100;
}

interface CategoryState {
  pct: number | null;
  earnedAfterDrops: number;
  possibleAfterDrops: number;
}

/**
 * Applies drop-lowest and returns the aggregated earned/possible for a category.
 *
 * When all kept assignments use points mode, we aggregate earned and possible
 * points directly (preserves exact ratios). With mixed or percentage-only
 * assignments we fall back to a simple average of percentages and synthesize
 * equivalent point values for the coefficient math.
 */
function categoryState(cat: Category): CategoryState {
  const withPcts = cat.completed
    .map((a) => ({ ...a, pct: assignmentPct(a) }))
    .filter((a): a is Assignment & { pct: number } => a.pct !== null);

  if (withPcts.length === 0) {
    return { pct: null, earnedAfterDrops: 0, possibleAfterDrops: 0 };
  }

  const sorted = [...withPcts].sort((a, b) => a.pct - b.pct);
  const dropCount = Math.min(cat.dropLowest ?? 0, sorted.length - 1);
  const kept = sorted.slice(dropCount);

  const allPoints = kept.every((a) => !a.mode || a.mode === 'points');
  if (allPoints) {
    const earned = kept.reduce((s, a) => s + a.earned, 0);
    const possible = kept.reduce((s, a) => s + a.total, 0);
    return {
      pct: possible > 0 ? (earned / possible) * 100 : null,
      earnedAfterDrops: earned,
      possibleAfterDrops: possible,
    };
  }

  // Mixed or all-percentage: simple average, then synthesize point equivalents
  const avg = kept.reduce((s, a) => s + a.pct, 0) / kept.length;
  return {
    pct: avg,
    earnedAfterDrops: avg * kept.length,
    possibleAfterDrops: 100 * kept.length,
  };
}

/** Normalizes raw category weights so they sum to 100. */
function normalizeWeights(categories: Category[]): Record<string, number> {
  const rawSum = categories.reduce((s, c) => s + c.weight, 0);
  if (rawSum === 0) return Object.fromEntries(categories.map((c) => [c.name, 0]));
  const scale = 100 / rawSum;
  return Object.fromEntries(categories.map((c) => [c.name, c.weight * scale]));
}

interface Coefficients {
  /**
   * The locked portion of the final grade from work already completed, expressed
   * in [0, 1] space. numeratorConstant × 100 = grade if student scores 0 on everything left.
   */
  numeratorConstant: number;
  /**
   * How much the remaining work can move the needle. remainingCoefficient × 100 = the
   * maximum additional percentage points still available.
   */
  remainingCoefficient: number;
}

/**
 * Pre-computes the two coefficients that fully describe the grade equation.
 *
 * For each category i with normalized weight w_i (fraction, not percent):
 *   denominator_i  = completedPoints_i + regularRemainingPoints_i
 *   numeratorConstant   += w_i × (earnedPoints_i + ecPoints_i) / denominator_i
 *   remainingCoefficient += w_i × regularRemainingPoints_i / denominator_i
 *
 * Extra-credit remaining points count toward the numerator (free earned points)
 * but not toward the denominator — they can only help, never hurt.
 */
function computeCoefficients(
  categories: Category[],
  weights: Record<string, number>,
): Coefficients {
  let numeratorConstant = 0;
  let remainingCoefficient = 0;

  for (const cat of categories) {
    const w = (weights[cat.name] ?? 0) / 100; // convert to fraction
    const { earnedAfterDrops, possibleAfterDrops } = categoryState(cat);

    const regularRemaining = cat.remaining
      .filter((r) => !r.isExtraCredit)
      .reduce((s, r) => s + r.points, 0);
    const ecRemaining = cat.remaining
      .filter((r) => r.isExtraCredit)
      .reduce((s, r) => s + r.points, 0);

    const denominator = possibleAfterDrops + regularRemaining;
    if (denominator === 0) continue;

    numeratorConstant += w * (earnedAfterDrops / denominator);
    // EC is already-earned bonus: adds to numerator without expanding denominator
    numeratorConstant += w * (ecRemaining / denominator);

    if (regularRemaining > 0) {
      remainingCoefficient += w * (regularRemaining / denominator);
    }
  }

  return { numeratorConstant, remainingCoefficient };
}

function pctToLetter(pct: number): string {
  for (const { min, letter } of LETTER_CUTOFFS) {
    if (pct >= min) return letter;
  }
  return 'F';
}

// ---------------------------------------------------------------------------
// calculateCurrentGrade
// ---------------------------------------------------------------------------

export interface GradeBreakdownItem {
  name: string;
  /** Normalized weight after summing all category weights to 100. */
  normalizedWeight: number;
  /** Current percentage in this category, null if no graded work yet. */
  pct: number | null;
}

export interface CurrentGradeResult {
  /**
   * Weighted average across all categories that have at least one graded assignment.
   * Null when no work has been graded at all.
   *
   * Note: this is normalized to graded weights only, so it reflects performance
   * on work done so far — not a projection of the final grade.
   *
   * Example: Homework 40% graded at 90%, Exams 60% not yet graded → 90%.
   * (Not 36%, which would be the misleading weighted-contribution view.)
   */
  percentage: number | null;
  /** Letter grade for the current percentage. Null when percentage is null. */
  letter: string | null;
  breakdown: GradeBreakdownItem[];
}

/**
 * Computes the student's current grade from all completed work, respecting
 * category weights and drop-lowest policies.
 *
 * Categories with no completed assignments are excluded from the average so
 * the grade is not artificially deflated by ungrades portions of the syllabus.
 */
export function calculateCurrentGrade(categories: Category[]): CurrentGradeResult {
  const weights = normalizeWeights(categories);

  let totalContribution = 0;
  let totalGradedWeight = 0;
  const breakdown: GradeBreakdownItem[] = [];

  for (const cat of categories) {
    const w = weights[cat.name] ?? 0;
    const { pct, earnedAfterDrops, possibleAfterDrops } = categoryState(cat);

    if (pct !== null) {
      const contribution = w * (earnedAfterDrops / possibleAfterDrops);
      totalContribution += contribution;
      totalGradedWeight += w;
    }

    breakdown.push({ name: cat.name, normalizedWeight: w, pct });
  }

  if (totalGradedWeight === 0) {
    return { percentage: null, letter: null, breakdown };
  }

  // Divide by graded weight (not 100) so partial completion reads correctly
  const percentage = (totalContribution / totalGradedWeight) * 100;
  return { percentage, letter: pctToLetter(percentage), breakdown };
}

// ---------------------------------------------------------------------------
// calculateNeeded
// ---------------------------------------------------------------------------

export interface NeededResult {
  /**
   * Weighted average the student must score on all remaining assignments.
   * - Negative → already secured the target (score anything and you're safe).
   * - > 100 → not achievable (see isImpossible).
   * - Null → no remaining work left.
   */
  requiredAverage: number | null;
  /** True when requiredAverage > 100 or target cannot be reached with no remaining work. */
  isImpossible: boolean;
  /** True when the target is already locked in even with a score of 0 on everything left. */
  alreadyAchieved: boolean;
}

/**
 * Calculates the average score needed on all remaining work to finish with
 * at least `targetGrade`.
 *
 * Math:
 *   finalGrade = (numeratorConstant + remainingCoefficient × R/100) × 100
 *   ⟹  R = ((target/100 − numeratorConstant) / remainingCoefficient) × 100
 *
 * @param categories - Weighted categories with completed and upcoming work.
 * @param targetGrade - 'A' (93%), 'B' (83%), 'C' (73%), or 'D' (63%).
 */
export function calculateNeeded(
  categories: Category[],
  targetGrade: TargetGrade,
): NeededResult {
  const targetPct = GRADE_THRESHOLDS[targetGrade];
  const weights = normalizeWeights(categories);
  const { numeratorConstant, remainingCoefficient } = computeCoefficients(categories, weights);

  // No upcoming work: grade is locked at whatever was completed
  if (remainingCoefficient === 0) {
    const lockedGrade = numeratorConstant * 100;
    return {
      requiredAverage: null,
      isImpossible: lockedGrade < targetPct,
      alreadyAchieved: lockedGrade >= targetPct,
    };
  }

  const R = ((targetPct / 100 - numeratorConstant) / remainingCoefficient) * 100;
  return {
    requiredAverage: R,
    isImpossible: R > 100,
    alreadyAchieved: R < 0,
  };
}

// ---------------------------------------------------------------------------
// isTargetPossible
// ---------------------------------------------------------------------------

export interface PossibilityResult {
  /** True when scoring 100% on all remaining work would meet the target. */
  possible: boolean;
  /**
   * Highest final grade reachable if every remaining assignment scores 100%.
   * Always returned, whether the target is possible or not.
   */
  maxAchievable: number;
  /**
   * How many percentage points the student falls short at peak performance.
   * Null when possible is true (not a useful number in that case).
   */
  shortfall: number | null;
}

/**
 * Determines whether `targetGrade` is still mathematically achievable and
 * returns the maximum final grade reachable from the current position.
 *
 * @param categories - Weighted categories with completed and upcoming work.
 * @param targetGrade - 'A', 'B', 'C', or 'D'.
 */
export function isTargetPossible(
  categories: Category[],
  targetGrade: TargetGrade,
): PossibilityResult {
  const targetPct = GRADE_THRESHOLDS[targetGrade];
  const weights = normalizeWeights(categories);
  const { numeratorConstant, remainingCoefficient } = computeCoefficients(categories, weights);

  const maxAchievable = (numeratorConstant + remainingCoefficient) * 100;

  if (maxAchievable >= targetPct) {
    return { possible: true, maxAchievable, shortfall: null };
  }
  return { possible: false, maxAchievable, shortfall: targetPct - maxAchievable };
}

// ---------------------------------------------------------------------------
// getScenarioResults
// ---------------------------------------------------------------------------

export type ScenarioStatus =
  | 'already_achieved'
  | 'achievable'
  | 'impossible'
  | 'no_remaining_work';

export interface ScenarioResult {
  target: TargetGrade;
  /** Minimum percentage needed for this letter grade. */
  targetPercentage: number;
  /**
   * Average required on remaining work. Null when no remaining work exists.
   * May be negative (already achieved) or > 100 (impossible).
   */
  requiredAverage: number | null;
  maxAchievable: number;
  status: ScenarioStatus;
}

/**
 * Runs all four grade scenarios (A, B, C, D) in a single pass, computing
 * coefficients once and evaluating each target threshold against them.
 *
 * Equivalent to calling calculateNeeded four times but more efficient since
 * the expensive coefficient loop runs only once.
 *
 * @param categories - Weighted categories with completed and upcoming work.
 */
export function getScenarioResults(categories: Category[]): ScenarioResult[] {
  const weights = normalizeWeights(categories);
  const { numeratorConstant, remainingCoefficient } = computeCoefficients(categories, weights);
  const maxAchievable = (numeratorConstant + remainingCoefficient) * 100;

  const targets: TargetGrade[] = ['A', 'B', 'C', 'D'];

  return targets.map((target) => {
    const targetPercentage = GRADE_THRESHOLDS[target];

    if (remainingCoefficient === 0) {
      const lockedGrade = numeratorConstant * 100;
      return {
        target,
        targetPercentage,
        requiredAverage: null,
        maxAchievable: lockedGrade,
        status: lockedGrade >= targetPercentage ? 'already_achieved' : 'no_remaining_work',
      };
    }

    const R = ((targetPercentage / 100 - numeratorConstant) / remainingCoefficient) * 100;
    const status: ScenarioStatus =
      R < 0 ? 'already_achieved' : R > 100 ? 'impossible' : 'achievable';

    return { target, targetPercentage, requiredAverage: R, maxAchievable, status };
  });
}
