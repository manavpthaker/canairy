import { RefObject, useEffect, useState } from 'react';

/** Rendered width of an element, so SVGs can draw at real pixels instead of scaling text down on phones. */
export function useWidth(ref: RefObject<HTMLElement>, fallback: number): number {
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Measure the parent: the SVG inside this element would otherwise size it.
    const target = el.parentElement ?? el;
    const update = () => setWidth(Math.max(260, Math.round(target.getBoundingClientRect().width)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(target);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}
