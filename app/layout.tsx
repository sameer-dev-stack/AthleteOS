import type { Metadata, Viewport } from "next";
import Script from "next/script";
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

const _rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.nilcard.app";
const SITE_URL = _rawSiteUrl.startsWith("http://") || _rawSiteUrl.startsWith("https://") ? _rawSiteUrl : `https://${_rawSiteUrl}`;
const SITE_NAME = "NIL CARD";
const TITLE = "NIL CARD â€” The NIL operating system for athletes";
const DESCRIPTION =
  "One card. One link. One platform to build your NIL brand, get discovered, and turn your audience into income. AI-powered. Athlete-owned.";

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: `%s Â· ${SITE_NAME}`,
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
            alt: "NIL CARD â€” One card. One link. Your entire NIL business.",
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
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/apple-touch-icon.png",
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
  logo: `${SITE_URL}/favicon.svg`,
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
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `*,:before,:after{box-sizing:border-box}html{-webkit-text-size-adjust:100%;line-height:1.5}body{margin:0;background:#0A0A0B;color:#F5F5F7;font-family:var(--font-sans),ui-sans-serif,system-ui,sans-serif;overflow-x:hidden}main{position:relative}a{color:inherit;text-decoration:inherit}.bg-bg{background-color:#0A0A0B}.text-ink{color:#F5F5F7}.text-accent{color:#C6FF3D}`,
          }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-END1CXF54P"
          strategy="afterInteractive"
        />
        <Script id="gtag-config" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-END1CXF54P');`}
        </Script>
      </head>
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
