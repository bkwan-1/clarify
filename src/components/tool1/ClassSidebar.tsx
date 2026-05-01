import { useState } from 'react';
import type { GradeRecoveryClass } from '../../models/gradeRecovery';
import { Badge } from '../shared/Badge';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface ClassSidebarProps {
  classes: GradeRecoveryClass[];
  activeClassId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  currentGrades: Record<string, number>;
}

export function ClassSidebar({
  classes,
  activeClassId,
  onSelect,
  onAdd,
  onDelete,
  onRename,
  currentGrades,
}: ClassSidebarProps) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  return (
    <aside className="w-[220px] shrink-0 border-r border-[var(--border)] flex flex-col h-full overflow-y-auto">
      <div className="px-3 py-3 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-[6px] border border-dashed border-[var(--border)] text-[12px] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-muted)] transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add class
        </button>
      </div>

      <div className="flex-1 py-2">
        {classes.length === 0 && (
          <p className="px-4 py-3 text-[12px] text-[var(--text-tertiary)]">No classes yet.</p>
        )}
        {classes.map((cls) => {
          const grade = currentGrades[cls.id];
          const active = cls.id === activeClassId;

          if (renamingId === cls.id) {
            return (
              <div key={cls.id} className="px-3 py-1.5">
                <input
                  autoFocus
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => {
                    if (renameValue.trim()) onRename(cls.id, renameValue.trim());
                    setRenamingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (renameValue.trim()) onRename(cls.id, renameValue.trim());
                      setRenamingId(null);
                    }
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  className="w-full px-2 py-1 rounded-[6px] border border-[var(--accent)] bg-[var(--bg-raised)] text-[13px] outline-none"
                />
              </div>
            );
          }

          return (
            <button
              key={cls.id}
              type="button"
              onClick={() => onSelect(cls.id)}
              onDoubleClick={() => {
                setRenamingId(cls.id);
                setRenameValue(cls.name);
              }}
              className={`group w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                active
                  ? 'bg-[var(--accent-muted)] border-l-2 border-[var(--accent)] text-[var(--text-primary)]'
                  : 'border-l-2 border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="truncate text-[13px] font-medium">{cls.name}</span>
              <div className="flex items-center gap-1.5 ml-2">
                {grade !== undefined && (
                  <Badge value={Math.round(grade)} variant="auto" />
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(cls.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-all"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </button>
          );
        })}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && onDelete(deleteTarget)}
        title="Delete class?"
        description="This will permanently remove the class and all its grade data."
        confirmLabel="Delete"
        destructive
      />
    </aside>
  );
}
