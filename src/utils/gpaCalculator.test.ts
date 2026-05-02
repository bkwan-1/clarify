import { describe, it, expect } from 'vitest';
import {
  calculateGPA,
  calculateCumulativeGPA,
  getClassImpactRanking,
  getScenarioGPA,
  GRADE_POINTS,
} from './gpaCalculator';
import type { ClassEntry, Semester } from './gpaCalculator';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function cls(
  name: string,
  letterGrade: ClassEntry['letterGrade'],
  credits: number,
  overrides: Partial<ClassEntry> = {},
): ClassEntry {
  return { id: name, name, letterGrade, credits, ...overrides };
}

function semester(name: string, classes: ClassEntry[]): Semester {
  return { id: name, name, classes };
}

// Three courses, all equal 3 credits: A, B, C → GPA = (4+3+2)/3 = 3.0
const mixedSemester: Semester = semester('Fall', [
  cls('Math', 'A', 3),
  cls('English', 'B', 3),
  cls('History', 'C', 3),
]);

// ---------------------------------------------------------------------------
// calculateGPA
// ---------------------------------------------------------------------------

describe('calculateGPA', () => {
  it('returns null GPA for an empty class list', () => {
    const result = calculateGPA([]);
    expect(result.gpa).toBeNull();
    expect(result.totalCredits).toBe(0);
    expect(result.totalQualityPoints).toBe(0);
  });

  it('returns 4.0 for straight A grades', () => {
    const classes = [cls('Math', 'A', 3), cls('Science', 'A', 4)];
    const result = calculateGPA(classes);
    expect(result.gpa).toBeCloseTo(4.0, 5);
  });

  it('A+ equals 4.0, not 4.3 (standard 4.0 scale cap)', () => {
    // Critical boundary: A+ must not be treated as 4.3
    const result = calculateGPA([cls('Honors', 'A+', 3)]);
    expect(result.gpa).toBeCloseTo(4.0, 5);
    expect(GRADE_POINTS['A+']).toBe(4.0);
  });

  it('A- is 3.7, correctly differentiated from A (4.0)', () => {
    const result = calculateGPA([cls('Course', 'A-', 3)]);
    expect(result.gpa).toBeCloseTo(3.7, 5);
  });

  it('computes a correct weighted average with unequal credit loads', () => {
    // A (4.0) × 3cr = 12 QP
    // B (3.0) × 4cr = 12 QP
    // C (2.0) × 2cr = 4 QP
    // GPA = 28 / 9 = 3.111...
    const classes = [cls('A', 'A', 3), cls('B', 'B', 4), cls('C', 'C', 2)];
    const result = calculateGPA(classes);
    expect(result.gpa).toBeCloseTo(28 / 9, 5);
    expect(result.totalQualityPoints).toBeCloseTo(28, 5);
    expect(result.totalCredits).toBe(9);
  });

  it('all F grades produce GPA of 0.0', () => {
    const classes = [cls('F1', 'F', 3), cls('F2', 'F', 4)];
    const result = calculateGPA(classes);
    expect(result.gpa).toBeCloseTo(0.0, 5);
  });

  it('excludes courses with null grade (in-progress)', () => {
    const classes = [cls('Done', 'A', 3), cls('InProgress', null, 3)];
    const result = calculateGPA(classes);
    // Only the A course counts
    expect(result.gpa).toBeCloseTo(4.0, 5);
    expect(result.totalCredits).toBe(3);
  });

  it('excludes courses with 0 credits', () => {
    const classes = [cls('Main', 'B', 3), cls('ZeroCr', 'A', 0)];
    const result = calculateGPA(classes);
    expect(result.gpa).toBeCloseTo(3.0, 5);
    expect(result.totalCredits).toBe(3);
  });

  it('excludes courses where includeInGPA is false', () => {
    const classes = [
      cls('Regular', 'B', 3),
      cls('PassFail', 'A', 3, { includeInGPA: false }),
    ];
    const result = calculateGPA(classes);
    expect(result.gpa).toBeCloseTo(3.0, 5);
    expect(result.totalCredits).toBe(3);
  });

  it('returns null when all courses are excluded', () => {
    const classes = [cls('IP', null, 3), cls('ZeroCr', 'A', 0)];
    const result = calculateGPA(classes);
    expect(result.gpa).toBeNull();
  });

  it('adds weighted bonus for AP courses when weighted=true', () => {
    // Standard B = 3.0; AP B = min(3.0 + 1.0, 5.0) = 4.0
    const classes = [cls('AP Physics', 'B', 3, { weight: 'AP' })];
    const weighted = calculateGPA(classes, true);
    const unweighted = calculateGPA(classes, false);
    expect(weighted.gpa).toBeCloseTo(4.0, 5);
    expect(unweighted.gpa).toBeCloseTo(3.0, 5);
  });

  it('adds 0.5 bonus for Honors courses', () => {
    // Honors B = min(3.0 + 0.5, 5.0) = 3.5
    const classes = [cls('Honors English', 'B', 3, { weight: 'honors' })];
    const result = calculateGPA(classes, true);
    expect(result.gpa).toBeCloseTo(3.5, 5);
  });

  it('caps weighted GPA at 5.0 (AP A → 5.0, not 5.0+)', () => {
    const classes = [cls('AP Math', 'A', 3, { weight: 'AP' })];
    const result = calculateGPA(classes, true);
    expect(result.gpa).toBeCloseTo(5.0, 5);
    expect(result.gpa!).toBeLessThanOrEqual(5.0);
  });

  it('F grade does not receive weighted bonus', () => {
    // F = 0.0; AP F should still be 0.0
    const classes = [cls('AP Failed', 'F', 3, { weight: 'AP' })];
    const result = calculateGPA(classes, true);
    expect(result.gpa).toBeCloseTo(0.0, 5);
  });
});

// ---------------------------------------------------------------------------
// calculateCumulativeGPA
// ---------------------------------------------------------------------------

describe('calculateCumulativeGPA', () => {
  it('returns null for an empty semester array', () => {
    const result = calculateCumulativeGPA([]);
    expect(result.gpa).toBeNull();
    expect(result.totalCredits).toBe(0);
  });

  it('pools QP across semesters correctly (not averaging semester GPAs)', () => {
    // Semester 1: A across 15 credits → 60 QP, GPA 4.0
    // Semester 2: C in  3 credits →  6 QP, GPA 2.0
    // Correct cumulative: 66 / 18 = 3.667
    // Wrong (averaged):   (4.0 + 2.0) / 2 = 3.0
    const sem1 = semester('S1', [cls('Calc', 'A', 3), cls('Phys', 'A', 3), cls('Eng', 'A', 3), cls('Hist', 'A', 3), cls('Bio', 'A', 3)]);
    const sem2 = semester('S2', [cls('Art', 'C', 3)]);
    const result = calculateCumulativeGPA([sem1, sem2]);
    expect(result.gpa).toBeCloseTo(66 / 18, 5);
    expect(result.gpa).not.toBeCloseTo(3.0, 2); // confirm it's NOT the naive average
  });

  it('matches a single-semester calculateGPA', () => {
    const semResult = calculateGPA(mixedSemester.classes);
    const cumResult = calculateCumulativeGPA([mixedSemester]);
    expect(cumResult.gpa).toBeCloseTo(semResult.gpa!, 5);
  });

  it('includes semester breakdown with per-semester GPA and credits', () => {
    const sem1 = semester('Fall', [cls('A', 'A', 3)]);
    const sem2 = semester('Spring', [cls('B', 'B', 3)]);
    const result = calculateCumulativeGPA([sem1, sem2]);
    expect(result.semesterBreakdown).toHaveLength(2);
    expect(result.semesterBreakdown[0].gpa).toBeCloseTo(4.0, 5);
    expect(result.semesterBreakdown[1].gpa).toBeCloseTo(3.0, 5);
    expect(result.semesterBreakdown[0].credits).toBe(3);
  });

  it('handles semesters with no eligible courses (all null grades)', () => {
    const sem1 = semester('Fall', [cls('A', 'A', 3)]);
    const sem2 = semester('Spring', [cls('InProgress', null, 3)]);
    const result = calculateCumulativeGPA([sem1, sem2]);
    // Only sem1 contributes
    expect(result.gpa).toBeCloseTo(4.0, 5);
    expect(result.totalCredits).toBe(3);
    expect(result.semesterBreakdown[1].gpa).toBeNull();
  });

  it('accumulates quality points and credits across three semesters', () => {
    const sems = [
      semester('S1', [cls('c', 'A', 3)]),   // 12 QP, 3 cr
      semester('S2', [cls('c', 'B', 3)]),   //  9 QP, 3 cr
      semester('S3', [cls('c', 'C', 3)]),   //  6 QP, 3 cr
    ];
    const result = calculateCumulativeGPA(sems);
    expect(result.totalQualityPoints).toBeCloseTo(27, 5);
    expect(result.totalCredits).toBe(9);
    expect(result.gpa).toBeCloseTo(3.0, 5);
  });
});

// ---------------------------------------------------------------------------
// getClassImpactRanking
// ---------------------------------------------------------------------------

describe('getClassImpactRanking', () => {
  it('returns empty array when no eligible courses exist', () => {
    const sems = [semester('S', [cls('IP', null, 3)])];
    expect(getClassImpactRanking(sems)).toEqual([]);
  });

  it('excludes the only-course case (removing it leaves nothing)', () => {
    const sems = [semester('S', [cls('Solo', 'A', 3)])];
    expect(getClassImpactRanking(sems)).toEqual([]);
  });

  it('ranks the grade-dragging class as position 1', () => {
    // A, B, C each 3 credits → GPA 3.0
    // Without C: (12+9)/6 = 3.5 → delta = 3.0 - 3.5 = -0.5 (most negative → rank 1)
    // Without B: (12+6)/6 = 3.0 → delta = 0
    // Without A: (9+6)/6  = 2.5 → delta = 3.0 - 2.5 = 0.5 (rank 3 — helping most)
    const ranking = getClassImpactRanking([mixedSemester]);
    expect(ranking[0].className).toBe('History'); // C grade
    expect(ranking[0].rankPosition).toBe(1);
    expect(ranking[0].gpaImpactDelta).toBeCloseTo(-0.5, 5);
  });

  it('places the highest-grade class last (it helps the GPA most)', () => {
    const ranking = getClassImpactRanking([mixedSemester]);
    expect(ranking[ranking.length - 1].className).toBe('Math'); // A grade
    expect(ranking[ranking.length - 1].gpaImpactDelta).toBeCloseTo(0.5, 5);
  });

  it('gpaWithoutThisClass is correct for the worst class', () => {
    // Without History (C, 3cr, 6 QP): remaining = (12+9)/6 = 3.5
    const ranking = getClassImpactRanking([mixedSemester]);
    expect(ranking[0].gpaWithoutThisClass).toBeCloseTo(3.5, 5);
  });

  it('handles multiple semesters spread across the record', () => {
    const sems = [
      semester('S1', [cls('A-course', 'A', 3), cls('F-course', 'F', 3)]),
      semester('S2', [cls('B-course', 'B', 3)]),
    ];
    const ranking = getClassImpactRanking(sems);
    // F class has the most negative delta → rank 1
    expect(ranking[0].className).toBe('F-course');
  });

  it('assigns sequential rank positions starting at 1', () => {
    const ranking = getClassImpactRanking([mixedSemester]);
    ranking.forEach((e, i) => expect(e.rankPosition).toBe(i + 1));
  });

  it('uses weighted grade points when weighted=true', () => {
    const sems = [semester('S', [
      cls('AP A', 'A', 3, { weight: 'AP' }), // 5.0 weighted
      cls('Std B', 'B', 3),                   // 3.0
    ])];
    const rankingW = getClassImpactRanking(sems, true);
    const rankingU = getClassImpactRanking(sems, false);
    // Weighted: AP A = 5.0, Std B = 3.0 → GPA 4.0
    // Unweighted: A = 4.0, B = 3.0 → GPA 3.5
    // The deltas differ between weighted and unweighted runs
    expect(rankingW[0].gpaImpactDelta).not.toBeCloseTo(rankingU[0].gpaImpactDelta, 3);
  });
});

// ---------------------------------------------------------------------------
// getScenarioGPA
// ---------------------------------------------------------------------------

describe('getScenarioGPA', () => {
  it('returns the current GPA unchanged when no modification changes anything', () => {
    // Replace Math (A) with same grade (A) → no change
    const result = getScenarioGPA([mixedSemester], cls('Math', 'A', 3));
    expect(result.gpaDelta).toBeCloseTo(0, 5);
    expect(result.newGPA).toBeCloseTo(result.currentGPA!, 5);
  });

  it('raises GPA when improving a class grade', () => {
    // Improve History from C to A
    const result = getScenarioGPA([mixedSemester], cls('History', 'A', 3));
    expect(result.gpaDelta).toBeGreaterThan(0);
    expect(result.newGPA).toBeGreaterThan(result.currentGPA!);
  });

  it('computes the correct new GPA when improving from C to A', () => {
    // Original: A + B + C = (12+9+6)/9 = 3.0
    // After:    A + B + A = (12+9+12)/9 = 3.667
    const result = getScenarioGPA([mixedSemester], cls('History', 'A', 3));
    expect(result.newGPA).toBeCloseTo(33 / 9, 5);
    expect(result.currentGPA).toBeCloseTo(3.0, 5);
    expect(result.gpaDelta).toBeCloseTo(33 / 9 - 3.0, 5);
  });

  it('lowers GPA when downgrading a class grade', () => {
    // Downgrade Math from A to F
    const result = getScenarioGPA([mixedSemester], cls('Math', 'F', 3));
    expect(result.gpaDelta).toBeLessThan(0);
  });

  it('handles the maximum improvement: F to A', () => {
    const sems = [semester('S', [cls('Bad', 'F', 3), cls('Good', 'A', 3)])];
    const result = getScenarioGPA(sems, cls('Bad', 'A', 3));
    // Original: (0+12)/6 = 2.0; After: (12+12)/6 = 4.0
    expect(result.currentGPA).toBeCloseTo(2.0, 5);
    expect(result.newGPA).toBeCloseTo(4.0, 5);
    expect(result.gpaDelta).toBeCloseTo(2.0, 5);
  });

  it('treats a non-existent class as a new addition to the record', () => {
    // Adding a new A course (3cr) to existing mixedSemester (GPA 3.0, 9cr)
    const result = getScenarioGPA([mixedSemester], cls('New Course', 'A', 3));
    // New: (27+12)/(9+3) = 39/12 = 3.25
    expect(result.newGPA).toBeCloseTo(39 / 12, 5);
    expect(result.gpaDelta).toBeGreaterThan(0);
  });

  it('matches classes by id when id is provided', () => {
    // id='Math' matches the Math entry in mixedSemester fixture
    const modifiedById = getScenarioGPA([mixedSemester], { id: 'Math', name: 'Different Name', letterGrade: 'F', credits: 3 });
    // Should find and replace the Math (A) entry → GPA should drop
    expect(modifiedById.gpaDelta).toBeLessThan(0);
  });

  it('returns null gpaDelta when there are no courses and currentGPA is null', () => {
    const result = getScenarioGPA([], cls('New', 'A', 3));
    // currentGPA is null → gpaDelta is null, but newGPA can still be computed
    expect(result.currentGPA).toBeNull();
    expect(result.gpaDelta).toBeNull();
    expect(result.newGPA).toBeCloseTo(4.0, 5);
  });

  it('applies weighted bonus in scenario mode when weighted=true', () => {
    // Both scenarios start from: Other B (std) + Target C (std), 3cr each
    // Unweighted — improve Target from C to A: (12+9)/6 = 3.5
    // Weighted   — improve Target from C to AP A (5.0 pts): (15+9)/6 = 4.0
    // 4.0 > 3.5, so weighted produces a higher new GPA
    const sems = [semester('S', [cls('Other', 'B', 3), cls('Target', 'C', 3)])];
    const unweighted = getScenarioGPA(sems, cls('Target', 'A', 3), false);
    const weighted = getScenarioGPA(sems, cls('Target', 'A', 3, { weight: 'AP' }), true);
    expect(weighted.newGPA).toBeCloseTo(4.0, 5);
    expect(unweighted.newGPA).toBeCloseTo(3.5, 5);
    expect(weighted.newGPA!).toBeGreaterThan(unweighted.newGPA!);
  });
});
