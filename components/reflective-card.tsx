"use client";

/*
 * ReflectiveCard
 * ──────────────
 * Webcam-feed metallic card shell from React Bits.
 * Adapted for Next.js TypeScript with:
 *   • children content slot (athlete card UI renders inside)
 *   • graceful fallback when webcam is unavailable / denied
 *   • shared stream via streamRef prop for flip-card dedup
 *   • full prop API matching original React Bits spec
 *   • CSS custom properties for all visual tokens
 *
 * The webcam feed is blurred, desaturated, and displaced by
 * SVG filters to simulate a real-time metallic reflection.
 * Content (children) renders on top at z-index: 10.
 *
 * Props:
 *   blurStrength        blur intensity (0–20 px)          default 12
 *   metalness           sheen opacity (0–1)                default 1
 *   roughness           noise texture opacity (0–1)        default 0.4
 *   displacementStrength warp amount                       default 20
 *   noiseScale          ripple scale                       default 1
 *   specularConstant    shininess                          default 1.2
 *   grayscale           0 = full color, 1 = pure gray      default 1
 *   glassDistortion     edge glass warp strength           default 0
 *   color               base text color                    default "white"
 *   overlayColor        surface tint                       default "rgba(0,0,0,0.18)"
 *   radius              border radius                      default 20
 *   filterId            unique SVG filter id (for multi-instance) default "rc-metallic-displacement"
 *   streamRef           shared MediaStream ref (optional)
 *   className / style   passthrough
 *   children            card content rendered inside
 */

import { useEffect, useRef, useState } from "react";
import "./reflective-card.css";

/** Phones/tablets: skip the live webcam + SVG displacement filter entirely —
 *  it recomposites two filtered video layers every frame on a mobile GPU. */
function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(pointer: coarse)").matches === true ||
    (window.navigator.maxTouchPoints ?? 0) > 1
  );
}

/* ── Props ─────────────────────────────────────────── */
export interface ReflectiveCardProps {
  /* Material */
  blurStrength?:         number;
  metalness?:            number;
  roughness?:            number;
  displacementStrength?: number;
  noiseScale?:           number;
  specularConstant?:     number;
  grayscale?:            number;
  glassDistortion?:      number;
  /* Surface */
  color?:                string;
  overlayColor?:         string;
  backgroundGradient?:   string;
  radius?:               number;
  /* Instance */
  filterId?:             string;
  /** Pass a shared MediaStream ref so multiple faces share one webcam */
  streamRef?:            React.RefObject<MediaStream | null>;
  /** When false, skip webcam + SVG filters and render a static surface */
  active?:               boolean;
  /* Passthrough */
  className?:            string;
  style?:                React.CSSProperties;
  children?:             React.ReactNode;
}

/* ── Component ─────────────────────────────────────── */
export function ReflectiveCard({
  blurStrength         = 12,
  metalness            = 1,
  roughness            = 0.4,
  displacementStrength = 20,
  noiseScale           = 1,
  specularConstant     = 1.2,
  grayscale            = 1,
  glassDistortion      = 0,
  color                = "white",
  overlayColor         = "rgba(0, 0, 0, 0.18)",
  backgroundGradient,
  radius               = 20,
  filterId             = "rc-metallic-displacement",
  streamRef,
  active               = true,
  className            = "",
  style                = {},
  children,
}: ReflectiveCardProps) {
  const videoRef              = useRef<HTMLVideoElement>(null);
  const localStreamRef        = useRef<MediaStream | null>(null);
  const [webcamReady, setWebcamReady]   = useState(false);
  const [webcamDenied, setWebcamDenied] = useState(false);

  /* ── Webcam lifecycle ─────────────────────────────── */
  useEffect(() => {
    // Mobile GPUs can't recomposite a filtered live video each frame.
    // Fall back to the static metallic gradient instead.
    if (isCoarsePointer()) {
      const raf = requestAnimationFrame(() => setWebcamDenied(true));
      return () => cancelAnimationFrame(raf);
    }

    // If a shared stream ref is provided and already has a stream, reuse it
    const shared = streamRef?.current;
    if (shared && videoRef.current) {
      videoRef.current.srcObject = shared;
      setWebcamReady(true);
      return;
    }

    let mounted = true;
    let localStream: MediaStream | null = null;

    async function startWebcam() {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width:      { ideal: 640 },
            height:     { ideal: 480 },
            facingMode: "user",
          },
        });

        if (!mounted) {
          localStream.getTracks().forEach((t) => t.stop());
          return;
        }

        // Store in the shared ref if provided so a sibling face can reuse
        if (streamRef && "current" in streamRef) {
          (streamRef as React.MutableRefObject<MediaStream | null>).current = localStream;
        }
        localStreamRef.current = localStream;

        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
          setWebcamReady(true);
        }
      } catch {
        // Webcam unavailable or denied — fallback renders instead
        if (mounted) setWebcamDenied(true);
      }
    }

    startWebcam();

    return () => {
      mounted = false;
      // Only stop tracks if we own the stream (not the shared one)
      if (localStreamRef.current && !streamRef?.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Derived SVG values ───────────────────────────── */
  const baseFrequency = 0.03 / Math.max(0.1, noiseScale);
  const saturation    = 1 - Math.max(0, Math.min(1, grayscale));

  /* ── CSS custom property map ─────────────────────── */
  const cssVars: React.CSSProperties = {
    "--rc-blur":       `${blurStrength}px`,
    "--rc-metalness":  metalness,
    "--rc-roughness":  roughness,
    "--rc-overlay":    overlayColor,
    "--rc-saturation": saturation,
    "--rc-radius":     `${radius}px`,
    color,
  } as React.CSSProperties;

  return (
    <div
      className={`rc-container ${className}`}
      style={{ ...cssVars, ...style }}
    >
      {/* ── SVG filter definitions ────────────────── */}
      {active && webcamReady && !webcamDenied ? (
        <svg className="rc-svg-filters" aria-hidden="true" focusable="false">
          <defs>
            <filter
              id={filterId}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              {/* Step 1: Generate organic noise field */}
              <feTurbulence
                type="turbulence"
                baseFrequency={baseFrequency}
                numOctaves="1"
                result="noise"
              />

              {/* Step 2: Extract luminance → alpha channel */}
              <feColorMatrix
                in="noise"
                type="luminanceToAlpha"
                result="noiseAlpha"
              />

              {/* Step 3: Warp the source image with the noise field */}
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={displacementStrength}
                xChannelSelector="R"
                yChannelSelector="G"
                result="rippled"
              />

              {/* Step 4: Generate specular lighting from the noise */}
              <feSpecularLighting
                in="noiseAlpha"
                surfaceScale={displacementStrength}
                specularConstant={specularConstant}
                specularExponent="20"
                lightingColor="#ffffff"
                result="light"
              >
                <fePointLight x="0" y="0" z="300" />
              </feSpecularLighting>

              {/* Step 5: Clip lighting to the warped image shape */}
              <feComposite
                in="light"
                in2="rippled"
                operator="in"
                result="light-effect"
              />

              {/* Step 6: Blend specular highlights over displaced image */}
              <feBlend
                in="light-effect"
                in2="rippled"
                mode="screen"
                result="final"
              />
            </filter>
          </defs>
        </svg>
      ) : null}

      {/* ── Reflective surface ────────────────────── */}
      {(!active || webcamDenied) ? (
        /* Static dark surface fallback */
        <div
          className="rc-video-fallback"
          style={{
            background: "#0d0d12",
          }}
          aria-hidden="true"
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="rc-video"
          aria-hidden="true"
          style={{
            filter: `saturate(var(--rc-saturation, 0)) contrast(125%) brightness(108%) blur(var(--rc-blur, 12px))`,
            opacity: webcamReady ? 0.88 : 0,
          } as React.CSSProperties}
        />
      )}

      {/* ── Material layers ───────────────────────── */}
      {active && (
        <>
          <div className="rc-noise"   aria-hidden="true" />
          <div className="rc-sheen"   aria-hidden="true" />
          {backgroundGradient && (
            <div
              className="rc-theme-gradient"
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                pointerEvents: "none",
                background: backgroundGradient,
                opacity: 0.70,
                mixBlendMode: "overlay",
              }}
              aria-hidden="true"
            />
          )}
        </>
      )}
      <div className="rc-overlay" aria-hidden="true" />
      <div className="rc-border"  aria-hidden="true" />

      {/* ── Content slot ──────────────────────────── */}
      <div className="rc-content">
        {children}
      </div>
    </div>
  );
}

export default ReflectiveCard;
