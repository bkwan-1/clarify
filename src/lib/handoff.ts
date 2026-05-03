import type { LetterGrade } from '../models/gradeRecovery';
import { percentageToLetterGrade } from './gradeRecoveryCalculator';
import type { CourseEntry } from '../models/gpa';
import type { GradeRecoveryClass } from '../models/gradeRecovery';

export interface GradeRecoveryToGPAHandoff {
  sourceClassId: string;
  sourceClassName: string;
  currentLetterGrade: LetterGrade;
  projectedLetterGrade: LetterGrade;
  projectedPercentage: number;
  requiredAverageOnRemaining: number | null;
  scenarioStatus: 'achievable' | 'impossible' | 'already_achieved' | 'no_remaining_work';
}

export function buildHandoff(
  cls: GradeRecoveryClass,
  targetPercentage: number,
  requiredAverage: number | null,
  currentLetterGrade: LetterGrade,
  scenarioStatus: 'achievable' | 'impossible' | 'already_achieved' | 'no_remaining_work',
): GradeRecoveryToGPAHandoff {
  const projectedLetterGrade = percentageToLetterGrade(targetPercentage, cls.gradeScale);
  return {
    sourceClassId: cls.id,
    sourceClassName: cls.name,
    currentLetterGrade,
    projectedLetterGrade,
    projectedPercentage: targetPercentage,
    requiredAverageOnRemaining: requiredAverage,
    scenarioStatus,
  };
}

export function handoffToCourseEntry(handoff: GradeRecoveryToGPAHandoff): Partial<CourseEntry> {
  return {
    name: handoff.sourceClassName,
    gradePercent: null,
    scenarioGrade: handoff.projectedPercentage,
    isIncludedInGPA: true,
    creditHours: 3,
  };
}
