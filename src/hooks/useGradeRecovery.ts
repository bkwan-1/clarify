import { useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { GradeRecoveryClass, GradeCategory } from '../models/gradeRecovery';
import { DEFAULT_GRADE_SCALE } from '../models/gradeRecovery';
import { computeGradeRecoveryResult } from '../lib/gradeRecoveryCalculator';

function uuid(): string {
  return crypto.randomUUID();
}

interface GradeRecoveryStore {
  classes: GradeRecoveryClass[];
  activeClassId: string | null;
}

const DEFAULT_STORE: GradeRecoveryStore = { classes: [], activeClassId: null };

export function useGradeRecovery() {
  const [store, setStore] = useLocalStorage<GradeRecoveryStore>(
    'clarify_grade_recovery',
    DEFAULT_STORE,
  );

  const activeClass = useMemo(
    () => store.classes.find((c) => c.id === store.activeClassId) ?? store.classes[0] ?? null,
    [store],
  );

  const result = useMemo(
    () => (activeClass ? computeGradeRecoveryResult(activeClass) : null),
    [activeClass],
  );

  function addClass(
    name: string,
    structure: GradeRecoveryClass['structure'],
    categories: Pick<GradeCategory, 'name' | 'weight'>[],
  ): string {
    const id = uuid();
    const cats: GradeCategory[] = categories.map((c) => ({
      id: uuid(),
      name: c.name,
      weight: c.weight,
      dropLowest: 0,
      completedAssignments: [],
      remainingAssignments: [],
    }));

    // For points/simple structure, create a single "Total" category
    const finalCats =
      structure === 'weighted'
        ? cats
        : [
            {
              id: uuid(),
              name: 'Total',
              weight: 100,
              dropLowest: 0,
              completedAssignments: [],
              remainingAssignments: [],
            },
          ];

    const newClass: GradeRecoveryClass = {
      id,
      name,
      structure,
      categories: finalCats,
      activeTarget: 'A',
      activeTargets: ['A', 'B', 'C'],
      normalizeWeights: true,
      gradeScale: DEFAULT_GRADE_SCALE,
    };

    setStore((prev) => ({
      classes: [...prev.classes, newClass],
      activeClassId: id,
    }));
    return id;
  }

  function deleteClass(id: string) {
    setStore((prev) => {
      const remaining = prev.classes.filter((c) => c.id !== id);
      return {
        classes: remaining,
        activeClassId: prev.activeClassId === id ? (remaining[0]?.id ?? null) : prev.activeClassId,
      };
    });
  }

  function renameClass(id: string, name: string) {
    setStore((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => (c.id === id ? { ...c, name } : c)),
    }));
  }

  function setActiveClass(id: string) {
    setStore((prev) => ({ ...prev, activeClassId: id }));
  }

  function updateClass(updated: GradeRecoveryClass) {
    setStore((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => (c.id === updated.id ? updated : c)),
    }));
  }

  function addAssignment(
    classId: string,
    categoryId: string,
    earned: number | undefined,
    total: number,
    label?: string,
  ) {
    setStore((prev) => ({
      ...prev,
      classes: prev.classes.map((cls) => {
        if (cls.id !== classId) return cls;
        return {
          ...cls,
          categories: cls.categories.map((cat) => {
            if (cat.id !== categoryId) return cat;
            const newA = {
              id: uuid(),
              label: label ?? `Assignment ${cat.completedAssignments.length + 1}`,
              mode: 'points' as const,
              earnedPoints: earned,
              totalPoints: total,
              isDropped: false,
            };
            return { ...cat, completedAssignments: [...cat.completedAssignments, newA] };
          }),
        };
      }),
    }));
  }

  function updateAssignment(
    classId: string,
    categoryId: string,
    assignmentId: string,
    patch: Partial<GradeCategory['completedAssignments'][0]>,
  ) {
    setStore((prev) => ({
      ...prev,
      classes: prev.classes.map((cls) => {
        if (cls.id !== classId) return cls;
        return {
          ...cls,
          categories: cls.categories.map((cat) => {
            if (cat.id !== categoryId) return cat;
            return {
              ...cat,
              completedAssignments: cat.completedAssignments.map((a) =>
                a.id === assignmentId ? { ...a, ...patch } : a,
              ),
            };
          }),
        };
      }),
    }));
  }

  function deleteAssignment(classId: string, categoryId: string, assignmentId: string) {
    setStore((prev) => ({
      ...prev,
      classes: prev.classes.map((cls) => {
        if (cls.id !== classId) return cls;
        return {
          ...cls,
          categories: cls.categories.map((cat) => {
            if (cat.id !== categoryId) return cat;
            return {
              ...cat,
              completedAssignments: cat.completedAssignments.filter((a) => a.id !== assignmentId),
            };
          }),
        };
      }),
    }));
  }

  function addRemainingAssignment(
    classId: string,
    categoryId: string,
    pointValue: number,
    label?: string,
    isExtraCredit = false,
  ) {
    setStore((prev) => ({
      ...prev,
      classes: prev.classes.map((cls) => {
        if (cls.id !== classId) return cls;
        return {
          ...cls,
          categories: cls.categories.map((cat) => {
            if (cat.id !== categoryId) return cat;
            const newR = {
              id: uuid(),
              label: label ?? `Assignment ${cat.remainingAssignments.length + 1}`,
              pointValue,
              isExtraCredit,
            };
            return { ...cat, remainingAssignments: [...cat.remainingAssignments, newR] };
          }),
        };
      }),
    }));
  }

  function updateRemainingAssignment(
    classId: string,
    categoryId: string,
    assignmentId: string,
    patch: Partial<GradeCategory['remainingAssignments'][0]>,
  ) {
    setStore((prev) => ({
      ...prev,
      classes: prev.classes.map((cls) => {
        if (cls.id !== classId) return cls;
        return {
          ...cls,
          categories: cls.categories.map((cat) => {
            if (cat.id !== categoryId) return cat;
            return {
              ...cat,
              remainingAssignments: cat.remainingAssignments.map((r) =>
                r.id === assignmentId ? { ...r, ...patch } : r,
              ),
            };
          }),
        };
      }),
    }));
  }

  function deleteRemainingAssignment(classId: string, categoryId: string, assignmentId: string) {
    setStore((prev) => ({
      ...prev,
      classes: prev.classes.map((cls) => {
        if (cls.id !== classId) return cls;
        return {
          ...cls,
          categories: cls.categories.map((cat) => {
            if (cat.id !== categoryId) return cat;
            return {
              ...cat,
              remainingAssignments: cat.remainingAssignments.filter((r) => r.id !== assignmentId),
            };
          }),
        };
      }),
    }));
  }

  function setActiveTargets(classId: string, targets: GradeRecoveryClass['activeTargets']) {
    setStore((prev) => ({
      ...prev,
      classes: prev.classes.map((c) =>
        c.id === classId ? { ...c, activeTargets: targets } : c,
      ),
    }));
  }

  return {
    classes: store.classes,
    activeClassId: store.activeClassId,
    activeClass,
    result,
    addClass,
    deleteClass,
    renameClass,
    setActiveClass,
    updateClass,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    addRemainingAssignment,
    updateRemainingAssignment,
    deleteRemainingAssignment,
    setActiveTargets,
  };
}
