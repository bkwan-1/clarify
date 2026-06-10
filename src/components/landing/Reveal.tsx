import type { ReactNode } from 'react';
import { useInView } from '../../hooks/useInView';

type RevealVariant = 'fade-up' | 'fade-in' | 'fade-left' | 'fade-right' | 'scale-in';

interface RevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
}

export function Reveal({ children, variant = 'fade-up', delay = 0, className = '' }: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`reveal reveal-${variant} ${inView ? 'reveal-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
