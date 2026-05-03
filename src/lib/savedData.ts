/**
 * Reads a snapshot of saved user data from localStorage without importing
 * React hooks. Safe to call anywhere — returns empty defaults on any error.
 */

export interface SavedDataSummary {
  hasGradeData: boolean;
  hasGPAData: boolean;
  gradeClassCount: number;
  gpaSemesterCount: number;
  gpaCoursesWithGrades: number;
}

const EMPTY: SavedDataSummary = {
  hasGradeData: false,
  hasGPAData: false,
  gradeClassCount: 0,
  gpaSemesterCount: 0,
  gpaCoursesWithGrades: 0,
};

export function readSavedDataSummary(): SavedDataSummary {
  try {
    const grRaw = localStorage.getItem('clarify_grade_recovery');
    const gpaRaw = localStorage.getItem('clarify_gpa_tracker');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const classes: any[] = grRaw ? (JSON.parse(grRaw)?.classes ?? []) : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const semesters: any[] = gpaRaw ? (JSON.parse(gpaRaw)?.semesters ?? []) : [];

    const gradeClassCount = classes.length;
    const gpaSemesterCount = semesters.length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gpaCoursesWithGrades: number = semesters.reduce((sum: number, s: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return sum + (s.courses ?? []).filter((c: any) => c.gradePercent !== null && c.gradePercent !== undefined).length;
    }, 0);

    return {
      hasGradeData: gradeClassCount > 0,
      hasGPAData: gpaCoursesWithGrades > 0,
      gradeClassCount,
      gpaSemesterCount,
      gpaCoursesWithGrades,
    };
  } catch {
    return EMPTY;
  }
}
