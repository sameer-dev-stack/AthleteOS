"use client";

import dynamic from "next/dynamic";

const TrustStrip = dynamic(() => import("@/components/trust-strip").then(m => ({ default: m.TrustStrip })), { ssr: false });
const Problem = dynamic(() => import("@/components/problem").then(m => ({ default: m.Problem })), { ssr: false });
const Solution = dynamic(() => import("@/components/solution").then(m => ({ default: m.Solution })), { ssr: false });
const Testimonials = dynamic(() => import("@/components/testimonials").then(m => ({ default: m.Testimonials })), { ssr: false });
const Features = dynamic(() => import("@/components/features").then(m => ({ default: m.Features })), { ssr: false });
const HowItWorks = dynamic(() => import("@/components/how-it-works").then(m => ({ default: m.HowItWorks })), { ssr: false });
const AIFeatures = dynamic(() => import("@/components/ai-features").then(m => ({ default: m.AIFeatures })), { ssr: false });
const Monetization = dynamic(() => import("@/components/monetization").then(m => ({ default: m.Monetization })), { ssr: false });
const Pricing = dynamic(() => import("@/components/pricing").then(m => ({ default: m.Pricing })), { ssr: false });
const FAQ = dynamic(() => import("@/components/faq").then(m => ({ default: m.FAQ })), { ssr: false });
const FinalCTA = dynamic(() => import("@/components/final-cta").then(m => ({ default: m.FinalCTA })), { ssr: false });
const Footer = dynamic(() => import("@/components/footer").then(m => ({ default: m.Footer })), { ssr: false });
const InstallBanner = dynamic(() => import("@/components/install-banner").then(m => ({ default: m.InstallBanner })), { ssr: false });

export function LandingSections() {
  return (
    <>
      <TrustStrip />
      <Problem />
      <Solution />
      <Testimonials />
      <Features />
      <HowItWorks />
      <AIFeatures />
      <Monetization />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
      <InstallBanner />
    </>
  );
}
