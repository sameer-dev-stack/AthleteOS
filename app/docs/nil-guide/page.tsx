import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NIL Guide — AthleteOS",
  description: "Everything you need to know about Name, Image, and Likeness (NIL) opportunities.",
};

export default function NilGuidePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg pt-24 pb-20">
        <div className="container-tight">
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            NIL Guide
          </h1>
          <p className="mt-4 text-lg text-ink-muted">
            Everything you need to know about monetizing your name, image, and likeness.
          </p>
          <div className="mt-12 max-w-2xl space-y-8">
            <section>
              <h2 className="text-xl font-bold text-white">What is NIL?</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Name, Image, and Likeness (NIL) rights allow college and high school athletes
                to profit from their personal brand. This includes sponsorships, endorsements,
                social media partnerships, and direct fan support.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-white">Getting Started</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                The first step is building your professional digital identity. Your AthleteOS card
                is your hub — it&apos;s where brands, fans, and schools find you. Complete your
                profile, add your stats, and share your card link everywhere.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-white">Building Your Brand</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Your brand is more than your stats. It&apos;s your story, your personality, and your
                reach. Use the AI toolkit to craft your bio, write sponsor pitches, and create
                content that resonates with your audience.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-white">Monetization Strategies</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Start with tips from fans. Add membership tiers for exclusive content. Build
                relationships with local brands. The AthleteOS monetization tools make it easy
                to get paid — directly from your card.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
