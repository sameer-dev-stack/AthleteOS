import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SmoothScroll } from "@/components/smooth-scroll";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { CookieConsent } from "@/components/providers/cookie-consent";
import { ServiceWorkerRegistration } from "@/components/providers/sw-registration";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.nilcard.app";
const SITE_NAME = "NIL CARD";
const TITLE = "NIL CARD — The NIL operating system for athletes";
const DESCRIPTION =
  "One card. One link. One platform to build your NIL brand, get discovered, and turn your audience into income. AI-powered. Athlete-owned.";

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "NIL",
    "Name Image Likeness",
    "athlete platform",
    "athlete card",
    "NIL deals",
    "athlete monetization",
    "NIL app",
    "student athlete",
    "college athlete",
    "sports marketing",
    "NIL CARD",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Sports",
  manifest: "/manifest.json",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: `${SITE_URL}/`,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
        images: [
          {
            url: "/og-image.png",
            width: 1200,
            height: 630,
            alt: "NIL CARD — One card. One link. Your entire NIL business.",
          },
        ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/twitter-image.png"],
    creator: "@nilcard",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/apple-icon.png",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "NIL CARD",
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#0A0A0B",
    "msapplication-tap-highlight": "no",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0A0A0B" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0B" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: "dark",
  viewportFit: "cover",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description: DESCRIPTION,
  sameAs: [
    "https://twitter.com/nilcard",
    "https://instagram.com/nilcard",
    "https://youtube.com/@nilcard",
    "https://tiktok.com/@nilcard",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "hey@nilcard.app",
    contactType: "customer support",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: DESCRIPTION,
  inLanguage: "en-US",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="safe-area-top min-h-screen overflow-x-hidden">
        <script
          key="jsonld-organization"
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          key="jsonld-website"
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-5 focus:py-2 focus:text-sm focus:font-semibold focus:text-bg focus:shadow-[0_0_40px_-8px_rgba(198,255,61,0.6)] focus:outline-none"
        >
          Skip to content
        </a>
        <PostHogProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </PostHogProvider>
        <Analytics />
        <CookieConsent />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
