"use client";

import React, { useMemo } from 'react';
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

export const BorderGlow: React.FC<BorderGlowProps> = ({
  children,
  className = '',
  backgroundColor = '#0d0d12',
  borderRadius = 20,
  loop = true,
  active = true,
  colors = ['#C6FF3D', '#C6FF3Dcc', '#C6FF3D40'],
  style,
}) => {
  const c1 = colors[0] || '#C6FF3D';
  const c2 = colors[1] || `${c1}b3`;
  const c3 = colors[2] || `${c1}26`;

  const customStyles = useMemo<React.CSSProperties>(() => ({
    '--card-bg': backgroundColor,
    '--border-radius': `${borderRadius}px`,
    '--glow-c1': c1,
    '--glow-c2': c2,
    '--glow-c3': c3,
    ...style,
  } as React.CSSProperties), [backgroundColor, borderRadius, c1, c2, c3, style]);

  return (
    <div
      className={`border-glow-card ${active ? '' : 'is-paused'} ${className}`}
      style={customStyles}
    >
      {/* Outer blurred aura glow following the snake */}
      {loop && (
        <div className="border-glow-outer" aria-hidden="true">
          <div className="border-glow-outer-beam" />
        </div>
      )}

      {/* Crisp 1.5px glowing snake border track */}
      {loop && (
        <div className="border-glow-track" aria-hidden="true">
          <div className="border-glow-track-beam" />
        </div>
      )}

      {/* Base structure hairline border */}
      <div className="border-glow-base" aria-hidden="true" />

      {/* Inner card surface slot */}
      <div className="border-glow-inner">
        {children}
      </div>
    </div>
  );
};

export default BorderGlow;

