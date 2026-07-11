"use client";

import { motion } from "framer-motion";

const ATHLETES = [
  { initials: "MR", color: "from-accent/60 to-accent/20", name: "Maya R." },
  { initials: "JT", color: "from-pink-500/60 to-pink-500/20", name: "Jordan T." },
  { initials: "KW", color: "from-blue-500/60 to-blue-500/20", name: "Kai W." },
  { initials: "DM", color: "from-orange-500/60 to-orange-500/20", name: "Davi M." },
  { initials: "AS", color: "from-purple-500/60 to-purple-500/20", name: "Aisha S." },
];

export function SocialProofAvatars() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {ATHLETES.map((athlete, i) => (
          <motion.div
            key={i}
            className="group relative"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.08, duration: 0.4 }}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${athlete.color} ring-2 ring-bg text-[10px] font-bold text-bg transition-transform duration-200 group-hover:scale-110 group-hover:ring-accent/40 group-hover:z-10`}
            >
              {athlete.initials}
            </div>
            {/* Hover tooltip */}
            <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-bg-card px-2 py-1 text-[10px] font-medium text-ink opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity duration-200 group-hover:opacity-100">
              {athlete.name}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
