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
    // Dark "marketing" background is intentional and independent of the
    // app's light/dark theme — ThemeToggle here only affects the app shell
    // underneath once a tool is opened.
    <div
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden flex flex-col"
      style={{ backgroundColor: '#0a0a0c' }}
      onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 40)}
    >
      <header
        className={`sticky top-0 z-10 flex items-center justify-between px-5 py-4 shrink-0 border-b transition-colors duration-200 ${
          scrolled ? 'border-white/[0.08] bg-[#0a0a0c]/80 backdrop-blur-sm' : 'border-transparent'
        }`}
      >
        <div className="flex items-center gap-1.5 select-none">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-[13px] font-semibold text-white/90 tracking-tight">Clarify</span>
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
