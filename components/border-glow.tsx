"use client";

import React, { useRef, useCallback, useEffect } from 'react';
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
  colors = ['#c084fc', '#f472b6', '#38bdf8'],
  fillOpacity = 0.5,
  style,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const loopStartRef = useRef<number | null>(null);

  const getCenterOfElement = useCallback((el: HTMLElement): [number, number] => {
    const { width, height } = el.getBoundingClientRect();
    return [width / 2, height / 2];
  }, []);

  const getEdgeProximity = useCallback((el: HTMLElement, x: number, y: number): number => {
    const [cx, cy] = getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    let kx = Infinity;
    let ky = Infinity;
    if (dx !== 0) kx = cx / Math.abs(dx);
    if (dy !== 0) ky = cy / Math.abs(dy);
    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  }, [getCenterOfElement]);

  const getCursorAngle = useCallback((el: HTMLElement, x: number, y: number): number => {
    const [cx, cy] = getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    if (dx === 0 && dy === 0) return 0;
    const radians = Math.atan2(dy, dx);
    let degrees = radians * (180 / Math.PI) + 90;
    if (degrees < 0) degrees += 360;
    return degrees;
  }, [getCenterOfElement]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const edge = getEdgeProximity(card, x, y);
    const angle = getCursorAngle(card, x, y);

    card.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(3)}`);
    card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
    card.style.setProperty('--cursor-x', `${x.toFixed(1)}px`);
    card.style.setProperty('--cursor-y', `${y.toFixed(1)}px`);
  }, [getEdgeProximity, getCursorAngle]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    if (loop && active) {
      const rect = card.getBoundingClientRect();
      const w = rect.width || 300;
      const h = rect.height || 400;
      const perimeter = 2 * (w + h);
      const speed = 0.0004;
      const proximity = 90;

      card.classList.add('glow-looping');
      card.style.setProperty('--edge-proximity', `${proximity}`);

      const tick = (now: number) => {
        if (!loopStartRef.current) loopStartRef.current = now;
        const elapsed = now - loopStartRef.current;
        const t = (elapsed * speed) % 1;
        const dist = t * perimeter;

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

        card.style.setProperty('--cursor-x', `${x.toFixed(1)}px`);
        card.style.setProperty('--cursor-y', `${y.toFixed(1)}px`);

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        card.classList.remove('glow-looping');
        loopStartRef.current = null;
      };
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      card.classList.remove('glow-looping');
      loopStartRef.current = null;
    }
  }, [loop, active]);

  const glowVars = buildGlowVars(glowColor, glowIntensity);

  const mergedStyles: CustomCSSProperties = {
    '--card-bg': backgroundColor,
    '--edge-sensitivity': edgeSensitivity,
    '--border-radius': `${borderRadius}px`,
    '--glow-padding': `${glowRadius}px`,
    '--cone-spread': coneSpread,
    '--fill-opacity': fillOpacity,
    ...glowVars,
    ...buildGradientVars(colors),
    ...style,
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={loop ? undefined : handlePointerMove}
      className={`border-glow-card ${className}`}
      style={mergedStyles}
    >
      <span className="edge-light" />
      <div className="border-glow-inner w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default BorderGlow;


