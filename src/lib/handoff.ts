import type { LetterGrade } from '../models/gradeRecovery';
import { percentageToLetterGrade } from './gradeRecoveryCalculator';
import type { CourseEntry, CourseWeight } from '../models/gpa';
import type { GradeRecoveryClass } from '../models/gradeRecovery';

export interface GradeRecoveryToGPAHandoff {
  sourceClassId: string;
  sourceClassName: string;
  courseWeight: CourseWeight;
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
    courseWeight: 'standard',
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
    courseWeight: handoff.courseWeight,
    scenarioGrade: handoff.projectedLetterGrade,
    letterGrade: null,
    isIncludedInGPA: true,
    creditHours: 3, // default; user will update
  };
}
