"use client";

import { useCountUp } from "@/hooks/useCountUp";

interface Props {
  target: number;
  suffix?: string;
  className?: string;
}

/**
 * Animated number counter — counts from 0 to `target` when scrolled into view.
 * Uses ease-out cubic easing. Fires once.
 */
export function StatCounter({ target, suffix = "", className = "" }: Props) {
  const { ref, value } = useCountUp(target);
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <span ref={ref as any} className={className}>
      {value}{suffix}
    </span>
  );
}
