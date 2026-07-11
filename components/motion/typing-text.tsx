"use client";

import { useState, useEffect, useCallback } from "react";
import { useReducedMotion } from "framer-motion";

export function TypingText({
  words,
  className = "",
  speed = 80,
  deleteSpeed = 50,
  pauseDuration = 2200,
}: {
  words: string[];
  className?: string;
  speed?: number;
  deleteSpeed?: number;
  pauseDuration?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const tick = useCallback(() => {
    const currentWord = words[currentWordIndex];

    if (!isDeleting) {
      setCurrentText(currentWord.slice(0, currentText.length + 1));
      if (currentText === currentWord) {
        setTimeout(() => setIsDeleting(true), pauseDuration);
        return;
      }
    } else {
      setCurrentText(currentWord.slice(0, currentText.length - 1));
      if (currentText === "") {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
        return;
      }
    }
  }, [currentText, currentWordIndex, isDeleting, words, pauseDuration]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setCurrentText(words[0]);
      return;
    }
    const timeout = setTimeout(tick, isDeleting ? deleteSpeed : speed);
    return () => clearTimeout(timeout);
  }, [tick, isDeleting, speed, deleteSpeed, prefersReducedMotion, words]);

  return (
    <span className={className}>
      {currentText}
      <span className="ml-0.5 inline-block w-[2px] animate-pulse-soft bg-accent" />
    </span>
  );
}
