import type { LetterGrade } from './gradeRecovery';
export type { LetterGrade };

export type CourseWeight = 'standard' | 'honors' | 'AP' | 'IB' | 'college';

export interface CourseEntry {
  id: string;
  name: string;
  creditHours: number;
  letterGrade: LetterGrade | null;   // null = in-progress
  courseWeight: CourseWeight;
  isIncludedInGPA: boolean;
  scenarioGrade: LetterGrade | null; // never mutate letterGrade when in scenario mode
}

export interface Semester {
  id: string;
  name: string;
  order: number; // 0 = most recent
  courses: CourseEntry[];
}

export type WeightedScale = 'plus-half' | 'five-point';

export interface StudentGPARecord {
  semesters: Semester[];
  weightedScale: WeightedScale;
}

export interface GPAImpactEntry {
  courseId: string;
  courseName: string;
  semesterId: string;
  semesterName: string;
  currentGrade: LetterGrade;
  currentGradePoints: number;
  gpaWithoutThisCourse: number;
  gpaImpactDelta: number; // negative = hurts GPA; sort ascending = worst first
  rankPosition: number;
}

export const STANDARD_GRADE_POINTS: Record<LetterGrade, number> = {
  'A+': 4.0,
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D': 1.0,
  'D-': 0.7,
  'F': 0.0,
};

export const WEIGHT_BONUS: Record<CourseWeight, number> = {
  standard: 0.0,
  honors: 0.5,
  AP: 1.0,
  IB: 1.0,
  college: 1.0,
};

export const ALL_LETTER_GRADES: LetterGrade[] = [
  'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F',
];
