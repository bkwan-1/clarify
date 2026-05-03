export interface CourseEntry {
  id: string;
  name: string;
  creditHours: number;
  gradePercent: number | null;   // 0-100, null = in-progress
  isIncludedInGPA: boolean;
  scenarioGrade: number | null;  // scenario percentage
}

export interface Semester {
  id: string;
  name: string;
  order: number;
  courses: CourseEntry[];
}

export interface StudentGPARecord {
  semesters: Semester[];
}

export interface GPAImpactEntry {
  courseId: string;
  courseName: string;
  semesterId: string;
  semesterName: string;
  currentGrade: number;               // percentage 0-100
  averageWithoutThisCourse: number;
  averageImpactDelta: number;         // negative = hurts avg; sort ascending = worst first
  rankPosition: number;
}
