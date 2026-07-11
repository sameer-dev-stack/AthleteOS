"use client";

import { useCallback } from "react";

export function useHaptic() {
  const vibrate = useCallback((pattern: number | number[] = 10) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const lightTap = useCallback(() => vibrate(8), [vibrate]);
  const mediumTap = useCallback(() => vibrate(15), [vibrate]);
  const heavyTap = useCallback(() => vibrate(25), [vibrate]);
  const success = useCallback(() => vibrate([10, 50, 20]), [vibrate]);
  const error = useCallback(() => vibrate([30, 50, 30]), [vibrate]);

  return { vibrate, lightTap, mediumTap, heavyTap, success, error };
}
