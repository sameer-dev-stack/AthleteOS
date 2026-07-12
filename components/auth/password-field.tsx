"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { nextPasswordInputType } from "@/lib/auth-copy";

// Password input with a show/hide toggle. `autoComplete` differs by context
// (new-password on signup, current-password on signin) so it's a prop.
export function PasswordField({
  id, name, autoComplete, placeholder,
}: {
  id: string; name: string; autoComplete: string; placeholder: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id} name={name} type={nextPasswordInputType(visible)}
        required autoComplete={autoComplete}
        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 pr-11 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim transition-colors hover:text-ink-muted"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
