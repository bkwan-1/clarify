interface BadgeProps {
  value: string | number | null;
  variant?: 'auto' | 'success' | 'warning' | 'danger' | 'neutral' | 'accent';
  className?: string;
}

function autoVariant(val: string | number | null): BadgeProps['variant'] {
  if (typeof val === 'number') {
    if (val >= 90) return 'success';
    if (val >= 80) return 'accent';
    if (val >= 70) return 'warning';
    return 'danger';
  }
  return 'neutral';
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  auto: '',
  success: 'bg-[var(--success-muted)] text-[var(--success)]',
  warning: 'bg-[var(--warning-muted)] text-[var(--warning)]',
  danger: 'bg-[var(--danger-muted)] text-[var(--danger)]',
  neutral: 'bg-[var(--bg-raised)] text-[var(--text-secondary)]',
  accent: 'bg-[var(--accent-muted)] text-[var(--accent)]',
};

export function Badge({ value, variant = 'auto', className = '' }: BadgeProps) {
  const resolved = variant === 'auto' ? autoVariant(value) : variant;
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded-[6px] text-[11px] font-medium tabular-nums ${variantStyles[resolved!]} ${className}`}
    >
      {value ?? '—'}
    </span>
  );
}
