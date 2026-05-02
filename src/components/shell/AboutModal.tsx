import { useState } from 'react';
import { Modal } from '../shared/Modal';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

type Tab = 'grades' | 'gpa' | 'privacy';

const GRADE_SCALE = [
  ['A+ / A', '4.0'],
  ['A−', '3.7'],
  ['B+', '3.3'],
  ['B', '3.0'],
  ['B−', '2.7'],
  ['C+', '2.3'],
  ['C', '2.0'],
  ['C−', '1.7'],
  ['D+', '1.3'],
  ['D', '1.0'],
  ['D−', '0.7'],
  ['F', '0.0'],
];

export function AboutModal({ open, onClose }: AboutModalProps) {
  const [tab, setTab] = useState<Tab>('grades');

  return (
    <Modal open={open} onClose={onClose} title="How Clarify works" maxWidth="max-w-lg">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)] -mx-5 px-5 mb-5">
        {(['grades', 'gpa', 'privacy'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`relative px-3 py-2 text-[12px] font-medium capitalize transition-colors ${
              tab === t
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t === 'grades' ? 'Grade Recovery' : t === 'gpa' ? 'GPA' : 'Privacy'}
            {tab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Grade Recovery tab */}
      {tab === 'grades' && (
        <div className="space-y-5 text-[13px] text-[var(--text-secondary)] leading-relaxed">
          <Section title="Current grade">
            Weighted average of all completed assignments. Each category (Homework, Exams, etc.) is
            normalized to 100% so partial weights work fine — entering 30% + 50% treats them as 37.5% + 62.5%.
            Drop-lowest is applied before averaging.
          </Section>

          <Section title="What you need">
            <p className="mb-2">
              We solve one linear equation for the unknown average{' '}
              <Mono>R</Mono> you need on remaining work:
            </p>
            <CodeBlock>
              finalGrade = C + K × R{'\n'}
              R = (target − C) / K × 100
            </CodeBlock>
            <ul className="mt-2 space-y-1 text-[12px]">
              <li><Mono>C</Mono> — locked contribution from completed work</li>
              <li><Mono>K</Mono> — weight of remaining work (how much it can move the needle)</li>
              <li><Mono>R &gt; 100%</Mono> — target is mathematically impossible</li>
              <li><Mono>R &lt; 0%</Mono> — target already secured, score anything</li>
            </ul>
          </Section>

          <Section title="All four targets at once">
            A, B, C, and D thresholds (93%, 83%, 73%, 63%) share the same{' '}
            <Mono>C</Mono> and <Mono>K</Mono> values. We compute them in one pass — toggling targets
            is O(1), not a recalculation.
          </Section>
        </div>
      )}

      {/* GPA tab */}
      {tab === 'gpa' && (
        <div className="space-y-5 text-[13px] text-[var(--text-secondary)] leading-relaxed">
          <Section title="Formula">
            <CodeBlock>
              GPA = Σ(grade points × credit hours) ÷ Σ(credit hours)
            </CodeBlock>
            <p className="mt-2">
              Quality points = grade points × credits. GPA is a credit-weighted average, not a
              course-count average.
            </p>
          </Section>

          <Section title="4.0 scale">
            <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-2 font-mono text-[11px]">
              {GRADE_SCALE.map(([grade, pts]) => (
                <div key={grade} className="flex items-center justify-between text-[var(--text-primary)]">
                  <span className="text-[var(--text-tertiary)]">{grade}</span>
                  <span className="font-semibold">{pts}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[12px]">A+ is capped at 4.0 (not 4.3). Standard university policy.</p>
          </Section>

          <Section title="Weighted bonus">
            Added before the formula, capped at 5.0. F grades never receive a bonus.
            <div className="mt-2 flex gap-6 font-mono text-[12px] text-[var(--text-primary)]">
              <span>Honors <span className="text-[var(--accent)] font-semibold">+0.5</span></span>
              <span>AP / IB <span className="text-[var(--accent)] font-semibold">+1.0</span></span>
            </div>
          </Section>

          <Section title="Cumulative GPA">
            All quality points from every semester are pooled, then divided by total credits. This
            is <em>not</em> an average of semester GPAs — that method gives wrong results when credit
            loads differ between semesters.
            <CodeBlock className="mt-2">
              Wrong: (4.0 + 2.0) / 2 = 3.0{'\n'}
              Right: (60 QP + 6 QP) / (15 + 3 cr) = 3.67
            </CodeBlock>
          </Section>
        </div>
      )}

      {/* Privacy tab */}
      {tab === 'privacy' && (
        <div className="space-y-5 text-[13px] text-[var(--text-secondary)] leading-relaxed">
          <div className="flex items-start gap-3 p-4 rounded-[8px] bg-[var(--success-muted)] border border-[var(--success)]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5 text-[var(--success)]">
              <path d="M8 2L3 4.5V8c0 3 2.5 5 5 6 2.5-1 5-3 5-6V4.5L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="text-[13px] font-semibold text-[var(--success)] mb-0.5">
                Your data never leaves your device
              </p>
              <p className="text-[12px] text-[var(--success)] opacity-80">
                Everything is stored in your browser's localStorage. No server, no account required.
              </p>
            </div>
          </div>

          <Section title="What's stored">
            <ul className="space-y-1 text-[12px]">
              <li><Mono>clarify_grade_recovery</Mono> — your classes and grades</li>
              <li><Mono>clarify_gpa_tracker</Mono> — your semesters and courses</li>
              <li><Mono>clarify_theme</Mono> — light or dark preference</li>
              <li><Mono>clarify_active_tool</Mono> — which tab you were last on</li>
            </ul>
            <p className="mt-2">These are plain JSON objects, saved locally. Nothing is transmitted.</p>
          </Section>

          <Section title="Clearing data">
            Clearing your browser's site data or localStorage will erase your saved classes and
            semesters. There is no cloud backup. If you need to preserve data across devices,
            use the same browser profile.
          </Section>
        </div>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
        {title}
      </p>
      <div>{children}</div>
    </div>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[12px] text-[var(--text-primary)] bg-[var(--bg-raised)] px-1 py-0.5 rounded-[3px]">
      {children}
    </code>
  );
}

function CodeBlock({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <pre
      className={`font-mono text-[12px] bg-[var(--bg-raised)] text-[var(--text-primary)] px-3 py-2.5 rounded-[6px] whitespace-pre overflow-x-auto leading-relaxed ${className}`}
    >
      {children}
    </pre>
  );
}
