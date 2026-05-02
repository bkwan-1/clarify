import { useState, useEffect, useRef } from 'react';

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

/**
 * Returns a smoothly interpolated version of `target` that animates to each
 * new value over `duration` ms. Returns null immediately when target is null.
 *
 * When going from null → value, counts up from 0 (satisfying reveal effect).
 * When value changes mid-animation, starts the new animation from wherever
 * the number currently sits — no visual jump.
 */
export function useAnimatedNumber(
  target: number | null,
  duration = 260,
): number | null {
  const [value, setValue] = useState<number | null>(target);
  const displayedRef = useRef<number | null>(target); // actual current displayed value
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (target === null) {
      displayedRef.current = null;
      setValue(null);
      return;
    }

    // Start from wherever the displayed value currently is (or 0 if null)
    const from = displayedRef.current ?? 0;
    if (from === target) return;

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const v = from + (target - from) * easeOutQuart(t);
      displayedRef.current = v;
      setValue(v);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        displayedRef.current = target;
        setValue(target);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [target, duration]);

  return value;
}
