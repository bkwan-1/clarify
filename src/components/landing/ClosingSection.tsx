import { Reveal } from './Reveal';
import type { ActiveTool } from '../shell/TopNav';

interface ClosingSectionProps {
  onStart: (tool: ActiveTool) => void;
}

export function ClosingSection({ onStart }: ClosingSectionProps) {
  return (
    <section className="relative px-6 sm:px-12 py-24 sm:py-32 max-w-[640px] mx-auto text-center">
      <Reveal variant="fade-up">
        <div className="flex items-center justify-center gap-1.5 text-[12px] text-white/40 mb-3">
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
        <p className="text-[13px] text-white/30 leading-relaxed max-w-[480px] mx-auto mb-20 sm:mb-24">
          We store four things in localStorage: your grade-recovery classes,
          your GPA semesters, your theme preference, and which tool you had
          open last. That's it — check devtools if you don't believe us.
        </p>
      </Reveal>

      <Reveal variant="fade-up" delay={80}>
        <h2 className="text-[36px] sm:text-[48px] font-bold tracking-[-0.03em] text-white mb-6">
          Pick your question.
        </h2>
        <div className="flex items-center justify-center gap-3 text-[15px] font-medium">
          <button
            type="button"
            onClick={() => onStart('grade-recovery')}
            className="text-indigo-400 hover:text-indigo-300 underline-offset-4 hover:underline transition-colors"
          >
            Grade Recovery
          </button>
          <span className="text-white/20">·</span>
          <button
            type="button"
            onClick={() => onStart('gpa-tracker')}
            className="text-purple-400 hover:text-purple-300 underline-offset-4 hover:underline transition-colors"
          >
            GPA Tracker
          </button>
        </div>
      </Reveal>

      <Reveal variant="fade-in" delay={160}>
        <p className="mt-20 sm:mt-24 text-[12px] text-white/20">
          No analytics are watching you read this.
        </p>
      </Reveal>
    </section>
  );
}
