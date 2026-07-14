"use client";

import { useState, useEffect, useRef } from "react";

export function TypingText({
  words,
  className = "",
  speed = 80,
  deleteSpeed = 50,
  pauseDuration = 2200,
  clearedPause = 400,
}: {
  words: string[];
  className?: string;
  speed?: number;
  deleteSpeed?: number;
  pauseDuration?: number;
  clearedPause?: number;
}) {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const word = words[wordIndex];
    let delay = isDeleting ? deleteSpeed : speed;

    if (!isDeleting && text === word) {
      delay = pauseDuration;
      timeout.current = setTimeout(() => setIsDeleting(true), delay);
      return () => clearTimeout(timeout.current);
    }

    if (isDeleting && text === "") {
      delay = clearedPause;
      timeout.current = setTimeout(() => {
        setIsDeleting(false);
        setWordIndex((i) => (i + 1) % words.length);
      }, delay);
      return () => clearTimeout(timeout.current);
    }

    timeout.current = setTimeout(() => {
      setText((prev) =>
        isDeleting ? word.slice(0, prev.length - 1) : word.slice(0, prev.length + 1)
      );
    }, delay);

    return () => clearTimeout(timeout.current);
  }, [text, wordIndex, isDeleting, reducedMotion, words, speed, deleteSpeed, pauseDuration, clearedPause]);

  const widest = words.reduce((a, b) => (b.length > a.length ? b : a), "");
  const displayText = reducedMotion ? words[0] : text;

  return (
    <span className={`relative inline-block whitespace-nowrap ${className}`}>
      <span aria-hidden className="invisible">
        {widest}
      </span>
      <span className="absolute left-0 top-0 whitespace-nowrap">
        {displayText}
        <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.1em] animate-blink bg-accent align-middle" />
      </span>
    </span>
  );
}
