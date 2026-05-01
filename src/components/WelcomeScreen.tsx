import type { ActiveTool } from './shell/TopNav';

interface WelcomeScreenProps {
  onStart: (tool: ActiveTool) => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-6 bg-[var(--bg-base)]/90 backdrop-blur-md">
      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-10">
        {/* Left — hero */}
        <div className="sm:col-span-3 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
            <span className="text-[13px] font-semibold text-[var(--accent)] tracking-tight">Clarify</span>
          </div>
          <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-[-0.04em] text-[var(--text-primary)] leading-[1.1] mb-3">
            Know exactly<br />what you need.
          </h1>
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-8 max-w-xs">
            Grade recovery and GPA tracking for students who take their numbers seriously.
          </p>
          <button
            type="button"
            onClick={() => onStart('grade-recovery')}
            className="self-start flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white text-[13px] font-medium rounded-[8px] hover:opacity-90 transition-opacity"
          >
            Get started
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Right — tool cards */}
        <div className="sm:col-span-2 flex flex-col gap-3">
          <ToolCard
            icon="📊"
            title="Grade Recovery"
            description="What do I need to pass?"
            detail="Enter your grades and see exactly what score you need."
            onClick={() => onStart('grade-recovery')}
          />
          <ToolCard
            icon="🎓"
            title="GPA Tracker"
            description="What's my GPA right now?"
            detail="Track every semester, run scenarios, see what's hurting you."
            onClick={() => onStart('gpa-tracker')}
          />
        </div>
      </div>
    </div>
  );
}

function ToolCard({
  icon,
  title,
  description,
  detail,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left p-4 rounded-[10px] border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--accent)] hover:bg-[var(--accent-muted)] transition-all duration-150 group"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-[13px] font-semibold text-[var(--text-primary)] tracking-tight">
          {title}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto opacity-0 group-hover:opacity-100 text-[var(--accent)] transition-opacity">
          <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-[12px] font-medium text-[var(--accent)] mb-1">{description}</p>
      <p className="text-[12px] text-[var(--text-secondary)]">{detail}</p>
    </button>
  );
}
