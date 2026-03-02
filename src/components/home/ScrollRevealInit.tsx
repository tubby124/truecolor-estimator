"use client";

import { useEffect } from "react";

/**
 * Drop into any server-component page to enable scroll-reveal animations.
 * Finds every element with className="reveal-section" and adds "in-view"
 * when it enters the viewport — firing once per element.
 * Pairs with globals.css .reveal-section / .reveal-section.in-view rules.
 */
export function ScrollRevealInit() {
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal-section")
    );
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
