import dynamic from "next/dynamic";
import { AnnouncementBar } from "@/components/announcement-bar";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";

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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AthleteOS",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "The operating system for the next generation of NIL athletes. Build your digital card, monetize your brand, and grow your NIL business.",
  url: "https://athleteos.app",
  offers: [
    {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      name: "Free",
      description: "Basic athlete card with essential features",
    },
    {
      "@type": "Offer",
      price: "14",
      priceCurrency: "USD",
      name: "Pro",
      description: "300 AI actions/month, analytics, custom branding",
      billingPeriod: "month",
    },
    {
      "@type": "Offer",
      price: "29",
      priceCurrency: "USD",
      name: "Elite",
      description: "Unlimited AI actions, priority support, team features",
      billingPeriod: "month",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "500",
  },
};

export default function Home() {
  return (
    <main id="main" className="relative">
      <script
        key="jsonld-software-app"
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AnnouncementBar />
      <Navbar />
      <Hero />
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
    </main>
  );
}
