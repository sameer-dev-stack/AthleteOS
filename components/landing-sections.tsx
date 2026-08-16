import { TrustStrip } from "@/components/trust-strip";
import { Problem } from "@/components/problem";
import { Solution } from "@/components/solution";
import { Testimonials } from "@/components/testimonials";
import { Features } from "@/components/features";
import { HowItWorks } from "@/components/how-it-works";
import { AIFeatures } from "@/components/ai-features";
import { Monetization } from "@/components/monetization";
import { Pricing } from "@/components/pricing";
import { FAQ } from "@/components/faq";
import { FinalCTA } from "@/components/final-cta";
import { Footer } from "@/components/footer";
import { InstallBanner } from "@/components/install-banner";

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
