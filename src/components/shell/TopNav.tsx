import type { ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle';
import type { Theme } from '../../hooks/useTheme';

export type ActiveTool = 'grade-recovery' | 'gpa-tracker';

interface TopNavProps {
  activeTool: ActiveTool;
  onSwitch: (tool: ActiveTool) => void;
  theme: Theme;
  onThemeToggle: () => void;
  rightSlot?: ReactNode;
}

export function TopNav({ activeTool, onSwitch, theme, onThemeToggle }: TopNavProps) {
  return (
    <nav className="sticky top-0 z-30 h-[52px] flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex items-center gap-1.5 select-none">
        <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
        <span className="text-[13px] font-semibold text-[var(--text-primary)] tracking-tight">
          Clarify
        </span>
      </div>

      {/* Tool tabs */}
      <div className="flex items-center gap-1">
        {(['grade-recovery', 'gpa-tracker'] as ActiveTool[]).map((tool) => {
          const label = tool === 'grade-recovery' ? 'Grade Recovery' : 'GPA Tracker';
          const active = activeTool === tool;
          return (
            <button
              key={tool}
              type="button"
              onClick={() => onSwitch(tool)}
              className={`relative px-3 py-1.5 text-[13px] font-medium rounded-[6px] transition-colors duration-100 ${
                active
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {label}
              {active && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[var(--accent)] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right: theme toggle */}
      <ThemeToggle theme={theme} onToggle={onThemeToggle} />
    </nav>
  );
}
