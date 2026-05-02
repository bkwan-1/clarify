import { useState, useMemo } from 'react';
import { ThemeToggle } from './shell/ThemeToggle';
import type { Theme } from '../hooks/useTheme';
import type { ActiveTool } from './shell/TopNav';
import { readSavedDataSummary } from '../lib/savedData';

interface WelcomeScreenProps {
  onStart: (tool: ActiveTool) => void;
  theme: Theme;
  onThemeToggle: () => void;
}

export function WelcomeScreen({ onStart, theme, onThemeToggle }: WelcomeScreenProps) {
  const saved = useMemo(() => readSavedDataSummary(), []);
  const [mathOpen, setMathOpen] = useState(false);

  const isReturning = saved.hasGradeData || saved.hasGPAData;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-base)] overflow-y-auto flex flex-col animate-fade-in">
      {/* Landing header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-1.5 select-none">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
          <span className="text-[13px] font-semibold text-[var(--text-primary)] tracking-tight">Clarify</span>
        </div>
        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-14">
        <div className="w-full max-w-[520px]">

          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <div className="mb-10">
            {isReturning ? (
              <>
                <p className="text-[11px] font-semibold text-[var(--accent)] mb-3 tracking-widest uppercase">
                  Welcome back
                </p>
                <h1 className="text-[38px] sm:text-[46px] font-semibold tracking-[-0.04em] text-[var(--text-primary)] leading-[1.05] mb-3">
                  Pick up where<br />you left off.
                </h1>
                <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
                  Your classes and semesters are saved.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-[38px] sm:text-[46px] font-semibold tracking-[-0.04em] text-[var(--text-primary)] leading-[1.05] mb-3">
                  Know exactly<br />what you need.
                </h1>
                <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed max-w-sm">
                  Grade recovery and GPA calculation that shows the math, not just the answer.
                </p>
              </>
            )}
          </div>

          {/* ── Entry cards ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
            <EntryCard
              onClick={() => onStart('grade-recovery')}
              question="What do I need to pass?"
              label="Grade Recovery"
              description="Enter your grades and find the exact score you need for any target."
              hasData={saved.hasGradeData}
              dataSummary={
                saved.hasGradeData
                  ? `${saved.gradeClassCount} ${saved.gradeClassCount === 1 ? 'class' : 'classes'} saved`
                  : null
              }
              cta={saved.hasGradeData ? 'Open Grade Recovery' : 'Start Grade Recovery'}
              accent
            />

            <EntryCard
              onClick={() => onStart('gpa-tracker')}
              question="What's my GPA?"
              label="GPA Tracker"
              description="Track every semester, run grade scenarios, and pinpoint what's dragging you down."
              hasData={saved.hasGPAData}
              dataSummary={
                saved.hasGPAData
                  ? `${saved.gpaSemesterCount} ${saved.gpaSemesterCount === 1 ? 'semester' : 'semesters'} · ${saved.gpaCoursesWithGrades} courses`
                  : null
              }
              cta={saved.hasGPAData ? 'Open GPA Tracker' : 'Start GPA Tracker'}
            />
          </div>

          {/* ── Math explainer (collapsible) ─────────────────────────────── */}
          <div className="border-t border-[var(--border)] pt-6">
            <button
              type="button"
              onClick={() => setMathOpen((o) => !o)}
              className="flex items-center gap-2 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-full"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--text-tertiary)] shrink-0">
                <rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 7h4M7 5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              How the math works
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                className={`ml-auto text-[var(--text-tertiary)] transition-transform duration-150 ${mathOpen ? 'rotate-180' : ''}`}
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>

            {mathOpen && (
              <div className="mt-5 space-y-6 text-[13px] text-[var(--text-secondary)] leading-relaxed">
                <MathSection title="Grade Recovery">
                  <p className="mb-2">
                    Solves for <Code>R</Code> — the average you need on remaining work:
                  </p>
                  <pre className="font-mono text-[12px] bg-[var(--bg-raised)] text-[var(--text-primary)] px-3 py-2.5 rounded-[6px] whitespace-pre overflow-x-auto">
                    {`R = (target% − locked_contribution) / remaining_weight × 100`}
                  </pre>
                  <p className="mt-2 text-[12px]">
                    If <Code>R &gt; 100</Code> the target is impossible.
                    If <Code>R &lt; 0</Code> you've already secured it.
                    All targets (A/B/C/D) share the same coefficients — computed once, no redundant math.
                  </p>
                </MathSection>

                <MathSection title="GPA">
                  <pre className="font-mono text-[12px] bg-[var(--bg-raised)] text-[var(--text-primary)] px-3 py-2.5 rounded-[6px] whitespace-pre overflow-x-auto mb-2">
                    {`GPA = Σ(grade_points × credit_hours) ÷ Σ(credit_hours)`}
                  </pre>
                  <p className="text-[12px]">
                    Standard 4.0 scale (A+/A = 4.0, A− = 3.7, B+ = 3.3…). Weighted courses: Honors +0.5,
                    AP/IB +1.0, capped at 5.0. Cumulative GPA pools all quality points across semesters —
                    not a simple average of semester GPAs, which gives wrong results with unequal credit loads.
                  </p>
                </MathSection>
              </div>
            )}

            {/* Privacy note */}
            <p className="mt-6 text-[11px] text-[var(--text-tertiary)] flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="shrink-0">
                <path d="M6 1L2 3v3.5C2 9 3.8 11 6 12c2.2-1 4-3 4-5.5V3L6 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
              All data stays in your browser. Nothing is sent anywhere.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Entry card
// ---------------------------------------------------------------------------

function EntryCard({
  onClick,
  question,
  label,
  description,
  hasData,
  dataSummary,
  cta,
  accent = false,
}: {
  onClick: () => void;
  question: string;
  label: string;
  description: string;
  hasData: boolean;
  dataSummary: string | null;
  cta: string;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative text-left p-5 rounded-[10px] border transition-all duration-150 flex flex-col gap-3 ${
        accent
          ? 'border-[var(--accent)] bg-[var(--accent-muted)] hover:opacity-90'
          : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]'
      }`}
    >
      {/* Saved data dot */}
      {hasData && (
        <span className="absolute top-3.5 right-3.5 w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
      )}

      <div>
        <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${
          accent ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
        }`}>
          {label}
        </p>
        <p className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight leading-snug">
          {question}
        </p>
      </div>

      {hasData && dataSummary ? (
        <p className="text-[12px] text-[var(--text-secondary)]">{dataSummary}</p>
      ) : (
        <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{description}</p>
      )}

      <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--accent)] mt-auto pt-1">
        {cta}
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className="transition-transform group-hover:translate-x-0.5"
        >
          <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------

function MathSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
        {title}
      </p>
      {children}
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[12px] text-[var(--text-primary)] bg-[var(--bg-raised)] px-1 py-0.5 rounded-[3px]">
      {children}
    </code>
  );
}
