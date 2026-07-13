import { UserSession, AuthView } from '../../types';
import { User, LogOut, CheckCircle, ShieldCheck, Trophy, Activity, Zap, ArrowUpRight } from 'lucide-react';
import { removeSecureItem } from '../../lib/secureStorage';

interface DashboardViewProps {
  session: UserSession;
  onNavigate: (view: AuthView) => void;
  onLogout: () => void;
}

export function DashboardView({ session, onNavigate, onLogout }: DashboardViewProps) {
  const handleSignOut = () => {
    removeSecureItem('athleteos_session');
    removeSecureItem('athleteos_session_timestamp');
    localStorage.removeItem('athleteos_current_view');
    onLogout();
    onNavigate('sign-in');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F5F5F7] px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto ml-0 pl-0 pt-0 pb-0">
      {/* Top Navigation */}
      <header className="flex items-center justify-between pb-6 mb-8 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#C6FF3D]/20 to-[#C6FF3D]/5 border border-[#C6FF3D]/30 flex items-center justify-center text-[#C6FF3D]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
              AthleteOS <span className="text-xs uppercase bg-[#C6FF3D]/10 text-[#C6FF3D] px-2 py-0.5 rounded-full border border-[#C6FF3D]/20">Portal</span>
            </h1>
            <p className="text-xs text-white/50">{session.school} • {session.sport}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#C6FF3D] animate-pulse"></span>
            <span className="text-white/80 font-medium">Secure Session Active</span>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-red-500/10 hover:border-red-500/30 border border-white/10 text-xs font-semibold text-white/80 hover:text-red-400 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Welcome Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#16161a] to-[#111115] border border-white/10 p-6 sm:p-10 mb-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C6FF3D]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C6FF3D]/10 border border-[#C6FF3D]/20 text-[#C6FF3D] text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified NIL Pro Athlete</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Welcome back, {session.name}! 👋
            </h2>
            <p className="text-sm text-white/60 max-w-xl">
              Your athlete profile is fully secured and verified under <span className="text-white font-medium">@{session.username}</span>. Manage your contracts, track training telemetry, and explore brand deals.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="bg-white/[0.04] border border-white/10 px-5 py-4 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/20 flex items-center justify-center text-[#C6FF3D] font-bold text-lg">
                {session.plan.toUpperCase()}
              </div>
              <div>
                <div className="text-xs text-white/50 font-medium">Current Tier</div>
                <div className="text-sm font-bold text-white capitalize">{session.plan} Membership</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Stats & Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#121216] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Account Email</span>
            <CheckCircle className="w-4 h-4 text-[#C6FF3D]" />
          </div>
          <div className="text-lg font-bold text-white truncate">{session.email}</div>
          <div className="text-xs text-white/40 mt-1">Status: {session.isVerified ? 'Email Verified' : 'Pending Verification'}</div>
        </div>

        <div className="bg-[#121216] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Institution & Sport</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-lg font-bold text-white">{session.school}</div>
          <div className="text-xs text-white/40 mt-1">Sport: {session.sport}</div>
        </div>

        <div className="bg-[#121216] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Security Timeout</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-white">7 Days Active</div>
          <div className="text-xs text-white/40 mt-1">Secured via cryptographic checksum</div>
        </div>
      </div>

      {/* Quick Action Footer Card */}
      <div className="bg-[#16161a] border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Need to switch authentication views?</div>
            <div className="text-xs text-white/50">Use the demo bar below to test sign-in, sign-up, password reset, or email verification flows.</div>
          </div>
        </div>
        <button
          onClick={() => onNavigate('sign-in')}
          className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-semibold rounded-xl border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>Return to Sign In</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
