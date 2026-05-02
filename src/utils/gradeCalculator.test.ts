import { describe, it, expect } from 'vitest';
import {
  calculateCurrentGrade,
  calculateNeeded,
  isTargetPossible,
  getScenarioResults,
} from './gradeCalculator';
import type { Category } from './gradeCalculator';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Single category, 100 points completed, 100 points remaining. */
function singleCat(earned: number, total = 100, remainingPoints = 100): Category[] {
  return [
    {
      name: 'Total',
      weight: 100,
      completed: [{ earned, total }],
      remaining: [{ points: remainingPoints }],
    },
  ];
}

/** Two weighted categories: Homework 40%, Exams 60%. */
const twoCategories: Category[] = [
  {
    name: 'Homework',
    weight: 40,
    completed: [{ earned: 90, total: 100 }, { earned: 80, total: 100 }],
    remaining: [{ points: 50 }],
  },
  {
    name: 'Exams',
    weight: 60,
    completed: [{ earned: 75, total: 100 }],
    remaining: [{ points: 100 }],
  },
];

// ---------------------------------------------------------------------------
// calculateCurrentGrade
// ---------------------------------------------------------------------------

describe('calculateCurrentGrade', () => {
  it('returns null when no completed work exists', () => {
    const cats: Category[] = [
      { name: 'HW', weight: 100, completed: [], remaining: [{ points: 100 }] },
    ];
    const result = calculateCurrentGrade(cats);
    expect(result.percentage).toBeNull();
    expect(result.letter).toBeNull();
  });

  it('calculates a simple single-category average', () => {
    // 90/100 = 90%
    const cats: Category[] = [
      { name: 'Total', weight: 100, completed: [{ earned: 90, total: 100 }], remaining: [] },
    ];
    const result = calculateCurrentGrade(cats);
    expect(result.percentage).toBeCloseTo(90, 5);
    expect(result.letter).toBe('A-');
  });

  it('aggregates multiple assignments within a category', () => {
    // (80 + 90 + 70) / 300 = 80%
    const cats: Category[] = [
      {
        name: 'HW',
        weight: 100,
        completed: [
          { earned: 80, total: 100 },
          { earned: 90, total: 100 },
          { earned: 70, total: 100 },
        ],
        remaining: [],
      },
    ];
    const result = calculateCurrentGrade(cats);
    expect(result.percentage).toBeCloseTo(80, 5);
    expect(result.letter).toBe('B-');
  });

  it('weights categories correctly and excludes ungraded categories', () => {
    // Homework 40% at 85%, Exams 60% ungraded → current = 85%
    const cats: Category[] = [
      {
        name: 'Homework',
        weight: 40,
        completed: [{ earned: 85, total: 100 }],
        remaining: [],
      },
      {
        name: 'Exams',
        weight: 60,
        completed: [],
        remaining: [{ points: 100 }],
      },
    ];
    const result = calculateCurrentGrade(cats);
    // Only Homework has grades, so current = 85% (normalized to graded weight)
    expect(result.percentage).toBeCloseTo(85, 5);
    expect(result.letter).toBe('B');
  });

  it('computes correct weighted average when both categories are graded', () => {
    // Homework 40% at 85%, Exams 60% at 70%
    // weighted = (40×85 + 60×70) / (40+60) = (3400 + 4200) / 100 = 76%
    // C range is 73–77; C+ starts at 77 — so 76% is a C
    const cats: Category[] = [
      {
        name: 'Homework',
        weight: 40,
        completed: [{ earned: 85, total: 100 }],
        remaining: [],
      },
      {
        name: 'Exams',
        weight: 60,
        completed: [{ earned: 70, total: 100 }],
        remaining: [],
      },
    ];
    const result = calculateCurrentGrade(cats);
    expect(result.percentage).toBeCloseTo(76, 5);
    expect(result.letter).toBe('C');
  });

  it('applies drop-lowest before computing the average', () => {
    // Scores: 50, 80, 90. Drop lowest (50) → keep 80, 90 → avg 85%
    const cats: Category[] = [
      {
        name: 'HW',
        weight: 100,
        dropLowest: 1,
        completed: [
          { earned: 50, total: 100 },
          { earned: 80, total: 100 },
          { earned: 90, total: 100 },
        ],
        remaining: [],
      },
    ];
    const result = calculateCurrentGrade(cats);
    expect(result.percentage).toBeCloseTo(85, 5);
  });

  it('never drops more than (n-1) assignments — always keeps at least one', () => {
    // dropLowest=99 with 2 assignments → drop 1, keep 1 (highest: 90%)
    const cats: Category[] = [
      {
        name: 'HW',
        weight: 100,
        dropLowest: 99,
        completed: [
          { earned: 40, total: 100 },
          { earned: 90, total: 100 },
        ],
        remaining: [],
      },
    ];
    const result = calculateCurrentGrade(cats);
    expect(result.percentage).toBeCloseTo(90, 5);
  });

  it('handles percentage-mode assignments', () => {
    const cats: Category[] = [
      {
        name: 'Total',
        weight: 100,
        completed: [
          { earned: 88, total: 0, mode: 'percentage' },
          { earned: 92, total: 0, mode: 'percentage' },
        ],
        remaining: [],
      },
    ];
    const result = calculateCurrentGrade(cats);
    expect(result.percentage).toBeCloseTo(90, 5); // (88+92)/2
  });

  it('returns correct letter at grade boundaries', () => {
    const at = (pct: number) =>
      calculateCurrentGrade([
        { name: 'T', weight: 100, completed: [{ earned: pct, total: 100 }], remaining: [] },
      ]).letter;

    expect(at(97)).toBe('A+');
    expect(at(96)).toBe('A');   // 96 ≥ 93
    expect(at(93)).toBe('A');
    expect(at(90)).toBe('A-');
    expect(at(83)).toBe('B');
    expect(at(73)).toBe('C');
    expect(at(63)).toBe('D');
    expect(at(59)).toBe('F');
  });

  it('includes extra-credit assignments in the average', () => {
    // 110% EC assignment averaged with 80% regular → 95%
    const cats: Category[] = [
      {
        name: 'HW',
        weight: 100,
        completed: [
          { earned: 80, total: 100 },
          { earned: 110, total: 100, isExtraCredit: true },
        ],
        remaining: [],
      },
    ];
    const result = calculateCurrentGrade(cats);
    expect(result.percentage).toBeCloseTo(95, 5);
  });
});

// ---------------------------------------------------------------------------
// calculateNeeded
// ---------------------------------------------------------------------------

describe('calculateNeeded', () => {
  it('calculates required average for an achievable target', () => {
    // Single cat: completed 85/100, remaining 100 pts
    // numeratorConstant = 85/200 = 0.425
    // remainingCoef     = 100/200 = 0.5
    // For B (83%): R = (0.83 - 0.425) / 0.5 * 100 = 81%
    const result = calculateNeeded(singleCat(85), 'B');
    expect(result.requiredAverage).toBeCloseTo(81, 1);
    expect(result.isImpossible).toBe(false);
    expect(result.alreadyAchieved).toBe(false);
  });

  it('marks target as impossible when required average exceeds 100%', () => {
    // 85/100 completed, 100 remaining. Max achievable = (85+100)/200 * 100 = 92.5%
    // For A (93%): R = (0.93 - 0.425) / 0.5 * 100 = 101% → impossible
    const result = calculateNeeded(singleCat(85), 'A');
    expect(result.isImpossible).toBe(true);
    expect(result.alreadyAchieved).toBe(false);
    expect(result.requiredAverage).toBeGreaterThan(100);
  });

  it('marks target as already achieved when required average is negative', () => {
    // 100/100 completed, remaining 20 pts
    // numeratorConstant = 100/120 = 0.8333
    // remainingCoef     = 20/120  = 0.1667
    // For D (63%): R = (0.63 - 0.8333) / 0.1667 * 100 ≈ -122% → already achieved
    const result = calculateNeeded(singleCat(100, 100, 20), 'D');
    expect(result.alreadyAchieved).toBe(true);
    expect(result.isImpossible).toBe(false);
    expect(result.requiredAverage).toBeLessThan(0);
  });

  it('returns null requiredAverage and alreadyAchieved=true when grade is locked above target', () => {
    // No remaining work; 95% locked in → D already achieved
    const locked: Category[] = [
      { name: 'T', weight: 100, completed: [{ earned: 95, total: 100 }], remaining: [] },
    ];
    const result = calculateNeeded(locked, 'D');
    expect(result.requiredAverage).toBeNull();
    expect(result.alreadyAchieved).toBe(true);
    expect(result.isImpossible).toBe(false);
  });

  it('returns null requiredAverage and isImpossible=true when grade is locked below target', () => {
    // No remaining work; 70% locked in → A impossible
    const locked: Category[] = [
      { name: 'T', weight: 100, completed: [{ earned: 70, total: 100 }], remaining: [] },
    ];
    const result = calculateNeeded(locked, 'A');
    expect(result.requiredAverage).toBeNull();
    expect(result.isImpossible).toBe(true);
    expect(result.alreadyAchieved).toBe(false);
  });

  it('handles two weighted categories correctly', () => {
    // twoCategories fixture: Homework 40%, Exams 60%
    // HW:    completed [90,80]/[100,100], remaining [50]
    //        earned=170, possible=200, remaining=50, denom=250
    //        numerConst += 0.4 * (170/250) = 0.272
    //        remCoef    += 0.4 * (50/250)  = 0.08
    // Exams: completed [75]/[100], remaining [100]
    //        earned=75, possible=100, remaining=100, denom=200
    //        numerConst += 0.6 * (75/200)  = 0.225
    //        remCoef    += 0.6 * (100/200) = 0.3
    // numerConst = 0.497, remCoef = 0.38
    // For B (83%): R = (0.83 - 0.497) / 0.38 * 100 ≈ 87.6%
    const result = calculateNeeded(twoCategories, 'B');
    expect(result.requiredAverage).toBeCloseTo(87.63, 1);
    expect(result.isImpossible).toBe(false);
  });

  it('ignores zero-weight categories', () => {
    const cats: Category[] = [
      { name: 'Extra', weight: 0, completed: [{ earned: 100, total: 100 }], remaining: [] },
      { name: 'Main', weight: 100, completed: [{ earned: 80, total: 100 }], remaining: [{ points: 100 }] },
    ];
    // Should behave identically to a single 80/100 category
    const result = calculateNeeded(cats, 'B');
    const reference = calculateNeeded(singleCat(80), 'B');
    expect(result.requiredAverage).toBeCloseTo(reference.requiredAverage!, 4);
  });

  it('handles extra-credit remaining assignments — they reduce the required average', () => {
    // Without EC: singleCat(80) for B needs (0.83 - 0.4) / 0.5 * 100 = 86%
    // With EC remaining (20pts): numerConst += 20/200 = 0.1 extra
    //   numerConst = 80/200 + 20/200 = 0.5; remCoef = 100/200 = 0.5 (EC not in remCoef)
    // For B: R = (0.83 - 0.5) / 0.5 * 100 = 66%
    const cats: Category[] = [
      {
        name: 'T',
        weight: 100,
        completed: [{ earned: 80, total: 100 }],
        remaining: [{ points: 100 }, { points: 20, isExtraCredit: true }],
      },
    ];
    const withEC = calculateNeeded(cats, 'B');
    const withoutEC = calculateNeeded(singleCat(80), 'B');
    expect(withEC.requiredAverage!).toBeLessThan(withoutEC.requiredAverage!);
    expect(withEC.requiredAverage).toBeCloseTo(66, 1);
  });
});

// ---------------------------------------------------------------------------
// isTargetPossible
// ---------------------------------------------------------------------------

describe('isTargetPossible', () => {
  it('returns possible=true when maxAchievable meets target', () => {
    // 85/100 completed, 100 remaining → max = (85+100)/200*100 = 92.5% ≥ 83% (B)
    const result = isTargetPossible(singleCat(85), 'B');
    expect(result.possible).toBe(true);
    expect(result.maxAchievable).toBeCloseTo(92.5, 2);
    expect(result.shortfall).toBeNull();
  });

  it('returns possible=false with shortfall when target is out of reach', () => {
    // Max achievable = 92.5%, A requires 93% → shortfall = 0.5%
    const result = isTargetPossible(singleCat(85), 'A');
    expect(result.possible).toBe(false);
    expect(result.shortfall).toBeCloseTo(0.5, 1);
    expect(result.maxAchievable).toBeCloseTo(92.5, 2);
  });

  it('returns possible=true even when target is already achieved (R<0)', () => {
    // 100/100 completed, 20 remaining → max = (100+20)/120*100 = 100% ≥ 63% (D)
    const result = isTargetPossible(singleCat(100, 100, 20), 'D');
    expect(result.possible).toBe(true);
    expect(result.shortfall).toBeNull();
  });

  it('returns correct shortfall when no remaining work and grade is too low', () => {
    // Grade locked at 60%, A requires 93% → shortfall = 33%
    const locked: Category[] = [
      { name: 'T', weight: 100, completed: [{ earned: 60, total: 100 }], remaining: [] },
    ];
    const result = isTargetPossible(locked, 'A');
    expect(result.possible).toBe(false);
    expect(result.shortfall).toBeCloseTo(33, 1);
  });

  it('handles edge case: no completed work, only remaining', () => {
    // Starting fresh with 100 remaining → max = 100%
    const cats: Category[] = [
      { name: 'T', weight: 100, completed: [], remaining: [{ points: 100 }] },
    ];
    const result = isTargetPossible(cats, 'A');
    expect(result.possible).toBe(true);
    expect(result.maxAchievable).toBeCloseTo(100, 5);
  });
});

// ---------------------------------------------------------------------------
// getScenarioResults
// ---------------------------------------------------------------------------

describe('getScenarioResults', () => {
  it('returns results for all four targets in A→D order', () => {
    const results = getScenarioResults(singleCat(85));
    expect(results.map((r) => r.target)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('target percentages match standard thresholds', () => {
    const results = getScenarioResults(singleCat(85));
    expect(results[0].targetPercentage).toBe(93);
    expect(results[1].targetPercentage).toBe(83);
    expect(results[2].targetPercentage).toBe(73);
    expect(results[3].targetPercentage).toBe(63);
  });

  it('is consistent with individual calculateNeeded calls', () => {
    const scenarios = getScenarioResults(twoCategories);
    for (const s of scenarios) {
      const individual = calculateNeeded(twoCategories, s.target);
      if (individual.requiredAverage === null) {
        expect(s.requiredAverage).toBeNull();
      } else {
        expect(s.requiredAverage).toBeCloseTo(individual.requiredAverage, 5);
      }
    }
  });

  it('produces mixed statuses when the student can reach some targets but not others', () => {
    // singleCat(85): completed 85/100, remaining 100
    // numeratorConstant = 85/200 = 0.425, remainingCoefficient = 0.5
    // maxAchievable = (0.425 + 0.5) * 100 = 92.5% → A(93%) impossible, B/C/D achievable
    // D: R = (0.63 - 0.425) / 0.5 * 100 = 41% → achievable (not already achieved)
    const results = getScenarioResults(singleCat(85));
    expect(results[0].status).toBe('impossible');   // A: needs 101%
    expect(results[1].status).toBe('achievable');   // B: needs 81%
    expect(results[2].status).toBe('achievable');   // C: needs 61%
    expect(results[3].status).toBe('achievable');   // D: needs 41%
  });

  it('all already_achieved when grade is very high', () => {
    // 98/100 completed, 5 remaining → very high locked contribution
    const results = getScenarioResults(singleCat(98, 100, 5));
    for (const r of results) {
      expect(r.status).toBe('already_achieved');
    }
  });

  it('all no_remaining_work when grade is locked below every target', () => {
    // 60% locked with no remaining work — 60 < 63 (D threshold) so every target is no_remaining_work
    const locked: Category[] = [
      { name: 'T', weight: 100, completed: [{ earned: 60, total: 100 }], remaining: [] },
    ];
    const results = getScenarioResults(locked);
    for (const r of results) {
      expect(r.status).toBe('no_remaining_work');
    }
  });

  it('already_achieved status when grade is locked above a target', () => {
    // 65% locked, no remaining work — 65 ≥ 63 (D threshold) so D is already_achieved
    const locked: Category[] = [
      { name: 'T', weight: 100, completed: [{ earned: 65, total: 100 }], remaining: [] },
    ];
    const results = getScenarioResults(locked);
    expect(results[3].status).toBe('already_achieved'); // D: 65 ≥ 63
    expect(results[0].status).toBe('no_remaining_work'); // A: 65 < 93
  });

  it('maxAchievable is the same across all four results (computed once)', () => {
    const results = getScenarioResults(twoCategories);
    const first = results[0].maxAchievable;
    for (const r of results) {
      expect(r.maxAchievable).toBeCloseTo(first, 10);
    }
  });

  it('handles empty categories array gracefully', () => {
    const results = getScenarioResults([]);
    // No weights → numeratorConstant=0, remainingCoefficient=0 → no_remaining_work
    for (const r of results) {
      expect(r.status).toBe('no_remaining_work');
    }
  });
});
