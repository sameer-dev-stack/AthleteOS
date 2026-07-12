"use client";
import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { nextPasswordInputType } from "@/lib/auth-copy";

interface PasswordFieldProps {
  id: string;
  name: string;
  autoComplete: string;
  placeholder?: string;
  label?: string;
}

export function PasswordField({
  id,
  name,
  autoComplete,
  placeholder = "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
  label = "Password",
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-medium text-ink-muted tracking-wide uppercase"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-dim">
          <Lock className="w-4 h-4" />
        </div>
        <input
          id={id}
          name={name}
          type={nextPasswordInputType(visible)}
          required
          autoComplete={autoComplete}
          className="w-full pl-10 pr-11 py-3 bg-elev border border-white/[0.08] rounded-xl text-white placeholder:text-ink-dim text-sm focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-dim transition-colors hover:text-ink-muted"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
