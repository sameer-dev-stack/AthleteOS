import { AuthView } from '../../types';
import { Shield, Sparkles, KeyRound, MailCheck, LayoutDashboard } from 'lucide-react';
import type { ReactNode } from 'react';

interface AuthDemoBarProps {
  currentView: AuthView;
  onSelectView: (view: AuthView) => void;
}

export function AuthDemoBar({ currentView, onSelectView }: AuthDemoBarProps) {
  const views: { id: AuthView; label: string; icon: ReactNode }[] = [
    { id: 'sign-in', label: 'Sign In', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'sign-up', label: 'Sign Up', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'forgot-password', label: 'Forgot PW', icon: <KeyRound className="w-3.5 h-3.5" /> },
    { id: 'reset-password', label: 'Reset PW', icon: <KeyRound className="w-3.5 h-3.5" /> },
    { id: 'account-created', label: 'Verify Email', icon: <MailCheck className="w-3.5 h-3.5" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#16161a]/90 backdrop-blur-xl border border-white/[0.12] px-3 py-2 rounded-2xl shadow-2xl flex items-center gap-1.5 overflow-x-auto max-w-[95vw]">
      <div className="hidden sm:flex items-center gap-1.5 px-2 text-[11px] font-semibold text-white/50 border-r border-white/10 mr-1">
        <span>Auth Suite Preview:</span>
      </div>
      {views.map((v) => {
        const isActive = currentView === v.id;
        return (
          <button
            key={v.id}
            onClick={() => onSelectView(v.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
              isActive
                ? 'bg-[#C6FF3D] text-[#0A0A0B] font-bold shadow-[0_0_15px_rgba(198,255,61,0.3)]'
                : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            {v.icon}
            <span>{v.label}</span>
          </button>
        );
      })}
    </div>
  );
}
