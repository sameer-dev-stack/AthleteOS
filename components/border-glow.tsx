"use client";

import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import './border-glow.css';

export interface BorderGlowProps {
  children?: React.ReactNode;
  className?: string;
  edgeSensitivity?: number;
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  animated?: boolean;
  loop?: boolean;
  active?: boolean;
  colors?: string[];
  fillOpacity?: number;
  style?: React.CSSProperties;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface CustomCSSProperties extends React.CSSProperties {
  [key: string]: string | number | undefined;
}

function parseHSL(hslStr: string): HSL {
  const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
  if (!match) return { h: 40, s: 80, l: 80 };
  return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
}

function buildGlowVars(glowColor: string, intensity: number): Record<string, string> {
  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  const opacities = [100, 60, 50, 40, 30, 20, 10];
  const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
  const vars: Record<string, string> = {};
  for (let i = 0; i < opacities.length; i++) {
    vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * intensity, 100)}%)`;
  }
  return vars;
}

const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
const GRADIENT_KEYS = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven'];
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

function buildGradientVars(colors: string[]): Record<string, string> {
  const vars: Record<string, string> = {};
  for (let i = 0; i < 7; i++) {
    const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
    vars[GRADIENT_KEYS[i]] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`;
  }
  vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`;
  return vars;
}

export const BorderGlow: React.FC<BorderGlowProps> = ({
  children,
  className = '',
  edgeSensitivity = 30,
  glowColor = '40 80 80',
  backgroundColor = '#120F17',
  borderRadius = 28,
  glowRadius = 40,
  glowIntensity = 1.0,
  coneSpread = 25,
  loop = false,
  active = true,
  animated = true,
  colors = ['#c084fc', '#f472b6', '#38bdf8'],
  fillOpacity = 0.5,
  style,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowLayerRef = useRef<HTMLDivElement>(null);
  const snakeRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const loopStartRef = useRef<number | null>(null);
  const lastXRef = useRef<number>(-1);
  const lastYRef = useRef<number>(-1);
  const lastFrameTimeRef = useRef<number>(0);
  const dimRef = useRef<{ w: number; h: number }>({ w: 360, h: 600 });

  const isCoarsePointer =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(pointer: coarse)').matches === true;

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const updateDims = () => {
      dimRef.current = {
        w: card.offsetWidth || 360,
        h: card.offsetHeight || 600,
      };
    };
    updateDims();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateDims);
      ro.observe(card);
    }

    const shouldAnimate = animated !== false && !isCoarsePointer;

    if (shouldAnimate && active) {
      const speed = 0.0002;
      const frameInterval = isCoarsePointer ? 32 : 20;

      card.classList.add('glow-looping');
      loopStartRef.current = null;
      lastXRef.current = -1;
      lastYRef.current = -1;

      const tick = (now: number) => {
        if (document.hidden) {
          lastFrameTimeRef.current = 0;
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        if (lastFrameTimeRef.current && now - lastFrameTimeRef.current < frameInterval) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        lastFrameTimeRef.current = now;

        const { w, h } = dimRef.current;
        const perimeter = 2 * (w + h);

        if (!loopStartRef.current) loopStartRef.current = now;
        const elapsed = (now - loopStartRef.current) * speed;
        const progress = elapsed - Math.floor(elapsed);
        const dist = progress * perimeter;

        let x: number, y: number;

        if (dist < w) {
          x = dist;
          y = 0;
        } else if (dist < w + h) {
          x = w;
          y = dist - w;
        } else if (dist < 2 * w + h) {
          x = w - (dist - (w + h));
          y = h;
        } else {
          x = 0;
          y = h - (dist - (2 * w + h));
        }

        const xi = Math.round(x);
        const yi = Math.round(y);

        if (xi !== lastXRef.current || yi !== lastYRef.current) {
          const snake = snakeRef.current;
          if (snake) {
            snake.style.transform = `translate3d(${xi - 28}px, ${yi - 28}px, 0)`;
          }
          lastXRef.current = xi;
          lastYRef.current = yi;
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (ro) ro.disconnect();
        card.classList.remove('glow-looping');
        loopStartRef.current = null;
      };
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (ro) ro.disconnect();
      card.classList.remove('glow-looping');
      loopStartRef.current = null;
    }
  }, [loop, active, animated, isCoarsePointer]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const layer = glowLayerRef.current;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!layer || !rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = x - cx;
    const dy = y - cy;

    let kx = dx !== 0 ? cx / Math.abs(dx) : Infinity;
    let ky = dy !== 0 ? cy / Math.abs(dy) : Infinity;
    const edge = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);

    layer.style.setProperty('--edge-proximity', `${(edge * 100) | 0}`);
  }, []);

  const glowVars = useMemo(() => buildGlowVars(glowColor, glowIntensity), [glowColor, glowIntensity]);
  const gradientVars = useMemo(() => buildGradientVars(colors), [colors]);

  const mergedStyles: CustomCSSProperties = useMemo(() => ({
    '--card-bg': backgroundColor,
    '--edge-sensitivity': edgeSensitivity,
    '--border-radius': `${borderRadius}px`,
    '--glow-padding': `${glowRadius}px`,
    '--cone-spread': coneSpread,
    '--fill-opacity': fillOpacity,
    ...glowVars,
    ...gradientVars,
    ...style,
  }), [backgroundColor, edgeSensitivity, borderRadius, glowRadius, coneSpread, fillOpacity, glowVars, gradientVars, style]);

  return (
    <div
      ref={cardRef}
      onPointerMove={loop && !isCoarsePointer ? handlePointerMove : undefined}
      className={`border-glow-card ${className}`}
      style={mergedStyles}
    >
      <div ref={glowLayerRef} className="border-glow-layer" aria-hidden="true">
        <span className="edge-light" />
        <div ref={snakeRef} className="snake-head" aria-hidden="true" />
      </div>
      <div className="border-glow-inner w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default BorderGlow;


