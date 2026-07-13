"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight, Instagram, Twitter, Youtube, Music2, Check } from "lucide-react";
import { Logo } from "./logo";
import { Magnetic } from "./motion/magnetic";
import { subscribeNewsletterAction } from "@/lib/actions/waitlist";

const COLS = [
  {
    title: "Product",
    links: [
      { label: "Athlete card", href: "#product" },
      { label: "How it works", href: "#how" },
      { label: "AI tools", href: "#ai" },
      { label: "Monetization", href: "#monetize" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "For",
    links: [
      { label: "Athletes", href: "/onboarding" },
      { label: "Brands", href: "/discover" },
      { label: "Schools & teams", href: "/teams/setup" },
      { label: "Browse athletes", href: "/discover" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "mailto:hey@athleteos.app" },
      { label: "Twitter", href: "https://x.com/athleteos" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "NIL guide", href: "/docs/nil-guide" },
      { label: "Help center", href: "/docs/help" },
      { label: "Changelog", href: "/changelog" },
      { label: "Feature requests", href: "/feedback" },
      { label: "Terms of service", href: "/legal/terms" },
      { label: "Privacy policy", href: "/legal/privacy" },
    ],
  },
];

const SOCIALS = [
  { icon: Instagram, label: "Instagram", href: "https://instagram.com/athleteos" },
  { icon: Twitter, label: "X", href: "https://x.com/athleteos" },
  { icon: Youtube, label: "YouTube", href: "https://youtube.com/@athleteos" },
  { icon: Music2, label: "TikTok", href: "https://tiktok.com/@athleteos" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.06] bg-bg">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(198,255,61,0.06),transparent_60%)]"
        aria-hidden
      />
      {/* Top hairline accent */}
      <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-md bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      <div className="container-wide pt-12 sm:pt-16">
        {/* Mini CTA strip */}
        <div className="flex flex-col items-start justify-between gap-6 border-b border-white/[0.05] pb-10 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-dim">
              Still scrolling?
            </p>
            <h3 className="mt-3 text-display-md font-semibold tracking-tight">
              <span className="text-ink">Your card is </span>
              <span className="relative inline-block">
                <span className="text-accent">waiting</span>
                <span
                  className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-accent/40"
                  aria-hidden
                />
              </span>
              <span className="text-ink">.</span>
            </h3>
          </div>
          <Magnetic strength={0.2}>
            <Link
              href="#waitlist"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-bg transition-all hover:bg-accent-soft hover:shadow-[0_10px_40px_-10px_rgba(198,255,61,0.6)]"
            >
              Join the waitlist
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </Magnetic>
        </div>

        {/* Main grid */}
        <div className="grid gap-12 py-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Logo />
              <span className="text-lg font-semibold tracking-tight">AthleteOS</span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-muted text-pretty">
              The operating system for the next generation of NIL athletes. Build your card,
              own your brand, get paid.
            </p>

            {/* Newsletter */}
            <NewsletterForm />

            {/* Socials */}
            <div className="mt-7 flex items-center gap-2">
              {SOCIALS.map((s) => (
                <Magnetic key={s.label} strength={0.3}>
                  <Link
                    href={s.href}
                    aria-label={s.label}
                    className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] text-ink-muted transition-all duration-300 hover:border-accent/40 hover:text-accent hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.4)]"
                  >
                    <s.icon className="h-4 w-4" />
                  </Link>
                </Magnetic>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
            {COLS.map((col) => (
              <div key={col.title}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
                  {col.title}
                </p>
                <ul className="mt-5 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <FooterLink href={l.href}>{l.label}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Status row */}
        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/[0.05] py-7 sm:flex-row sm:items-center">
          <p className="text-xs text-ink-dim">
            © {new Date().getFullYear()} AthleteOS, Inc. Built for the athlete economy.
          </p>
          <div className="flex items-center gap-5 text-xs text-ink-dim">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-50" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              All systems live
            </span>
            <span>·</span>
            <span className="font-mono">v0.1 · beta</span>
            <span>·</span>
            <span>Made with sweat</span>
          </div>
        </div>
      </div>

      {/* Cinematic wordmark */}
      <ParallaxWordmark />
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative inline-flex items-center text-sm text-ink-muted transition-colors hover:text-ink"
    >
      <span className="relative">
        {children}
        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
      </span>
      <ArrowUpRight className="ml-0.5 h-3 w-3 opacity-0 -translate-x-1 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
    </Link>
  );
}

function ParallaxWordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 60, damping: 20 });
  const smy = useSpring(my, { stiffness: 60, damping: 20 });

  const translateX = useTransform(smx, [-1, 1], [-30, 30]);
  const translateY = useTransform(smy, [-1, 1], [-12, 12]);
  const skewX = useTransform(smx, [-1, 1], [-3, 3]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (window.innerWidth / 2);
      const dy = (e.clientY - cy) / (window.innerHeight / 2);
      mx.set(Math.max(-1, Math.min(1, dx)));
      my.set(Math.max(-1, Math.min(1, dy)));
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  return (
    <div
      ref={ref}
      className="relative mt-4 select-none overflow-hidden"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      <div className="container-wide">
        <motion.div
          style={{ x: translateX, y: translateY, skewX }}
          className="relative"
        >
          <div
            className="text-center font-display font-extrabold leading-[0.85] tracking-tighter"
            style={{
              fontSize: "clamp(2.5rem, 11vw, 9rem)",
              backgroundImage:
                "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 60%, transparent 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextStroke: "1px rgba(255,255,255,0.04)",
              transition: "all 0.6s ease",
            }}
          >
            ATHLETEOS
          </div>

          {/* Accent layer that lights up on hover */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 text-center font-display font-extrabold leading-[0.85] tracking-tighter transition-opacity duration-700"
            style={{
              fontSize: "clamp(2.5rem, 11vw, 9rem)",
              backgroundImage:
                "linear-gradient(180deg, rgba(198,255,61,0.18) 0%, rgba(198,255,61,0.02) 60%, transparent 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              opacity: active ? 1 : 0,
            }}
          >
            ATHLETEOS
          </div>
        </motion.div>
      </div>

      {/* Bottom mask fade */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-bg to-transparent"
        aria-hidden
      />
    </div>
  );
}

function NewsletterForm() {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await subscribeNewsletterAction(formData);
      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <div className="mt-7 flex max-w-sm items-center gap-2 rounded-full border border-accent/30 bg-accent/5 py-1.5 pl-5 pr-4">
        <Check className="h-4 w-4 text-accent" />
        <span className="text-sm text-accent">You{"'"}re in. Watch your inbox.</span>
      </div>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="group mt-7 flex max-w-sm items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] py-1.5 pl-5 pr-1.5 transition-all focus-within:border-accent/40 focus-within:bg-white/[0.04]"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        placeholder="Newsletter — drops only"
        disabled={isPending}
        className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-dim focus:outline-none disabled:opacity-50"
      />
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="absolute h-0 w-0 opacity-0"
        aria-hidden
      />
      <button
        type="submit"
        disabled={isPending}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-bg transition-transform hover:scale-105 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        aria-label="Subscribe"
      >
        {isPending ? (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-bg border-t-transparent" />
        ) : (
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.4} />
        )}
      </button>
    </form>
  );
}
