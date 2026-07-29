"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/** useLayoutEffect on the client, useEffect on the server — same call, no SSR warning. */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface IndicatorState {
  left: number;
  width: number;
  visible: boolean;
}

/**
 * Tracks the position of the active item in a horizontal strip so one shared
 * underline can slide between items, instead of each item drawing its own.
 *
 * Attach `containerRef` to the strip (it must be `relative`), `setItemRef(key)`
 * to each item, and render <SlidingUnderline /> as the last child.
 */
export function useSlidingUnderline(activeKey: string | null) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());
  const [indicator, setIndicator] = useState<IndicatorState>({
    left: 0,
    width: 0,
    visible: false,
  });
  // Transitions stay off until the first measurement lands, so a fresh page
  // load draws the underline in place instead of sliding it in from x=0.
  const [animate, setAnimate] = useState(false);

  const setItemRef = useCallback(
    (key: string) => (el: HTMLElement | null) => {
      if (el) itemRefs.current.set(key, el);
      else itemRefs.current.delete(key);
    },
    []
  );

  useIsomorphicLayoutEffect(() => {
    function measure() {
      const el = activeKey ? itemRefs.current.get(activeKey) : null;
      if (!el) {
        // Fade out in place rather than sliding back to the origin.
        setIndicator((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }
      const next = { left: el.offsetLeft, width: el.offsetWidth, visible: true };
      setIndicator((prev) =>
        prev.left === next.left && prev.width === next.width && prev.visible ? prev : next
      );
    }

    measure();

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    // Web-font swap changes label widths after first paint.
    document.fonts?.ready.then(measure).catch(() => {});

    return () => observer.disconnect();
  }, [activeKey]);

  useIsomorphicLayoutEffect(() => {
    if (!indicator.visible || animate) return;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [indicator.visible, animate]);

  return { containerRef, setItemRef, indicator, animate };
}

/**
 * The sliding bar itself. `className` sets its vertical offset and colour,
 * e.g. "bottom-0 bg-primary".
 */
export function SlidingUnderline({
  indicator,
  animate,
  className = "bottom-0 bg-primary",
}: {
  indicator: IndicatorState;
  animate: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      style={{ transform: `translateX(${indicator.left}px)`, width: `${indicator.width}px` }}
      className={`pointer-events-none absolute left-0 h-px ${
        animate
          ? "transition-[transform,width,opacity] duration-300 ease-out motion-reduce:transition-none"
          : ""
      } ${className} ${indicator.visible ? "opacity-100" : "opacity-0"}`}
    />
  );
}
