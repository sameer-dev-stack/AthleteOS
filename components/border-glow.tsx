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
  colors = ['#c084fc', '#f472b6', '#38bdf8'],
  fillOpacity = 0.5,
  style,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowLayerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const loopStartRef = useRef<number | null>(null);
  const lastXRef = useRef<number>(-1);
  const lastYRef = useRef<number>(-1);
  const lastFrameTimeRef = useRef<number>(0);
  const dimRef = useRef<{ w: number; h: number }>({ w: 360, h: 600 });
  const rectRef = useRef<DOMRect | null>(null);

  // Cache the bounding rect on scroll/resize only — NOT inside pointermove.
  // Reading getBoundingClientRect() on every pointer move forces a sync layout
  // flush (forced reflow) and is the main driver of DevTools' reflow warning.
  useEffect(() => {
    const measure = () => {
      if (cardRef.current) rectRef.current = cardRef.current.getBoundingClientRect();
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && cardRef.current) {
      ro = new ResizeObserver(measure);
      ro.observe(cardRef.current);
    }
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const layer = glowLayerRef.current;
    const rect = rectRef.current;
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
    layer.style.setProperty('--cursor-x', `${x | 0}px`);
    layer.style.setProperty('--cursor-y', `${y | 0}px`);
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // Cache dimensions via ResizeObserver — ZERO forced reflows during rAF ticks
    const updateDims = () => {
      if (card) {
        dimRef.current = {
          w: card.offsetWidth || 360,
          h: card.offsetHeight || 600,
        };
      }
    };
    updateDims();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateDims);
      ro.observe(card);
    }

    if (loop && active) {
      const layer = glowLayerRef.current;
      if (!layer) return;
      // ── Mobile: sweep loop disabled ─────────────────────
      // Touch devices get no border glow (see the (pointer: coarse)
      // block in border-glow.css). Delete this gate to re-enable.
      if (window.matchMedia?.('(pointer: coarse)').matches) return;
      const speed = 0.000025;
      // Coarse pointers (mobile) get a slower tick so the per-frame
      // custom-property writes — which invalidate the glow layer's styles —
      // happen ~31fps instead of ~50fps. The sweep takes 5s per perimeter,
      // so the halved write rate is visually indistinguishable.
      const frameInterval = window.matchMedia?.('(pointer: coarse)').matches === true ? 32 : 20;

      card.classList.add('glow-looping');
      layer.style.setProperty('--edge-proximity', '90');
      lastXRef.current = -1;
      lastYRef.current = -1;
      loopStartRef.current = null;

      const tick = (now: number) => {
        // rAF keeps firing in background tabs; skip work and reset the gate
        // so the sweep resumes immediately on return.
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
          layer.style.setProperty('--cursor-x', `${xi}px`);
          layer.style.setProperty('--cursor-y', `${yi}px`);
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
  }, [loop, active]);


  // Memoize static CSS vars — only recompute when props actually change
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
      onPointerMove={loop ? undefined : handlePointerMove}
      className={`border-glow-card ${className}`}
      style={mergedStyles}
    >
      <div ref={glowLayerRef} className="border-glow-layer" aria-hidden="true">
        <div className="border-glow-layer" aria-hidden="true">
        <span className="edge-light" />
      </div>
      </div>
      <div className="border-glow-inner w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default BorderGlow;


