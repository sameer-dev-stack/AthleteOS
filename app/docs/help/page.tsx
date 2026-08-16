import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center — NIL CARD",
  description: "Get help with your NIL CARD account and athlete card.",
};

export default function HelpCenterPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg pt-24 pb-20">
        <div className="container-tight">
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            Help Center
          </h1>
          <p className="mt-4 text-lg text-ink-muted">
            Answers to common questions about NIL CARD.
          </p>
          <div className="mt-12 max-w-2xl space-y-8">
            <section>
              <h2 className="text-xl font-bold text-white">How do I create my athlete card?</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Sign up for free, complete the onboarding flow, and your card will be live at
                nilcard.app/your-username. You can customize your card from the Profile Editor
                in your dashboard.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-white">How do I get tips?</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Connect your Stripe account from the Billing page in your dashboard. Once connected,
                fans can send you tips directly from your public card. You&apos;ll receive an email
                notification each time.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-white">How do I upgrade to Pro?</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Go to Billing in your dashboard and select the Pro plan ($14/mo). This unlocks
                300 AI actions per month, analytics, custom branding, and priority support.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-white">How do I delete my account?</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Go to Settings in your dashboard and click &quot;Delete Account.&quot; This will permanently
                remove all your data. This action cannot be undone.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-white">Contact support</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Need more help? Email us at{" "}
                <a href="mailto:                  hey@nilcard.app" className="text-accent hover:underline">
                  hey@nilcard.app
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
