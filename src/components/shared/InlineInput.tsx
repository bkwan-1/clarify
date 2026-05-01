import { useState, useRef } from 'react';

interface InlineInputProps {
  value: string | number | null | undefined;
  onChange: (val: string) => void;
  onBlur?: (val: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  inputClassName?: string;
  displayClassName?: string;
  suffix?: string;
  align?: 'left' | 'right' | 'center';
}

export function InlineInput({
  value,
  onChange,
  onBlur,
  type = 'text',
  placeholder = '—',
  min,
  max,
  step,
  className = '',
  inputClassName = '',
  displayClassName = '',
  suffix,
  align = 'left',
}: InlineInputProps) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayVal = value !== null && value !== undefined && value !== '' ? String(value) : null;

  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        defaultValue={displayVal ?? ''}
        min={min}
        max={max}
        step={step}
        autoFocus
        className={`w-full bg-[var(--bg-raised)] border border-[var(--accent)] rounded-[6px] px-2 py-0.5 text-[13px] text-[var(--text-primary)] outline-none ${alignClass} ${inputClassName}`}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => {
          setEditing(false);
          onBlur?.(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
          }
          if (e.key === 'Escape') {
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <span
      tabIndex={0}
      role="button"
      onClick={() => setEditing(true)}
      onFocus={() => setEditing(true)}
      className={`inline-flex items-center gap-0.5 cursor-text rounded-[6px] px-2 py-0.5 text-[13px] hover:bg-[var(--bg-hover)] transition-colors duration-100 min-w-[2rem] ${alignClass} ${displayClassName} ${className}`}
    >
      {displayVal !== null ? (
        <span className="text-[var(--text-primary)]">
          {displayVal}
          {suffix && <span className="text-[var(--text-tertiary)] ml-0.5">{suffix}</span>}
        </span>
      ) : (
        <span className="text-[var(--text-tertiary)]">{placeholder}</span>
      )}
    </span>
  );
}
