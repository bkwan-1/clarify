import { useState } from 'react';
import { ThemeToggle } from './shell/ThemeToggle';
import type { Theme } from '../hooks/useTheme';
import type { ActiveTool } from './shell/TopNav';
import { Hero } from './landing/Hero';
import { DemoSection } from './landing/DemoSection';
import { FeaturesSection } from './landing/FeaturesSection';
import { PricingSection } from './landing/PricingSection';
import { ClosingSection } from './landing/ClosingSection';

interface LandingPageProps {
  onStart: (tool: ActiveTool) => void;
  theme: Theme;
  onThemeToggle: () => void;
}

export function LandingPage({ onStart, theme, onThemeToggle }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)]"
      onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 40)}
    >
      <header
        className={`sticky top-0 z-10 flex items-center justify-between px-5 py-4 shrink-0 border-b transition-colors duration-200 ${
          scrolled ? 'border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur-sm' : 'border-transparent'
        }`}
      >
        <div className="flex items-center gap-1.5 select-none">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-[13px] font-semibold text-[var(--text-primary)] tracking-tight">Clarify</span>
        </div>
        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
      </header>

      <Hero />
      <DemoSection />
      <FeaturesSection onStart={onStart} />
      <PricingSection />
      <ClosingSection onStart={onStart} />
    </div>
  );
}
