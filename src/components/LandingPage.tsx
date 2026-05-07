import { useState, useEffect } from 'react';
import { ThemeToggle } from './shell/ThemeToggle';
import type { Theme } from '../hooks/useTheme';
import type { ActiveTool } from './shell/TopNav';

interface LandingPageProps {
  onStart: (tool: ActiveTool) => void;
  theme: Theme;
  onThemeToggle: () => void;
}

const FULL_TITLE = 'Clarify.';

export function LandingPage({ onStart, theme, onThemeToggle }: LandingPageProps) {
  const [displayed, setDisplayed] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    if (displayed.length >= FULL_TITLE.length) {
      const t = setTimeout(() => setCursorVisible(false), 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => setDisplayed(FULL_TITLE.slice(0, displayed.length + 1)),
      80
    );
    return () => clearTimeout(t);
  }, [displayed]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex flex-col"
      style={{ backgroundColor: '#0a0a0c' }}
    >
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-1.5 select-none">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-[13px] font-semibold text-white/90 tracking-tight">Clarify</span>
        </div>
        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-14">
        <div className="w-full max-w-[560px]">

          {/* Hero */}
          <div className="mb-12 text-center">
            <h1 className="text-[48px] sm:text-[64px] font-bold tracking-[-0.04em] leading-[1.05] mb-5 min-h-[1.1em]">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                {displayed}
              </span>
              {cursorVisible && (
                <span className="animate-pulse text-indigo-400 ml-0.5">|</span>
              )}
            </h1>
            <p className="text-[13px] font-semibold uppercase tracking-widest text-white/30 mb-3">
              Your academic toolkit
            </p>
            <p className="text-[16px] text-white/55 leading-relaxed max-w-[360px] mx-auto">
              Know exactly what you need — to pass, to hit your GPA, to finish strong.
            </p>
          </div>

          {/* Tool cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            <ToolCard
              onClick={() => onStart('grade-recovery')}
              label="Grade Recovery"
              subtext="What do I need to pass?"
              description="Calculate the minimum grades you need on finals to hit your target grade."
              accentColor="indigo"
            />
            <ToolCard
              onClick={() => onStart('gpa-tracker')}
              label="GPA Tracker"
              subtext="What's my GPA?"
              description="Track your grades across semesters and see exactly where you stand."
              accentColor="purple"
            />
          </div>

          {/* Privacy footer */}
          <div className="flex items-center justify-center gap-1.5 text-[12px] text-white/30">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="shrink-0">
              <path
                d="M6 1L2 3v3.5C2 9 3.8 11 6 12c2.2-1 4-3 4-5.5V3L6 1z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
            All data stays in your browser. Nothing is sent anywhere.
          </div>

        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tool card
// ---------------------------------------------------------------------------

function ToolCard({
  onClick,
  label,
  subtext,
  description,
  accentColor,
}: {
  onClick: () => void;
  label: string;
  subtext: string;
  description: string;
  accentColor: 'indigo' | 'purple';
}) {
  const isIndigo = accentColor === 'indigo';

  const borderBase = isIndigo ? 'border-indigo-500/25' : 'border-purple-500/25';
  const bgBase = isIndigo ? 'bg-indigo-950/20' : 'bg-purple-950/20';
  const borderHover = isIndigo
    ? 'hover:border-indigo-500/60 hover:shadow-[0_0_24px_rgba(99,102,241,0.3)]'
    : 'hover:border-purple-500/60 hover:shadow-[0_0_24px_rgba(168,85,247,0.3)]';
  const accentText = isIndigo ? 'text-indigo-400' : 'text-purple-400';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full text-left p-6 rounded-[12px] border ${borderBase} ${bgBase} ${borderHover} transition-all duration-200 flex flex-col gap-4`}
    >
      <div>
        <p className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${accentText}`}>
          {label}
        </p>
        <p className="text-[20px] font-semibold text-white leading-snug tracking-tight">
          {subtext}
        </p>
      </div>

      <p className="text-[13px] text-white/50 leading-relaxed flex-1">
        {description}
      </p>

      <div className={`flex items-center gap-1.5 text-[13px] font-medium ${accentText}`}>
        Open Tool
        <svg
          width="13"
          height="13"
          viewBox="0 0 12 12"
          fill="none"
          className="transition-transform duration-150 group-hover:translate-x-1"
        >
          <path
            d="M2 6h8M7 3l3 3-3 3"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </button>
  );
}
