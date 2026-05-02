import { ThemeToggle } from './ThemeToggle';
import type { Theme } from '../../hooks/useTheme';

export type ActiveTool = 'grade-recovery' | 'gpa-tracker';

interface TopNavProps {
  activeTool: ActiveTool;
  onSwitch: (tool: ActiveTool) => void;
  theme: Theme;
  onThemeToggle: () => void;
  onLogoClick: () => void;
  onInfoClick: () => void;
  hasGradeData: boolean;
  hasGPAData: boolean;
}

const TOOLS: { id: ActiveTool; label: string; shortLabel: string }[] = [
  { id: 'grade-recovery', label: 'Grade Recovery', shortLabel: 'Grades' },
  { id: 'gpa-tracker', label: 'GPA Tracker', shortLabel: 'GPA' },
];

export function TopNav({
  activeTool,
  onSwitch,
  theme,
  onThemeToggle,
  onLogoClick,
  onInfoClick,
  hasGradeData,
  hasGPAData,
}: TopNavProps) {
  const dataMap: Record<ActiveTool, boolean> = {
    'grade-recovery': hasGradeData,
    'gpa-tracker': hasGPAData,
  };

  return (
    <nav className="sticky top-0 z-30 h-[52px] flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--bg-base)]/90 backdrop-blur-sm">
      {/* Logo — doubles as home button */}
      <button
        type="button"
        onClick={onLogoClick}
        className="flex items-center gap-1.5 select-none hover:opacity-75 transition-opacity"
      >
        <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
        <span className="text-[13px] font-semibold text-[var(--text-primary)] tracking-tight">
          Clarify
        </span>
      </button>

      {/* Tool tabs — hidden on mobile; BottomNav handles switching there */}
      <div className="hidden sm:flex items-center gap-1">
        {TOOLS.map(({ id, label, shortLabel }) => {
          const active = activeTool === id;
          const hasData = dataMap[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSwitch(id)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-[6px] transition-colors duration-100 ${
                active
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <span className="hidden md:inline">{label}</span>
              <span className="md:hidden">{shortLabel}</span>

              {/* Saved-data dot */}
              {hasData && (
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    active ? 'bg-[var(--accent)]' : 'bg-[var(--text-tertiary)]'
                  }`}
                />
              )}

              {active && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[var(--accent)] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onInfoClick}
          aria-label="How it works"
          className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M7 6.5v4M7 4.5h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>

        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
      </div>
    </nav>
  );
}
