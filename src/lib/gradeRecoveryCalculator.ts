import type {
  GradeCategory,
  GradeRecoveryClass,
  GradeRecoveryResult,
  TargetResult,
  CustomTargetResult,
  CategorySnapshot,
  ScenarioStatus,
  LetterGrade,
  TargetGradeTier,
} from '../models/gradeRecovery';
import { DEFAULT_GRADE_SCALE } from '../models/gradeRecovery';

function getAssignmentPct(a: GradeCategory['completedAssignments'][0]): number | null {
  if (a.mode === 'points') {
    if (!a.totalPoints || a.totalPoints === 0) return null;
    if (a.earnedPoints === undefined || a.earnedPoints === null) return null;
    return (a.earnedPoints / a.totalPoints) * 100;
  }
  if (a.percentage === undefined || a.percentage === null) return null;
  return a.percentage;
}

export function computeCategoryCurrentPercentage(
  category: GradeCategory,
): { pct: number | null; earnedAfterDrops: number; possibleAfterDrops: number } {
  const assignments = category.completedAssignments;

  const withPcts = assignments
    .map((a) => ({ ...a, pct: getAssignmentPct(a) }))
    .filter((a) => a.pct !== null) as Array<
    GradeCategory['completedAssignments'][0] & { pct: number }
  >;

  if (withPcts.length === 0) {
    return { pct: null, earnedAfterDrops: 0, possibleAfterDrops: 0 };
  }

  // Apply drop-lowest
  const sorted = [...withPcts].sort((a, b) => a.pct - b.pct);
  const dropCount = Math.min(category.dropLowest, sorted.length - 1);
  const kept = sorted.slice(dropCount);

  // Update isDropped flags on original assignments (mutate category for UI)
  const droppedIds = new Set(sorted.slice(0, dropCount).map((a) => a.id));
  for (const a of assignments) {
    a.isDropped = droppedIds.has(a.id);
  }

  const allPoints = kept.every((a) => a.mode === 'points');
  if (allPoints) {
    const earned = kept.reduce((s, a) => s + (a.earnedPoints ?? 0), 0);
    const possible = kept.reduce((s, a) => s + (a.totalPoints ?? 0), 0);
    return {
      pct: possible > 0 ? (earned / possible) * 100 : null,
      earnedAfterDrops: earned,
      possibleAfterDrops: possible,
    };
  }

  // Mixed or all-percentage: simple average
  const avgPct = kept.reduce((s, a) => s + a.pct, 0) / kept.length;
  return {
    pct: avgPct,
    earnedAfterDrops: avgPct * kept.length, // synthetic
    possibleAfterDrops: 100 * kept.length,
  };
}

export function computeNormalizedWeights(
  categories: GradeCategory[],
  normalize: boolean,
): Record<string, number> {
  const rawSum = categories.reduce((s, c) => s + c.weight, 0);
  const result: Record<string, number> = {};
  if (rawSum === 0) {
    for (const c of categories) result[c.id] = 0;
    return result;
  }
  const scale = normalize || rawSum !== 100 ? 100 / rawSum : 1;
  for (const c of categories) {
    result[c.id] = c.weight * scale;
  }
  return result;
}

export function percentageToLetterGrade(
  pct: number,
  scale: TargetGradeTier[] = DEFAULT_GRADE_SCALE,
): LetterGrade {
  const sorted = [...scale].sort((a, b) => b.minPercentage - a.minPercentage);
  for (const tier of sorted) {
    if (pct >= tier.minPercentage) return tier.letter;
  }
  return 'F';
}

interface Coefficients {
  numeratorConstant: number;
  remainingCoefficient: number;
  extraCreditCapacity: number; // max extra contribution from EC remaining
}

function computeCoefficients(
  categories: GradeCategory[],
  weights: Record<string, number>,
): Coefficients {
  let numeratorConstant = 0;
  let remainingCoefficient = 0;
  let extraCreditCapacity = 0;

  for (const cat of categories) {
    const w = weights[cat.id] ?? 0;
    const { earnedAfterDrops, possibleAfterDrops } = computeCategoryCurrentPercentage(cat);

    const regularRemaining = cat.remainingAssignments
      .filter((r) => !r.isExtraCredit)
      .reduce((s, r) => s + r.pointValue, 0);
    const ecRemaining = cat.remainingAssignments
      .filter((r) => r.isExtraCredit)
      .reduce((s, r) => s + r.pointValue, 0);

    const denominator = possibleAfterDrops + regularRemaining;
    if (denominator === 0) continue;

    // Locked contribution from completed work
    numeratorConstant += w * (earnedAfterDrops / denominator);
    // Extra credit remaining: treated as bonus earned points (reduces R needed)
    numeratorConstant += w * (ecRemaining / denominator);
    extraCreditCapacity += w * (ecRemaining / denominator) * 100;

    if (regularRemaining > 0) {
      remainingCoefficient += w * (regularRemaining / denominator);
    }
  }

  return { numeratorConstant, remainingCoefficient, extraCreditCapacity };
}

function computeTargetResult(
  target: LetterGrade,
  targetPercentage: number,
  coeff: Coefficients,
  categories: GradeCategory[],
  weights: Record<string, number>,
): TargetResult {
  const { numeratorConstant, remainingCoefficient } = coeff;

  let requiredAverage: number | null = null;
  let status: ScenarioStatus;

  // Snapshots per category
  const categorySnapshots: CategorySnapshot[] = categories.map((cat) => {
    const w = weights[cat.id] ?? 0;
    const { pct, earnedAfterDrops, possibleAfterDrops } = computeCategoryCurrentPercentage(cat);
    const regularRemaining = cat.remainingAssignments
      .filter((r) => !r.isExtraCredit)
      .reduce((s, r) => s + r.pointValue, 0);
    const hasRemainingWork = regularRemaining > 0 || cat.remainingAssignments.length > 0;
    const denominator = possibleAfterDrops + regularRemaining;
    const contribution = denominator > 0 ? w * (earnedAfterDrops / denominator) : 0;

    return {
      categoryId: cat.id,
      currentEarnedPercentage: pct,
      contributionToTotal: contribution,
      hasRemainingWork,
      requiredAverageOnRemaining: null, // filled below
      isImpossible: false,
      isAlreadyAchieved: false,
    };
  });

  if (remainingCoefficient === 0) {
    // No remaining work anywhere
    const currentTotal = numeratorConstant * 100;
    if (currentTotal >= targetPercentage) {
      status = 'already_achieved';
    } else {
      status = 'no_remaining_work';
    }
    return {
      target,
      targetPercentage,
      requiredAverage: null,
      maxAchievable: currentTotal,
      status,
      categorySnapshots,
    };
  }

  const R = ((targetPercentage / 100 - numeratorConstant) / remainingCoefficient) * 100;
  requiredAverage = R;

  const maxAchievable = (numeratorConstant + remainingCoefficient) * 100; // at 100%

  if (R < 0) {
    status = 'already_achieved';
  } else if (R > 100) {
    status = 'impossible';
  } else {
    status = 'achievable';
  }

  return {
    target,
    targetPercentage,
    requiredAverage,
    maxAchievable,
    status,
    categorySnapshots,
  };
}

function computeCustomTargetResult(
  targetPercentage: number,
  coeff: Coefficients,
): CustomTargetResult {
  const { numeratorConstant, remainingCoefficient } = coeff;

  if (remainingCoefficient === 0) {
    const currentTotal = numeratorConstant * 100;
    return {
      targetPercentage,
      requiredAverage: null,
      maxAchievable: currentTotal,
      status: currentTotal >= targetPercentage ? 'already_achieved' : 'no_remaining_work',
    };
  }

  const R = ((targetPercentage / 100 - numeratorConstant) / remainingCoefficient) * 100;
  const maxAchievable = (numeratorConstant + remainingCoefficient) * 100;

  return {
    targetPercentage,
    requiredAverage: R,
    maxAchievable,
    status: R < 0 ? 'already_achieved' : R > 100 ? 'impossible' : 'achievable',
  };
}

export function computeGradeRecoveryResult(cls: GradeRecoveryClass): GradeRecoveryResult {
  const weights = computeNormalizedWeights(cls.categories, cls.normalizeWeights);
  const coeff = computeCoefficients(cls.categories, weights);
  const effectiveWeightSum = cls.categories.reduce((s, c) => s + c.weight, 0);

  // Current grade
  let currentTotal = 0;
  for (const cat of cls.categories) {
    const w = weights[cat.id] ?? 0;
    const { earnedAfterDrops, possibleAfterDrops } = computeCategoryCurrentPercentage(cat);
    if (possibleAfterDrops > 0) {
      currentTotal += w * (earnedAfterDrops / possibleAfterDrops);
    }
  }
  const currentGradePercentage = currentTotal;
  const currentLetterGrade = percentageToLetterGrade(currentGradePercentage, cls.gradeScale);

  // Precompute all standard targets
  const targetResults: Partial<Record<LetterGrade, TargetResult>> = {};
  const targets: LetterGrade[] = ['A', 'B', 'C', 'D'];
  for (const t of targets) {
    const tier = cls.gradeScale.find((g) => g.letter === t);
    const pct = tier?.minPercentage ?? 0;
    targetResults[t] = computeTargetResult(t, pct, coeff, cls.categories, weights);
  }

  const customTargetResults: CustomTargetResult[] = (cls.customTargets ?? []).map((pct) =>
    computeCustomTargetResult(pct, coeff),
  );

  return {
    currentGradePercentage,
    currentLetterGrade,
    effectiveWeightSum,
    normalizedWeights: weights,
    _numeratorConstant: coeff.numeratorConstant,
    _remainingCoefficient: coeff.remainingCoefficient,
    targetResults: targetResults as Record<LetterGrade, TargetResult>,
    customTargetResults,
  };
}

export function computeRequiredForTarget(
  numeratorConstant: number,
  remainingCoefficient: number,
  targetPercentage: number,
): number | null {
  if (remainingCoefficient === 0) return null;
  return ((targetPercentage / 100 - numeratorConstant) / remainingCoefficient) * 100;
}
