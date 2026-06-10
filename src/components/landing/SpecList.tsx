import { Reveal } from './Reveal';

interface SpecListProps {
  items: string[];
  variant?: 'bullet' | 'check';
  accentClassName?: string;
  revealVariant?: 'fade-up' | 'fade-left' | 'fade-right';
}

export function SpecList({
  items,
  variant = 'bullet',
  accentClassName = 'text-indigo-400',
  revealVariant = 'fade-up',
}: SpecListProps) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <Reveal key={item} variant={revealVariant} delay={i * 60}>
          <li className="flex items-start gap-2.5 font-mono text-[12.5px] leading-relaxed text-black/55 dark:text-white/55">
            {variant === 'check' ? (
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none" className={`shrink-0 mt-[3px] ${accentClassName}`}>
                <path d="M2.5 6.2l2.2 2.2L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <span className={`shrink-0 ${accentClassName}`}>—</span>
            )}
            <span>{item}</span>
          </li>
        </Reveal>
      ))}
    </ul>
  );
}
