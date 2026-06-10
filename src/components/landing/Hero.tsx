import { useState, useEffect } from 'react';

const FULL_TITLE = 'Clarify.';

export function Hero() {
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
    <section className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 overflow-hidden">
      {/* Decorative formula fragment — the actual math behind Grade Recovery */}
      <div
        className="hidden lg:block absolute bottom-10 right-[-10px] text-[90px] xl:text-[120px] font-mono font-bold text-white/[0.03] rotate-[-6deg] leading-[1.05] text-right select-none pointer-events-none whitespace-nowrap"
        aria-hidden="true"
      >
        <div>(target − C)</div>
        <div>÷ K × 100</div>
      </div>

      <div className="relative max-w-[640px]">
        <p className="text-[13px] font-semibold uppercase tracking-widest text-white/30 mb-4">
          Your academic toolkit
        </p>
        <h1 className="text-[56px] sm:text-[80px] font-bold tracking-[-0.04em] leading-[1.05] mb-6 min-h-[1.1em]">
          <span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
            {displayed}
          </span>
          {cursorVisible && (
            <span className="animate-pulse text-indigo-400 ml-0.5">|</span>
          )}
        </h1>
        <p className="text-[18px] sm:text-[20px] text-white/65 leading-relaxed max-w-[440px] mb-3">
          Know exactly what you need — to pass, to hit your GPA, to finish strong.
        </p>
        <p className="text-[14px] text-white/40 leading-relaxed max-w-[460px] mb-7">
          Two calculators. One question each. No accounts, no dashboards, no
          upsells — just the number you came for.
        </p>
        <p className="font-mono text-[11px] text-white/25 rotate-[-1.5deg] inline-block">
          // solves one equation, shows you the number
        </p>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/30">
        <span className="text-[10px] font-semibold uppercase tracking-widest">Scroll</span>
        <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="animate-scroll-bob">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
