import { AnnouncementBar } from "@/components/announcement-bar";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { LandingSections } from "@/components/landing-sections";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nilcard.app";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "NIL CARD",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "The operating system for the next generation of NIL athletes. Build your digital card, monetize your brand, and grow your NIL business.",
  url: SITE_URL,
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
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "500",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Who is NIL CARD for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Student-athletes at any level who want to look professional, get discovered by brands, and turn their audience into income. Works for D1 stars, JUCO, high-school recruits, and Olympic hopefuls.",
      },
    },
    {
      "@type": "Question",
      name: "Is this compliant with NCAA and state NIL rules?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. NIL CARD gives athletes the platform; you control which deals you accept. We integrate with standard NIL disclosure flows and support school and collective compliance teams at the Team tier.",
      },
    },
    {
      "@type": "Question",
      name: "What does the free plan actually include?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A live public athlete card, custom URL, tip jar, basic monetization, 5 total AI generations per month, and basic analytics. It's a real product, not a 14-day trial.",
      },
    },
    {
      "@type": "Question",
      name: "How do payouts work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Stripe-powered. Direct deposit to your bank account, usually within 2 business days. Athletes keep 92%+ of every dollar after standard payment processing.",
      },
    },
    {
      "@type": "Question",
      name: "Can my school or collective onboard a whole roster?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The Team plan handles bulk onboarding, branded team pages, roster analytics, and compliance support.",
      },
    },
  ],
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
      <script
        key="jsonld-faq"
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <AnnouncementBar />
      <Navbar />
      <Hero />
      <LandingSections />
    </main>
  );
}
