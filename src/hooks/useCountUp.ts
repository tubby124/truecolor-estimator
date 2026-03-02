import { useEffect, useRef, useState } from "react";

/**
 * Counts a number up from 0 to `target` over `duration` ms,
 * starting when the returned ref's element enters the viewport.
 *
 * Usage:
 *   const { ref, value } = useCountUp(500, 1500);
 *   <span ref={ref}>{value}+</span>
 */
export function useCountUp<T extends HTMLElement = HTMLElement>(target: number, duration = 1500) {
  const ref = useRef<T>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          observer.unobserve(el);

          const startTime = performance.now();
          function tick(now: number) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { ref, value };
}
