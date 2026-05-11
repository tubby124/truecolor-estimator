/**
 * Annotation overlay helper for Playwright tutorial screenshots.
 *
 * Injects absolute-positioned divs over a target element to draw:
 *   1. A red 3px outline with a soft red halo around the target
 *   2. A numbered red circle anchored to the target's top-left corner
 *   3. An optional caption tooltip pointing at the target with an arrow
 *
 * All overlays are removed before each annotation call, so screenshots stay
 * clean — only the most recently annotated element is highlighted.
 *
 * Designed for tutorial spec files. NOT for production code. NOT a runtime
 * dependency. Pure DOM via page.evaluate() — no new npm packages.
 */
import type { Page, Locator } from "@playwright/test";

const OVERLAY_CLASS = "tc-tutorial-overlay";

export interface AnnotateOptions {
  /** Step number rendered inside the red circle. */
  step: number;
  /** Optional caption text rendered in a tooltip next to the target. */
  label?: string;
  /** Where the caption sits relative to the target. Default "bottom". */
  captionPosition?: "top" | "bottom" | "left" | "right";
  /** Optional small wait (ms) after injecting the overlay before screenshot.
   *  Useful when targets have transition animations finishing. Default 100. */
  settleMs?: number;
}

/**
 * Highlight a single element on the page so the next screenshot shows it
 * with a red box and a numbered step circle.
 *
 * Pass either a CSS selector (string) or a Playwright Locator. If a Locator
 * is supplied it must resolve to exactly one element.
 */
export async function annotate(
  page: Page,
  target: string | Locator,
  options: AnnotateOptions
): Promise<void> {
  const { step, label, captionPosition = "bottom", settleMs = 100 } = options;

  // Resolve target to a unique CSS selector we can hand to page.evaluate().
  // If a Locator was provided we add a temporary data-attribute, then
  // select by that attribute. Strings are passed through unchanged.
  let resolvedSelector: string;
  if (typeof target === "string") {
    resolvedSelector = target;
  } else {
    const handle = await target.elementHandle();
    if (!handle) throw new Error(`annotate: locator did not resolve to an element`);
    const marker = `tc-tutorial-mark-${step}-${Date.now()}`;
    await handle.evaluate((el, m) => el.setAttribute("data-tc-tutorial", m), marker);
    resolvedSelector = `[data-tc-tutorial="${marker}"]`;
  }

  // Scroll the target into view (centered) so the red box and caption
  // don't get clipped by the viewport edge. The modal has its own scroll
  // container — find the nearest scrollable ancestor and scroll there.
  await page.evaluate((selector) => {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "center", inline: "nearest" });
  }, resolvedSelector);
  await page.waitForTimeout(80);

  await page.evaluate(
    ({ selector, step, label, captionPosition, overlayClass }) => {
      // Remove prior overlays
      document.querySelectorAll("." + overlayClass).forEach((el) => el.remove());

      const el = document.querySelector(selector);
      if (!el) {
        console.warn(`[annotate] target not found: ${selector}`);
        return;
      }

      const rect = (el as HTMLElement).getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      // 1. Red outline box around the target (covers the element with a glowing border)
      const box = document.createElement("div");
      box.className = overlayClass;
      Object.assign(box.style, {
        position: "absolute",
        top: `${rect.top + scrollY - 4}px`,
        left: `${rect.left + scrollX - 4}px`,
        width: `${rect.width + 8}px`,
        height: `${rect.height + 8}px`,
        border: "3px solid #dc2626",
        borderRadius: "8px",
        boxShadow: "0 0 0 8px rgba(220, 38, 38, 0.18), 0 0 24px 4px rgba(220, 38, 38, 0.35)",
        pointerEvents: "none",
        zIndex: "999999",
        boxSizing: "border-box",
      } as CSSStyleDeclaration);
      document.body.appendChild(box);

      // 2. Numbered step circle (top-left of target)
      const circle = document.createElement("div");
      circle.className = overlayClass;
      circle.textContent = String(step);
      Object.assign(circle.style, {
        position: "absolute",
        top: `${rect.top + scrollY - 18}px`,
        left: `${rect.left + scrollX - 18}px`,
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "#dc2626",
        color: "#ffffff",
        fontWeight: "800",
        fontSize: "18px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25), 0 0 0 3px #ffffff",
        pointerEvents: "none",
        zIndex: "1000000",
      } as CSSStyleDeclaration);
      document.body.appendChild(circle);

      // 3. Optional caption with arrow
      if (label) {
        const caption = document.createElement("div");
        caption.className = overlayClass;
        caption.textContent = label;
        Object.assign(caption.style, {
          position: "absolute",
          background: "#1c1712",
          color: "#ffffff",
          padding: "8px 14px",
          fontSize: "13px",
          fontWeight: "600",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          borderRadius: "6px",
          maxWidth: "320px",
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.18)",
          pointerEvents: "none",
          zIndex: "1000001",
          lineHeight: "1.35",
        } as CSSStyleDeclaration);

        const captionGap = 14;
        switch (captionPosition) {
          case "top":
            caption.style.top = `${rect.top + scrollY - 48}px`;
            caption.style.left = `${rect.left + scrollX + rect.width / 2}px`;
            caption.style.transform = "translateX(-50%)";
            break;
          case "right":
            caption.style.top = `${rect.top + scrollY + rect.height / 2}px`;
            caption.style.left = `${rect.right + scrollX + captionGap}px`;
            caption.style.transform = "translateY(-50%)";
            break;
          case "left":
            caption.style.top = `${rect.top + scrollY + rect.height / 2}px`;
            caption.style.right = `${window.innerWidth - (rect.left + scrollX) + captionGap}px`;
            caption.style.transform = "translateY(-50%)";
            break;
          case "bottom":
          default:
            caption.style.top = `${rect.bottom + scrollY + captionGap}px`;
            caption.style.left = `${rect.left + scrollX + rect.width / 2}px`;
            caption.style.transform = "translateX(-50%)";
            break;
        }
        document.body.appendChild(caption);
      }
    },
    { selector: resolvedSelector, step, label: label ?? null, captionPosition, overlayClass: OVERLAY_CLASS }
  );

  if (settleMs > 0) {
    await page.waitForTimeout(settleMs);
  }
}

/** Strip all overlays — call before screenshots that should be unannotated
 *  (e.g. a "clean state" baseline shot). */
export async function clearAnnotations(page: Page): Promise<void> {
  await page.evaluate((overlayClass) => {
    document.querySelectorAll("." + overlayClass).forEach((el) => el.remove());
  }, OVERLAY_CLASS);
}
