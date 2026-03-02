import { useEffect, useRef } from "react";

/**
 * Attaches an IntersectionObserver to a ref.
 * When the element enters the viewport, adds the `in-view` class.
 * Pair with Tailwind classes for the reveal effect:
 *
 *   <section ref={ref} className="reveal-section">
 *
 * CSS (in globals.css):
 *   .reveal-section { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
 *   .reveal-section.in-view { opacity: 1; transform: translateY(0); }
 */
export function useScrollReveal<T extends HTMLElement = HTMLElement>(
  options: IntersectionObserverInit = {}
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in-view");
          observer.unobserve(el); // fire once
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px", ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
