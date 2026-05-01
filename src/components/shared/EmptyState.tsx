import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-10 h-10 rounded-full bg-[var(--bg-raised)] flex items-center justify-center mb-4">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--text-tertiary)]">
          <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 5v3M8 10h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-[14px] font-medium text-[var(--text-primary)] mb-1">{title}</p>
      {description && (
        <p className="text-[13px] text-[var(--text-secondary)] mb-5 max-w-xs">{description}</p>
      )}
      {action}
    </div>
  );
}
