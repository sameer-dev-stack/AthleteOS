import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — AthleteOS",
  description: "Terms of service for AthleteOS.",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg pt-24 pb-20">
        <div className="container-tight">
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm text-ink-dim">Last updated: July 2026</p>
          <div className="mt-8 max-w-2xl space-y-6 text-sm leading-relaxed text-ink-muted">
            <p>
              Welcome to AthleteOS. By using our service, you agree to these terms.
            </p>
            <h2 className="text-lg font-bold text-white">1. Service</h2>
            <p>
              AthleteOS provides a digital identity and monetization platform for athletes.
              We reserve the right to modify or discontinue the service at any time.
            </p>
            <h2 className="text-lg font-bold text-white">2. Accounts</h2>
            <p>
              You are responsible for maintaining the security of your account. You must
              be at least 13 years old to use AthleteOS.
            </p>
            <h2 className="text-lg font-bold text-white">3. Payments</h2>
            <p>
              All payments are processed through Stripe. AthleteOS charges a 5% platform
              fee on tips. Subscription fees are billed monthly. Refunds are handled
              case-by-case.
            </p>
            <h2 className="text-lg font-bold text-white">4. Content</h2>
            <p>
              You retain ownership of all content you upload. You grant AthleteOS a
              license to display your content on the platform. You agree not to upload
              content that is illegal, harmful, or violates others&apos; rights.
            </p>
            <h2 className="text-lg font-bold text-white">5. Termination</h2>
            <p>
              You may delete your account at any time from Settings. We may suspend
              accounts that violate these terms.
            </p>
            <p>
              Contact us at{" "}
              <a href="mailto:hey@athleteos.app" className="text-accent hover:underline">
                hey@athleteos.app
              </a>{" "}
              for questions about these terms.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
