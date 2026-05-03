import { useMemo, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { StudentGPARecord, CourseEntry } from '../models/gpa';
import { DEFAULT_GRADE_SCALE } from '../models/gradeRecovery';
import {
  computeCumulativeAverage,
  computeSemesterAverage,
  computeImpactRanking,
  semesterNameFromDate,
} from '../lib/gpaCalculator';

function uuid(): string {
  return crypto.randomUUID();
}

const DEFAULT_RECORD: StudentGPARecord = {
  semesters: [],
};

// Map letter grades to percentage using the standard grade scale
const LETTER_TO_PCT: Record<string, number> = Object.fromEntries(
  DEFAULT_GRADE_SCALE.map((tier) => [tier.letter, tier.minPercentage]),
);

// Migrate old letter-grade format to percentage format
function migrateRecord(raw: unknown): StudentGPARecord {
  if (!raw || typeof raw !== 'object') return DEFAULT_RECORD;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.semesters)) return DEFAULT_RECORD;

  return {
    semesters: r.semesters.map((sem: unknown) => {
      const s = sem as Record<string, unknown>;
      return {
        id: String(s.id ?? uuid()),
        name: String(s.name ?? 'Unknown'),
        order: Number(s.order ?? 0),
        courses: Array.isArray(s.courses)
          ? s.courses.map((c: unknown) => {
              const course = c as Record<string, unknown>;
              let gradePercent: number | null = null;
              if (typeof course.gradePercent === 'number') {
                gradePercent = course.gradePercent;
              } else if (
                typeof course.letterGrade === 'string' &&
                course.letterGrade in LETTER_TO_PCT
              ) {
                gradePercent = LETTER_TO_PCT[course.letterGrade];
              }
              let scenarioGrade: number | null = null;
              if (typeof course.scenarioGrade === 'number') {
                scenarioGrade = course.scenarioGrade;
              } else if (
                typeof course.scenarioGrade === 'string' &&
                course.scenarioGrade in LETTER_TO_PCT
              ) {
                scenarioGrade = LETTER_TO_PCT[course.scenarioGrade];
              }
              return {
                id: String(course.id ?? uuid()),
                name: String(course.name ?? ''),
                creditHours: Number(course.creditHours ?? 3),
                gradePercent,
                isIncludedInGPA: course.isIncludedInGPA !== false,
                scenarioGrade,
              };
            })
          : [],
      };
    }),
  };
}

export function useGPATracker() {
  const [rawRecord, setRecord] = useLocalStorage<StudentGPARecord>(
    'clarify_gpa_tracker',
    DEFAULT_RECORD,
  );

  // Migrate legacy letter-grade data once on mount
  useEffect(() => {
    setRecord((prev) => {
      // Check if any course has no gradePercent and no valid structure
      // (i.e., old format survived JSON parse with wrong fields)
      const needsMigration = prev.semesters.some((s) =>
        s.courses.some((c) => {
          const raw = c as unknown as Record<string, unknown>;
          return (
            c.gradePercent === undefined &&
            typeof raw.letterGrade === 'string'
          );
        }),
      );
      if (!needsMigration) return prev;
      return migrateRecord(prev);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const record = rawRecord;

  const [scenarioMode, setScenarioModeState] = useLocalStorage<boolean>(
    'clarify_gpa_scenario',
    false,
  );

  const averageResult = useMemo(
    () => computeCumulativeAverage(record.semesters, scenarioMode),
    [record, scenarioMode],
  );

  const impactRanking = useMemo(
    () => computeImpactRanking(record.semesters),
    [record],
  );

  const semesterAverages = useMemo(
    () =>
      record.semesters.map((sem) => ({
        id: sem.id,
        average: computeSemesterAverage(sem, scenarioMode),
      })),
    [record, scenarioMode],
  );

  function addSemester(name?: string): string {
    const id = uuid();
    const semName = name ?? semesterNameFromDate();
    setRecord((prev) => ({
      ...prev,
      semesters: [
        { id, name: semName, order: 0, courses: [] },
        ...prev.semesters.map((s) => ({ ...s, order: s.order + 1 })),
      ],
    }));
    return id;
  }

  function deleteSemester(semesterId: string) {
    setRecord((prev) => ({
      ...prev,
      semesters: prev.semesters.filter((s) => s.id !== semesterId),
    }));
  }

  function renameSemester(semesterId: string, name: string) {
    setRecord((prev) => ({
      ...prev,
      semesters: prev.semesters.map((s) => (s.id === semesterId ? { ...s, name } : s)),
    }));
  }

  function addCourse(semesterId: string, partial: Partial<CourseEntry> = {}): string {
    const id = uuid();
    const course: CourseEntry = {
      id,
      name: '',
      creditHours: 3,
      gradePercent: null,
      isIncludedInGPA: true,
      scenarioGrade: null,
      ...partial,
    };
    setRecord((prev) => ({
      ...prev,
      semesters: prev.semesters.map((s) =>
        s.id === semesterId ? { ...s, courses: [...s.courses, course] } : s,
      ),
    }));
    return id;
  }

  function updateCourse(semesterId: string, courseId: string, patch: Partial<CourseEntry>) {
    setRecord((prev) => ({
      ...prev,
      semesters: prev.semesters.map((s) => {
        if (s.id !== semesterId) return s;
        return {
          ...s,
          courses: s.courses.map((c) => (c.id === courseId ? { ...c, ...patch } : c)),
        };
      }),
    }));
  }

  function deleteCourse(semesterId: string, courseId: string) {
    setRecord((prev) => ({
      ...prev,
      semesters: prev.semesters.map((s) =>
        s.id === semesterId
          ? { ...s, courses: s.courses.filter((c) => c.id !== courseId) }
          : s,
      ),
    }));
  }

  function toggleScenarioMode() {
    setScenarioModeState((on) => {
      if (!on) {
        setRecord((prev) => ({
          ...prev,
          semesters: prev.semesters.map((s) => ({
            ...s,
            courses: s.courses.map((c) => ({
              ...c,
              scenarioGrade: c.gradePercent,
            })),
          })),
        }));
      } else {
        setRecord((prev) => ({
          ...prev,
          semesters: prev.semesters.map((s) => ({
            ...s,
            courses: s.courses.map((c) => ({ ...c, scenarioGrade: null })),
          })),
        }));
      }
      return !on;
    });
  }

  function setScenarioGrade(semesterId: string, courseId: string, grade: number | null) {
    updateCourse(semesterId, courseId, { scenarioGrade: grade });
  }

  function applyScenarioAsActual() {
    setRecord((prev) => ({
      ...prev,
      semesters: prev.semesters.map((s) => ({
        ...s,
        courses: s.courses.map((c) => ({
          ...c,
          gradePercent: c.scenarioGrade ?? c.gradePercent,
          scenarioGrade: null,
        })),
      })),
    }));
    setScenarioModeState(false);
  }

  function resetScenarios() {
    setRecord((prev) => ({
      ...prev,
      semesters: prev.semesters.map((s) => ({
        ...s,
        courses: s.courses.map((c) => ({ ...c, scenarioGrade: c.gradePercent })),
      })),
    }));
  }

  function injectHandoffCourse(
    semesterId: string,
    courseName: string,
    gradePercent: number,
    creditHours?: number | null,
  ): string {
    const pct = Math.max(0, Math.min(100, gradePercent));
    return addCourse(semesterId, {
      name: courseName,
      gradePercent: pct,
      scenarioGrade: pct,
      ...(creditHours != null ? { creditHours } : { creditHours: 0 }),
    });
  }

  return {
    record,
    semesters: record.semesters,
    scenarioMode,
    averageGrade: averageResult.average,
    totalCredits: averageResult.totalCredits,
    impactRanking,
    semesterAverages,
    addSemester,
    deleteSemester,
    renameSemester,
    addCourse,
    updateCourse,
    deleteCourse,
    toggleScenarioMode,
    setScenarioGrade,
    applyScenarioAsActual,
    resetScenarios,
    injectHandoffCourse,
  };
}
