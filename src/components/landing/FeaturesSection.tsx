import { Reveal } from './Reveal';
import { SpecList } from './SpecList';
import type { ActiveTool } from '../shell/TopNav';

interface FeaturesSectionProps {
  onStart: (tool: ActiveTool) => void;
}

const GRADE_RECOVERY_SPECS = [
  'Weighted or points-based grading per category',
  'Drop-lowest scores, automatically',
  'A / B / C / D — or your own custom target — all at once',
  'Flags targets that are already locked in, or already out of reach',
  'Send a finished course straight to GPA Tracker',
];

const GPA_TRACKER_SPECS = [
  'Multi-semester tracking',
  'Honors (+0.5) and AP/IB (+1.0) weighting, capped at 5.0',
  'Credit-weighted cumulative GPA — not an average of semester GPAs',
  'Per-course "impact ranking" — see which class moves the needle most',
  'What-if scenario mode, with one-click apply',
];

export function FeaturesSection({ onStart }: FeaturesSectionProps) {
  return (
    <section className="relative px-6 sm:px-12 py-24 sm:py-32 max-w-[1100px] mx-auto">
      <Reveal variant="fade-up">
        <p className="text-[13px] font-semibold uppercase tracking-widest text-black/30 dark:text-white/30 mb-12 sm:mb-16 max-w-[480px]">
          Two tools. Built for the two questions you actually ask.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-16">
        <Reveal variant="fade-right">
          <ToolBlock
            quote="What do I need on the final?"
            specs={GRADE_RECOVERY_SPECS}
            ctaLabel="Open Grade Recovery"
            accentColor="indigo"
            onClick={() => onStart('grade-recovery')}
          />
        </Reveal>
        <Reveal variant="fade-left">
          <ToolBlock
            quote="What's my real GPA?"
            specs={GPA_TRACKER_SPECS}
            ctaLabel="Open GPA Tracker"
            accentColor="purple"
            onClick={() => onStart('gpa-tracker')}
          />
        </Reveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Tool block
// ---------------------------------------------------------------------------

function ToolBlock({
  quote,
  specs,
  ctaLabel,
  accentColor,
  onClick,
}: {
  quote: string;
  specs: string[];
  ctaLabel: string;
  accentColor: 'indigo' | 'purple';
  onClick: () => void;
}) {
  const isIndigo = accentColor === 'indigo';

  const accentText = isIndigo ? 'text-indigo-400' : 'text-purple-400';
  const borderBase = isIndigo ? 'border-indigo-500/25' : 'border-purple-500/25';
  const bgBase = isIndigo ? 'bg-indigo-950/20' : 'bg-purple-950/20';
  const borderHover = isIndigo
    ? 'hover:border-indigo-500/60 hover:shadow-[0_0_24px_rgba(99,102,241,0.3)]'
    : 'hover:border-purple-500/60 hover:shadow-[0_0_24px_rgba(168,85,247,0.3)]';

  return (
    <div>
      <h3 className="text-[26px] sm:text-[32px] font-semibold text-[var(--text-primary)] tracking-tight leading-snug mb-6">
        &ldquo;{quote}&rdquo;
      </h3>

      <SpecList items={specs} accentClassName={accentText} />

      <button
        type="button"
        onClick={onClick}
        className={`group mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-[10px] border ${borderBase} ${bgBase} ${borderHover} transition-all duration-200 text-[13px] font-medium ${accentText}`}
      >
        {ctaLabel}
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
      </button>
    </div>
  );
}
