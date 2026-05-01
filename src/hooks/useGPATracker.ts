import { useMemo, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { StudentGPARecord, CourseEntry } from '../models/gpa';
import type { LetterGrade } from '../models/gradeRecovery';
import {
  computeCumulativeGPA,
  computeSemesterGPA,
  computeGPAImpactRanking,
  semesterNameFromDate,
} from '../lib/gpaCalculator';

function uuid(): string {
  return crypto.randomUUID();
}

const DEFAULT_RECORD: StudentGPARecord = {
  semesters: [],
  weightedScale: 'plus-half',
};

export function useGPATracker() {
  const [record, setRecord] = useLocalStorage<StudentGPARecord>(
    'clarify_gpa_tracker',
    DEFAULT_RECORD,
  );
  const [scenarioMode, setScenarioMode] = useState(false);

  const unweightedResult = useMemo(
    () => computeCumulativeGPA(record.semesters, false, scenarioMode, record.weightedScale),
    [record, scenarioMode],
  );
  const weightedResult = useMemo(
    () => computeCumulativeGPA(record.semesters, true, scenarioMode, record.weightedScale),
    [record, scenarioMode],
  );
  const impactRanking = useMemo(
    () => computeGPAImpactRanking(record.semesters, true, record.weightedScale),
    [record],
  );

  const semesterGPAs = useMemo(
    () =>
      record.semesters.map((sem) => ({
        id: sem.id,
        unweighted: computeSemesterGPA(sem, false, scenarioMode, record.weightedScale),
        weighted: computeSemesterGPA(sem, true, scenarioMode, record.weightedScale),
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
      letterGrade: null,
      courseWeight: 'standard',
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
    setScenarioMode((on) => {
      if (!on) {
        // Entering scenario mode: copy letterGrade → scenarioGrade for all
        setRecord((prev) => ({
          ...prev,
          semesters: prev.semesters.map((s) => ({
            ...s,
            courses: s.courses.map((c) => ({
              ...c,
              scenarioGrade: c.letterGrade,
            })),
          })),
        }));
      } else {
        // Leaving: clear all scenario grades
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

  function setScenarioGrade(semesterId: string, courseId: string, grade: LetterGrade | null) {
    updateCourse(semesterId, courseId, { scenarioGrade: grade });
  }

  function applyScenarioAsActual() {
    setRecord((prev) => ({
      ...prev,
      semesters: prev.semesters.map((s) => ({
        ...s,
        courses: s.courses.map((c) => ({
          ...c,
          letterGrade: c.scenarioGrade ?? c.letterGrade,
          scenarioGrade: null,
        })),
      })),
    }));
    setScenarioMode(false);
  }

  function resetScenarios() {
    setRecord((prev) => ({
      ...prev,
      semesters: prev.semesters.map((s) => ({
        ...s,
        courses: s.courses.map((c) => ({ ...c, scenarioGrade: c.letterGrade })),
      })),
    }));
  }

  function injectHandoffCourse(
    semesterId: string,
    courseName: string,
    projectedGrade: LetterGrade,
  ): string {
    return addCourse(semesterId, {
      name: courseName,
      scenarioGrade: projectedGrade,
      letterGrade: null,
    });
  }

  return {
    record,
    semesters: record.semesters,
    scenarioMode,
    unweightedGPA: unweightedResult.gpa,
    weightedGPA: weightedResult.gpa,
    totalCredits: unweightedResult.totalCredits,
    impactRanking,
    semesterGPAs,
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
