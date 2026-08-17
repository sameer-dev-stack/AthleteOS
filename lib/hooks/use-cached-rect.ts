"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Caches an element's bounding rect and only recomputes it when the page
 * actually scrolls or resizes — NOT on every pointer move.
 *
 * Reading `getBoundingClientRect()` inside a `pointermove`/`mousemove` handler
 * forces a synchronous layout flush (a "forced reflow") because the previous
 * animation frame's transform/style write invalidated layout. Doing that on
 * every mouse move is the single most common source of the DevTools
 * "Forced reflow" / "Total reflow time" warning.
 *
 * Consuming code reads `rectRef.current` inside the move handler instead of
 * calling `getBoundingClientRect()` directly. The rect stays accurate enough
 * for cursor-relative math because the element only shifts relative to the
 * viewport on scroll/resize, which this hook tracks.
 */
export function useCachedRect<T extends HTMLElement>(): {
  ref: RefObject<T | null>;
  rectRef: RefObject<DOMRect | null>;
} {
  const ref = useRef<T>(null);
  const rectRef = useRef<DOMRect | null>(null);

  const measure = () => {
    if (ref.current) rectRef.current = ref.current.getBoundingClientRect();
  };

  useEffect(() => {
    measure();

    const onScrollOrResize = () => measure();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      if (ref.current) ro.observe(ref.current);
    }

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      ro?.disconnect();
    };
  }, []);

  return { ref, rectRef };
}
