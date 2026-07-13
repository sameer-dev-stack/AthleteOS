import { Logo } from './Logo';
import { ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-[#0A0A0B] text-[#F5F5F7] flex flex-col justify-between relative overflow-x-hidden box-border ml-0 pl-0 pt-0 pb-0">
      {/* Background ambient gradient glow blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#C6FF3D]/[0.03] blur-[120px] rounded-full pointer-events-none" />
      
      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between z-10 box-border">
        <a href="#home" onClick={(e) => e.preventDefault()} className="flex items-center gap-2">
          <Logo size="sm" />
        </a>
        <div className="text-xs text-white/50">
          Need help? <a href="#support" onClick={(e) => e.preventDefault()} className="text-[#C6FF3D] hover:underline font-medium">Contact support</a>
        </div>
      </header>

      {/* Main Content Card Container */}
      <main className="w-full max-w-[420px] mx-auto px-3 sm:px-6 py-2 z-10 flex flex-col justify-center box-border my-auto">
        <div className="mb-4 text-center">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">{title}</h1>
          <p className="text-xs sm:text-sm text-white/60">{subtitle}</p>
        </div>

        <div className="bg-[#111113] border border-white/[0.08] rounded-2xl p-4 sm:p-6 shadow-2xl relative box-border w-full">
          {children}
        </div>

        {/* Security Trust Note */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/40 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C6FF3D]/70 shrink-0" />
          <span>Secured by 256-bit encryption · No card required</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-2.5 text-center text-[11px] text-white/40 z-10 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-white/[0.04] box-border shrink-0">
        <div>
          © {new Date().getFullYear()} AthleteOS, Inc. All rights reserved.
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#ncaarules" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">NCAA Compliance</a>
        </div>
      </footer>
    </div>
  );
}
