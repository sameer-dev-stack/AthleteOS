"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  images: string[];
  alt: string;
  accent: string;
};

export function PhotoGallery({ images, alt, accent }: Props) {
  const [active, setActive] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const childWidthRef = useRef<number>(0);

  // Reset the cached child width whenever the image set changes so it is
  // recomputed from the new DOM.
  useEffect(() => {
    childWidthRef.current = 0;
  }, [images]);

  const scrollTo = useCallback((index: number) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const child = container.children[index] as HTMLElement;
    if (child) {
      container.scrollTo({ left: child.offsetLeft - 16, behavior: "smooth" });
      setActive(index);
    }
  }, []);

  if (images.length <= 1) {
    return (
      <div className="relative w-full h-full overflow-hidden">
        {images[0] ? (
          <Image
            src={images[0]}
            alt={alt}
            fill
            className="object-cover object-top"
            unoptimized
            priority
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: `linear-gradient(160deg, ${accent}20 0%, #0D0D11 100%)` }}
          >
            <div
              className="h-28 w-28 rounded-full flex items-center justify-center text-4xl font-black"
              style={{ background: `${accent}22`, border: `2px solid ${accent}50`, color: accent }}
            >
              {alt.slice(0, 2).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div
        ref={scrollRef}
        className="flex h-full overflow-x-auto snap-x snap-mandatory scrollbar-none"
        style={{ scrollSnapType: "x mandatory" }}
        onScroll={(e) => {
          const container = e.currentTarget;
          const scrollLeft = container.scrollLeft;
          // Cache child width on the first scroll; only recompute it when the
          // layout can actually change. Reading getBoundingClientRect() here
          // on every scroll frame forces a synchronous layout flush.
          if (childWidthRef.current === 0) {
            childWidthRef.current = container.children[0]?.getBoundingClientRect().width || 1;
          }
          const childWidth = childWidthRef.current;
          const newActive = Math.round(scrollLeft / childWidth);
          if (newActive !== active) setActive(newActive);
        }}
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-full h-full snap-center"
            style={{ scrollSnapAlign: "center" }}
          >
            <Image
              src={src}
              alt={`${alt} ${i + 1}`}
              fill
              className="object-cover object-top"
              unoptimized
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10" role="tablist" aria-label="Photo gallery navigation">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              role="tab"
              aria-selected={active === i}
              aria-label={`Go to photo ${i + 1}`}
              className="transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              style={{
                width: active === i ? "16px" : "6px",
                height: "6px",
                borderRadius: "3px",
                background: active === i ? accent : "rgba(255,255,255,0.3)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
