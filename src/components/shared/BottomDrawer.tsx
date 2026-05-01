import { useState } from 'react';
import type { ReactNode } from 'react';

interface BottomDrawerProps {
  collapsedContent: ReactNode;
  children: ReactNode;
}

export function BottomDrawer({ collapsedContent, children }: BottomDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface)] border-t border-[var(--border)] transition-all duration-200 ease-out ${open ? 'h-[60vh]' : 'h-[52px]'}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-[52px] flex items-center justify-between px-4 text-[13px] text-[var(--text-primary)]"
      >
        <span>{collapsedContent}</span>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className={`text-[var(--text-tertiary)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M3 10L8 5L13 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="h-[calc(60vh-52px)] overflow-y-auto px-4 pb-6">{children}</div>
      )}
    </div>
  );
}
