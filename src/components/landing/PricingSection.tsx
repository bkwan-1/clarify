import { Reveal } from './Reveal';
import { SpecList } from './SpecList';

const INCLUDED = [
  'Grade Recovery calculator',
  'GPA Tracker with scenario mode',
  'Unlimited classes & semesters',
  'Light & dark themes',
  'Local-only storage — no account required',
  'No ads, no tracking, no analytics',
];

export function PricingSection() {
  return (
    <section className="relative px-6 sm:px-12 py-24 sm:py-32 max-w-[640px] mx-auto text-center">
      <Reveal variant="fade-up">
        <p className="text-[13px] font-semibold uppercase tracking-widest text-white/30 mb-3">
          Pricing
        </p>
        <h2 className="text-[36px] sm:text-[44px] font-bold tracking-[-0.03em] text-white mb-4">
          Free. All of it. No catch.
        </h2>
        <p className="text-[15px] text-white/55 leading-relaxed max-w-[480px] mx-auto mb-12">
          Clarify isn't a freemium product with a paywall waiting behind the
          good features. There's one tier, and it's free — your data never
          leaves your browser, so there's no server cost to begin with.
        </p>
      </Reveal>

      <Reveal variant="scale-in">
        <div className="max-w-[400px] mx-auto text-left bg-white/[0.03] border border-white/[0.08] rounded-[16px] p-6 sm:p-8">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-[56px] font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
              $0
            </span>
            <span className="text-[14px] text-white/40">/forever</span>
          </div>

          <div className="divider-dashed pb-5 mb-5" />

          <SpecList items={INCLUDED} variant="check" accentClassName="text-indigo-400" revealVariant="fade-left" />

          <div className="divider-dashed pt-5 mt-5 mb-3" />

          <p className="font-mono text-[12px] text-white/40">total: $0.00</p>
        </div>
      </Reveal>

      <Reveal variant="fade-up" delay={120}>
        <p className="mt-6 text-[12px] text-white/30 max-w-[420px] mx-auto leading-relaxed">
          If we ever add anything that costs money to run, it'll be optional
          and clearly marked. The core tools stay free.
        </p>
      </Reveal>
    </section>
  );
}
