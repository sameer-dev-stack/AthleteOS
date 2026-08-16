import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — NIL CARD",
  description: "The operating system for the next generation of NIL athletes.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg pt-24 pb-20">
        <div className="container-tight">
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            About NIL CARD
          </h1>
          <div className="mt-8 max-w-2xl space-y-6 text-base leading-relaxed text-ink-muted">
            <p>
              NIL CARD is the operating system for the next generation of NIL athletes.
              We believe every athlete deserves a professional digital identity, the tools
              to monetize their brand, and the AI assistance to grow — without needing an
              agency or a marketing team.
            </p>
            <p>
              One card. One link. Your entire NIL business. That&apos;s the promise.
              We&apos;re building the platform that turns attention into income for
              athletes at every level — from high school recruits to professional stars.
            </p>
            <p>
              Built by athletes, for athletes. Based in the US.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
