"use client";

import { useEffect, useState } from "react";
import { Counter } from "./counter";

const FALLBACK = 1247;

export function LiveWaitlistCount({ className }: { className?: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      fetch("/api/waitlist", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { waitlist?: number } | null) => {
          if (!cancelled && data && typeof data.waitlist === "number") {
            setCount(data.waitlist);
          }
        })
        .catch(() => {
          // Network error — keep fallback
        });
    }, 2000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <Counter
      to={count ?? FALLBACK}
      className={className}
      duration={count === null ? 1.8 : 1.2}
    />
  );
}
