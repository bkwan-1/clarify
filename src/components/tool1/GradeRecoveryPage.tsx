import { useState } from 'react';
import type { GradeRecoveryClass, LetterGrade } from '../../models/gradeRecovery';
import { ClassSidebar } from './ClassSidebar';
import { ResultsPanel } from './ResultsPanel';
import { CategoryBlock } from './CategoryBlock';
import { NewClassModal } from './NewClassModal';
import { EmptyState } from '../shared/EmptyState';
import { BottomDrawer } from '../shared/BottomDrawer';
import type { ActiveTool } from '../shell/TopNav';
import { useGradeRecovery } from '../../hooks/useGradeRecovery';

interface GradeRecoveryPageProps {
  onSwitchTool: (tool: ActiveTool) => void;
  onHandoff: (className: string, projectedGrade: LetterGrade) => void;
}

export function GradeRecoveryPage({ onSwitchTool, onHandoff }: GradeRecoveryPageProps) {
  const {
    classes,
    activeClassId,
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
  } = useGradeRecovery();

  const [showNewClassModal, setShowNewClassModal] = useState(false);
  const currentGrades: Record<string, number> = {};
  for (const cls of classes) {
    if (result && cls.id === activeClassId && result.currentGradePercentage !== undefined) {
      currentGrades[cls.id] = result.currentGradePercentage;
    }
  }

  function handleSendToGPA() {
    if (!activeClass || !result) return;
    const firstActiveTarget = activeClass.activeTargets[0] ?? 'B';
    const targetResult = result.targetResults[firstActiveTarget];
    if (targetResult) {
      onHandoff(activeClass.name, firstActiveTarget);
    }
  }

  function handleToggleTarget(t: LetterGrade) {
    if (!activeClass) return;
    const current = activeClass.activeTargets;
    const updated = current.includes(t)
      ? current.filter((x) => x !== t)
      : [...current, t];
    setActiveTargets(activeClass.id, updated as LetterGrade[]);
  }

  const mainContent = (
    <div className="flex-1 overflow-y-auto p-5">
      {!activeClass ? (
        <EmptyState
          title="No class selected"
          description="Add a class from the sidebar to get started."
          action={
            <button
              type="button"
              onClick={() => setShowNewClassModal(true)}
              className="px-4 py-2 bg-[var(--accent)] text-white text-[13px] font-medium rounded-[8px] hover:opacity-90 transition-opacity"
            >
              + Add your first class
            </button>
          }
        />
      ) : (
        <ClassDetailContent
          cls={activeClass}
          onUpdateClass={updateClass}
          onAddAssignment={addAssignment}
          onUpdateAssignment={updateAssignment}
          onDeleteAssignment={deleteAssignment}
          onAddRemaining={addRemainingAssignment}
          onUpdateRemaining={updateRemainingAssignment}
          onDeleteRemaining={deleteRemainingAssignment}
        />
      )}
    </div>
  );

  const resultsContent = activeClass && result ? (
    <ResultsPanel
      cls={activeClass}
      result={result}
      onToggleTarget={handleToggleTarget}
      onSendToGPA={handleSendToGPA}
      onSwitchTool={onSwitchTool}
    />
  ) : null;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        {classes.length > 0 || true ? (
          <ClassSidebar
            classes={classes}
            activeClassId={activeClassId}
            onSelect={setActiveClass}
            onAdd={() => setShowNewClassModal(true)}
            onDelete={deleteClass}
            onRename={renameClass}
            currentGrades={currentGrades}
          />
        ) : null}
      </div>

      {/* Mobile chip bar */}
      <div className="md:hidden flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] overflow-x-auto shrink-0">
        {classes.map((cls) => (
          <button
            key={cls.id}
            type="button"
            onClick={() => setActiveClass(cls.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
              cls.id === activeClassId
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            {cls.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowNewClassModal(true)}
          className="shrink-0 px-3 py-1.5 rounded-full text-[12px] text-[var(--accent)] border border-dashed border-[var(--accent)]"
        >
          + Add
        </button>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {mainContent}
        {/* Desktop results panel */}
        <div className="hidden lg:flex">{resultsContent}</div>
      </div>

      {/* Mobile results drawer */}
      {activeClass && result && (
        <div className="lg:hidden">
          <BottomDrawer
            collapsedContent={
              <span className="text-[13px]">
                Current: <span className="font-semibold tabular-nums">{result.currentGradePercentage.toFixed(1)}%</span>
                {' '}· Tap for targets
              </span>
            }
          >
            <ResultsPanel
              cls={activeClass}
              result={result}
              onToggleTarget={handleToggleTarget}
              onSendToGPA={handleSendToGPA}
              onSwitchTool={onSwitchTool}
            />
          </BottomDrawer>
        </div>
      )}

      <NewClassModal
        open={showNewClassModal}
        onClose={() => setShowNewClassModal(false)}
        onSubmit={(name, structure, categories) => addClass(name, structure, categories)}
      />
    </div>
  );
}

function ClassDetailContent({
  cls,
  onUpdateClass,
  onAddAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onAddRemaining,
  onUpdateRemaining,
  onDeleteRemaining,
}: {
  cls: GradeRecoveryClass;
  onUpdateClass: (c: GradeRecoveryClass) => void;
  onAddAssignment: (classId: string, catId: string, earned: number | undefined, total: number, label?: string) => void;
  onUpdateAssignment: (classId: string, catId: string, assignId: string, patch: Partial<GradeRecoveryClass['categories'][0]['completedAssignments'][0]>) => void;
  onDeleteAssignment: (classId: string, catId: string, assignId: string) => void;
  onAddRemaining: (classId: string, catId: string, pv: number, label?: string) => void;
  onUpdateRemaining: (classId: string, catId: string, rId: string, patch: Partial<GradeRecoveryClass['categories'][0]['remainingAssignments'][0]>) => void;
  onDeleteRemaining: (classId: string, catId: string, rId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'completed' | 'remaining'>('completed');

  return (
    <div className="flex flex-col gap-0 w-full">
      {/* Class header */}
      <div className="flex items-center gap-3 mb-5">
        <input
          type="text"
          value={cls.name}
          onChange={(e) => onUpdateClass({ ...cls, name: e.target.value })}
          className="text-[20px] font-semibold tracking-tight text-[var(--text-primary)] bg-transparent outline-none border-b border-transparent hover:border-[var(--border)] focus:border-[var(--accent)] transition-colors pb-0.5"
        />
        <span className="text-[12px] text-[var(--text-tertiary)] capitalize">{cls.structure}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)] mb-5">
        {(['completed', 'remaining'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-[13px] font-medium capitalize transition-colors relative ${
              activeTab === tab
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab === 'completed' ? 'Completed Grades' : 'Upcoming Work'}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Category blocks */}
      <div className="flex flex-col gap-1">
        {cls.categories.map((cat) => (
          <CategoryBlock
            key={cat.id}
            category={cat}
            mode={activeTab}
            onUpdateAssignment={(aId, patch) => onUpdateAssignment(cls.id, cat.id, aId, patch)}
            onDeleteAssignment={(aId) => onDeleteAssignment(cls.id, cat.id, aId)}
            onAddAssignment={() => onAddAssignment(cls.id, cat.id, undefined, 100)}
            onUpdateRemaining={(rId, patch) => onUpdateRemaining(cls.id, cat.id, rId, patch)}
            onDeleteRemaining={(rId) => onDeleteRemaining(cls.id, cat.id, rId)}
            onAddRemaining={() => onAddRemaining(cls.id, cat.id, 100)}
            onUpdateCategory={(patch) =>
              onUpdateClass({
                ...cls,
                categories: cls.categories.map((c) =>
                  c.id === cat.id ? { ...c, ...patch } : c,
                ),
              })
            }
          />
        ))}
      </div>

      {/* Add category button */}
      <button
        type="button"
        onClick={() => {
          const newCat = {
            id: crypto.randomUUID(),
            name: 'New Category',
            weight: 0,
            dropLowest: 0,
            completedAssignments: [],
            remainingAssignments: [],
          };
          onUpdateClass({ ...cls, categories: [...cls.categories, newCat] });
        }}
        className="mt-4 text-[12px] text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors self-start"
      >
        + Add category
      </button>
    </div>
  );
}
