import { AnnouncementBar } from "@/components/announcement-bar";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { LandingSections } from "@/components/landing-sections";

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
      description: "NIL Valuation Engine, Sponsor Pitch Generator, Rate Card & 300 AI actions/mo",
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
      <LandingSections />
    </main>
  );
}
