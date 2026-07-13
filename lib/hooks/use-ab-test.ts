"use client";

import { useState, useEffect } from "react";

type Variant = "A" | "B";
const AB_KEY = "athleteos_ab_cta";

const NAV_VARIANTS: Record<Variant, string> = {
  A: "Get started",
  B: "Launch your card",
};

const HERO_VARIANTS: Record<Variant, string> = {
  A: "Claim your athlete card",
  B: "Get your free card",
};

const HERO_SUB_VARIANTS: Record<Variant, string> = {
  A: "Free to start · No credit card",
  B: "Set up in 2 minutes · Zero cost",
};

export function useAbTest() {
  const [variant, setVariant] = useState<Variant>("A");

  useEffect(() => {
    let stored = localStorage.getItem(AB_KEY) as Variant | null;
    if (!stored || (stored !== "A" && stored !== "B")) {
      stored = Math.random() < 0.5 ? "A" : "B";
      localStorage.setItem(AB_KEY, stored);
    }
    queueMicrotask(() => setVariant(stored));
  }, []);

  return {
    variant,
    navText: NAV_VARIANTS[variant],
    heroText: HERO_VARIANTS[variant],
    heroSub: HERO_SUB_VARIANTS[variant],
  };
}
