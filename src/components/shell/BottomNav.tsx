import type { ActiveTool } from './TopNav';

interface BottomNavProps {
  activeTool: ActiveTool;
  onSwitch: (tool: ActiveTool) => void;
  hasGradeData: boolean;
  hasGPAData: boolean;
}

const TOOLS: {
  id: ActiveTool;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}[] = [
  {
    id: 'grade-recovery',
    label: 'Grades',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect
          x="3" y="11" width="3" height="6" rx="1"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth="1.3"
        />
        <rect
          x="8.5" y="7" width="3" height="10" rx="1"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth="1.3"
        />
        <rect
          x="14" y="3" width="3" height="14" rx="1"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth="1.3"
        />
      </svg>
    ),
  },
  {
    id: 'gpa-tracker',
    label: 'GPA',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M3 14l4-5 3.5 3L14 7l3 3"
          stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
          strokeOpacity={active ? 1 : 0.7}
        />
        <circle
          cx="17" cy="10" r="2"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth="1.3"
        />
      </svg>
    ),
  },
];

export function BottomNav({ activeTool, onSwitch, hasGradeData, hasGPAData }: BottomNavProps) {
  const dataMap: Record<ActiveTool, boolean> = {
    'grade-recovery': hasGradeData,
    'gpa-tracker': hasGPAData,
  };

  return (
    <nav className="sm:hidden h-[60px] shrink-0 border-t border-[var(--border)] bg-[var(--bg-base)]/95 backdrop-blur-sm flex items-stretch">
      {TOOLS.map(({ id, label, icon }) => {
        const active = activeTool === id;
        const hasData = dataMap[id];
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSwitch(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
              active ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <div className="relative">
              {icon(active)}
              {/* Data dot */}
              {hasData && (
                <span
                  className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${
                    active ? 'bg-[var(--accent)]' : 'bg-[var(--text-tertiary)]'
                  }`}
                />
              )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
