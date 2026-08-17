"use client";

import { useState } from "react";
import { MessageSquare, Copy, Check, Send, Mail, Clock } from "lucide-react";

type Props = {
  themeAccent?: string;
  athleteName?: string;
  sport?: string | null;
  school?: string | null;
};

export function NilPitchGenerator({
  themeAccent = "#C6FF3D",
  athleteName = "Athlete",
  sport = "Collegiate Sport",
  school = "University",
}: Props) {
  const [brandName, setBrandName] = useState("");
  const [category, setCategory] = useState("Local Business");
  const [deliverable, setDeliverable] = useState("Social Media Post");
  const [activeTab, setActiveTab] = useState<"dm" | "email" | "followup">("dm");
  const [copied, setCopied] = useState(false);

  const cleanBrand = brandName.trim() || "Brand";

  // Template generators
  const templates = {
    dm: `Hey ${cleanBrand} team! 👋 My name is ${athleteName}, a ${sport} athlete at ${school}. I love your brand and use your products regularly. I'd love to partner up on a ${deliverable} to feature ${cleanBrand} to my engaged audience. Let me know if you'd be open to checking out my NIL CARD rate card! 🚀`,

    email: `Subject: Partnership Proposal: ${athleteName} x ${cleanBrand}

Hi ${cleanBrand} Marketing Team,

My name is ${athleteName}, and I am currently a ${sport} student-athlete at ${school}. 

I am a genuine fan of ${cleanBrand} and would love to collaborate on a sponsored ${deliverable} targeting collegiate fans and active lifestyle consumers in our community.

Attached/linked is my verified NIL CARD media card detailing my audience metrics and rate card.

Would you be open to a brief discussion this week regarding potential NIL collaboration opportunities?

Best regards,

${athleteName}
${sport} | ${school}
NIL CARD Profile: https://www.nilcard.app`,

    followup: `Hi ${cleanBrand} team,

Following up on my note from a couple of days ago regarding a potential NIL partnership for ${deliverable} content! 

I know your team is busy, but I'd love to see if we can work together to promote ${cleanBrand} to my followers this season. 

Looking forward to hearing your thoughts!

Best,
${athleteName}`,
  };

  const handleCopy = () => {
    const textToCopy = templates[activeTab];
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#111113] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${themeAccent}18`, color: themeAccent }}
          >
            <MessageSquare className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Sponsor Pitch Proposal Generator</h3>
            <p className="text-[11px] text-white/50">
              Generate ready-to-send outreach messages to pitch local businesses and brands.
            </p>
          </div>
        </div>

        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
          Pro Tool
        </span>
      </div>

      {/* Form Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
            Target Brand / Business
          </label>
          <input
            type="text"
            placeholder="e.g. Apex Gym, Celsius"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-white/30 focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#16161A] px-3 py-2 text-xs text-white focus:border-accent focus:outline-none"
          >
            <option value="Local Business">Local Business / Gym</option>
            <option value="Apparel & Gear">Apparel & Gear</option>
            <option value="Supplements & Nutrition">Supplements & Nutrition</option>
            <option value="Restaurant & Food">Restaurant & Dining</option>
            <option value="Lifestyle Brand">Lifestyle Brand</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
            Deliverable Focus
          </label>
          <select
            value={deliverable}
            onChange={(e) => setDeliverable(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#16161A] px-3 py-2 text-xs text-white focus:border-accent focus:outline-none"
          >
            <option value="Social Media Post">Social Media Post</option>
            <option value="Short Video Reel">Short Video Reel</option>
            <option value="In-Person Appearance">In-Person Event Appearance</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
        <button
          onClick={() => setActiveTab("dm")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "dm"
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          <Send className="h-3 w-3" />
          Instagram / TikTok DM
        </button>

        <button
          onClick={() => setActiveTab("email")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "email"
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          <Mail className="h-3 w-3" />
          Formal Email
        </button>

        <button
          onClick={() => setActiveTab("followup")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "followup"
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          <Clock className="h-3 w-3" />
          48-Hour Follow-Up
        </button>
      </div>

      {/* Output Box */}
      <div className="relative rounded-xl border border-white/[0.06] bg-black/40 p-4">
        <pre className="whitespace-pre-wrap font-sans text-xs text-white/80 leading-relaxed">
          {templates[activeTab]}
        </pre>

        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-white/10 border border-white/10 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/20 transition-all"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-accent" />
              <span className="text-accent">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy Message</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
