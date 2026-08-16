import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — NIL CARD",
  description: "Privacy policy for NIL CARD.",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg pt-24 pb-20">
        <div className="container-tight">
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-ink-dim">Last updated: July 2026</p>
          <div className="mt-8 max-w-2xl space-y-6 text-sm leading-relaxed text-ink-muted">
            <p>
              Your privacy is important to us. This policy describes how NIL CARD
              collects, uses, and protects your information.
            </p>
            <h2 className="text-lg font-bold text-white">Information We Collect</h2>
            <p>
              Account information (email, name, sport, school), profile content you
              upload, usage analytics (page views, link clicks), and payment information
              (processed by Stripe — we never store card details).
            </p>
            <h2 className="text-lg font-bold text-white">How We Use Your Information</h2>
            <p>
              To provide and improve the service, send you relevant notifications, and
              generate analytics for your athlete card. We use PostHog for product
              analytics (opt-out available via cookie consent).
            </p>
            <h2 className="text-lg font-bold text-white">Data Sharing</h2>
            <p>
              We do not sell your data. We share data only with service providers
              necessary to operate the platform (Supabase, Stripe, Resend, Vercel,
              Sentry, PostHog).
            </p>
            <h2 className="text-lg font-bold text-white">Your Rights</h2>
            <p>
              You can export your data or delete your account at any time from
              Settings. For GDPR/CCPA requests, contact us at{" "}
              <a href="mailto:hey@nilcard.app" className="text-accent hover:underline">
                hey@nilcard.app
              </a>
            </p>
            <h2 className="text-lg font-bold text-white">Security</h2>
            <p>
              We use industry-standard encryption and security practices. All data is
              transmitted over HTTPS. Database access is controlled via Row Level
              Security policies.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
