"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const isTouchDevice =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches;

    if (isTouchDevice) return;

    const timer = setTimeout(() => {
      const lenis = new Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
      });

      let rafId: number;
      function raf(time: number) {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      }
      rafId = requestAnimationFrame(raf);

      const onClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const link = target.closest("a[href^='#']") as HTMLAnchorElement | null;
        if (!link) return;
        const id = link.getAttribute("href");
        if (!id || id === "#") return;
        const el = document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        lenis.scrollTo(el as HTMLElement, { offset: -60, duration: 1.4 });
      };
      document.addEventListener("click", onClick);

      return () => {
        document.removeEventListener("click", onClick);
        cancelAnimationFrame(rafId);
        lenis.destroy();
      };
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname]);

  return <>{children}</>;
}
