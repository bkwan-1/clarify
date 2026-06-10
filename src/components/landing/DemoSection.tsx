import { useState, type CSSProperties } from 'react';
import { computeRequiredForTarget } from '../../lib/gradeRecoveryCalculator';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { Reveal } from './Reveal';

export function DemoSection() {
  return (
    <section className="relative px-6 sm:px-12 py-24 sm:py-32 max-w-[640px] mx-auto">
      <Reveal variant="fade-up">
        <p className="text-[13px] font-semibold uppercase tracking-widest text-black/30 dark:text-white/30 mb-3">
          No sign-up. No setup. Try it.
        </p>
        <h2 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.03em] text-[var(--text-primary)] leading-snug mb-10 max-w-[520px]">
          You're sitting at a 72%. The final is worth 40% of your grade. What
          do you need to land a B−?
        </h2>
      </Reveal>

      <Reveal variant="scale-in">
        <DemoWidget />
      </Reveal>

      <Reveal variant="fade-up" delay={120}>
        <p className="mt-5 text-center font-mono text-[11px] text-black/25 dark:text-white/25">
          // this is the real formula behind Grade Recovery
        </p>
      </Reveal>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Interactive widget
// ---------------------------------------------------------------------------

function DemoWidget() {
  const [currentGradePct, setCurrentGradePct] = useState(72);
  const [remainingWeightPct, setRemainingWeightPct] = useState(40);
  const [targetPct, setTargetPct] = useState(80);

  const numeratorConstant = currentGradePct * (1 - remainingWeightPct / 100);
  const remainingCoefficient = remainingWeightPct;
  const R = computeRequiredForTarget(numeratorConstant, remainingCoefficient, targetPct);

  const isLocked = R === null;
  const isAlreadySecured = !isLocked && R < 0;
  const isImpossible = !isLocked && R > 100;
  const isAchievable = !isLocked && R >= 0 && R <= 100;
  const bestPossible = numeratorConstant + remainingCoefficient;

  const animatedR = useAnimatedNumber(isAchievable ? Math.max(0, Math.min(100, R)) : null, 200);

  return (
    <div className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.08] rounded-[16px] p-6 sm:p-8">
      <SliderRow
        id="demo-current-grade"
        label="Your current grade"
        value={currentGradePct}
        onChange={setCurrentGradePct}
      />
      <SliderRow
        id="demo-remaining"
        label="% of grade remaining"
        value={remainingWeightPct}
        onChange={setRemainingWeightPct}
      />
      <SliderRow
        id="demo-target"
        label="Target grade"
        value={targetPct}
        onChange={setTargetPct}
      />

      <div className="mt-7 pt-6 border-t border-black/[0.08] dark:border-white/[0.08]">
        {isLocked && (
          <div>
            <p className="text-[40px] sm:text-[56px] font-bold tabular-nums leading-none text-black/40 dark:text-white/40">
              {currentGradePct}%
            </p>
            <p className="text-[13px] text-black/40 dark:text-white/40 mt-2">
              Nothing left to grade — your final grade is locked at {currentGradePct}%.
            </p>
          </div>
        )}
        {isAlreadySecured && (
          <div>
            <p className="text-[40px] sm:text-[56px] font-bold tabular-nums leading-none text-[var(--success)]">
              {numeratorConstant.toFixed(1)}%+
            </p>
            <p className="text-[13px] text-[var(--success)] mt-2">
              Already locked in — even a zero on what's left keeps you above target.
            </p>
          </div>
        )}
        {isImpossible && (
          <div>
            <p className="text-[40px] sm:text-[56px] font-bold tabular-nums leading-none text-[var(--danger)]">
              {bestPossible.toFixed(1)}%
            </p>
            <p className="text-[13px] text-[var(--danger)] mt-2">
              Not mathematically possible — the best you can reach is{' '}
              {bestPossible.toFixed(1)}%.
            </p>
          </div>
        )}
        {isAchievable && animatedR !== null && (
          <div>
            <p className="text-[40px] sm:text-[56px] font-bold tabular-nums leading-none bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
              {animatedR.toFixed(1)}%
            </p>
            <p className="text-[13px] text-black/55 dark:text-white/55 mt-2">
              You need to average this on what's left.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SliderRow({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-baseline justify-between mb-2.5">
        <label htmlFor={id} className="text-[13px] text-black/55 dark:text-white/55">
          {label}
        </label>
        <span className="text-[20px] font-semibold tabular-nums bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          {value}%
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${value}%`}
        style={{ '--range-fill': `${value}%` } as CSSProperties}
      />
    </div>
  );
}
