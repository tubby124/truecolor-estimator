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
  const { ref, value } = useCountUp<HTMLSpanElement>(target);
  return (
    <span ref={ref} className={className}>
      {value}{suffix}
    </span>
  );
}
