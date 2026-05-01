export type GradeEntryMode = 'points' | 'percentage';

export type LetterGrade =
  | 'A+' | 'A' | 'A-'
  | 'B+' | 'B' | 'B-'
  | 'C+' | 'C' | 'C-'
  | 'D+' | 'D' | 'D-'
  | 'F';

export interface AssignmentEntry {
  id: string;
  label: string;
  mode: GradeEntryMode;
  earnedPoints?: number;
  totalPoints?: number;
  percentage?: number;    // allowed > 100 for extra credit
  isDropped: boolean;     // set by drop-lowest logic
}

export interface RemainingAssignment {
  id: string;
  label: string;
  pointValue: number;
  isExtraCredit: boolean;
}

export interface GradeCategory {
  id: string;
  name: string;
  weight: number;         // e.g. 30 means 30%
  dropLowest: number;     // 0 = no drop policy
  completedAssignments: AssignmentEntry[];
  remainingAssignments: RemainingAssignment[];
}

export interface TargetGradeTier {
  letter: LetterGrade;
  minPercentage: number;
}

export const DEFAULT_GRADE_SCALE: TargetGradeTier[] = [
  { letter: 'A+', minPercentage: 97 },
  { letter: 'A', minPercentage: 93 },
  { letter: 'A-', minPercentage: 90 },
  { letter: 'B+', minPercentage: 87 },
  { letter: 'B', minPercentage: 83 },
  { letter: 'B-', minPercentage: 80 },
  { letter: 'C+', minPercentage: 77 },
  { letter: 'C', minPercentage: 73 },
  { letter: 'C-', minPercentage: 70 },
  { letter: 'D+', minPercentage: 67 },
  { letter: 'D', minPercentage: 63 },
  { letter: 'D-', minPercentage: 60 },
  { letter: 'F', minPercentage: 0 },
];

export type GradeStructure = 'weighted' | 'points' | 'simple';

export interface GradeRecoveryClass {
  id: string;
  name: string;
  structure: GradeStructure;
  categories: GradeCategory[];
  activeTarget: LetterGrade;
  activeTargets: LetterGrade[];   // which scenario chips are toggled on
  normalizeWeights: boolean;
  gradeScale: TargetGradeTier[];
  creditHours?: number;           // for cross-tool handoff
  customTargets: number[];        // user-defined percentage targets e.g. [98, 95]
}

export interface CategorySnapshot {
  categoryId: string;
  currentEarnedPercentage: number | null;
  contributionToTotal: number;
  hasRemainingWork: boolean;
  requiredAverageOnRemaining: number | null;
  isImpossible: boolean;
  isAlreadyAchieved: boolean;
}

export type ScenarioStatus =
  | 'achievable'
  | 'achievable_with_ec'
  | 'impossible'
  | 'already_achieved'
  | 'no_remaining_work';

export interface TargetResult {
  target: LetterGrade;
  targetPercentage: number;
  requiredAverage: number | null;
  maxAchievable: number;
  status: ScenarioStatus;
  categorySnapshots: CategorySnapshot[];
}

export interface CustomTargetResult {
  targetPercentage: number;
  requiredAverage: number | null;
  maxAchievable: number;
  status: ScenarioStatus;
}

export interface GradeRecoveryResult {
  currentGradePercentage: number;
  currentLetterGrade: LetterGrade;
  effectiveWeightSum: number;
  normalizedWeights: Record<string, number>;
  // Cached coefficients for O(1) scenario switching
  _numeratorConstant: number;
  _remainingCoefficient: number;
  // Per-target results (precomputed for all standard targets)
  targetResults: Record<LetterGrade, TargetResult>;
  // User-defined custom percentage targets
  customTargetResults: CustomTargetResult[];
}
