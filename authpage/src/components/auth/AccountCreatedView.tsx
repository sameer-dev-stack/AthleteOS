import { AuthLayout } from './AuthLayout';
import { Mail, RefreshCw, ArrowRight } from 'lucide-react';
import { AuthView } from '../../types';

interface AccountCreatedViewProps {
  onNavigate: (view: AuthView) => void;
  email?: string;
}

export function AccountCreatedView({ onNavigate, email = 'maya.reyes@stanford.edu' }: AccountCreatedViewProps) {
  return (
    <AuthLayout title="Your account has been created" subtitle="Verify your account to activate your AthleteOS card">
      <div className="py-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#C6FF3D]/10 text-[#C6FF3D] flex items-center justify-center mx-auto border border-[#C6FF3D]/20">
          <Mail className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <p className="text-xs text-white/70 leading-relaxed">
            Please verify your account. A verification email has been sent to <strong className="text-white font-medium">{email}</strong>.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/50 text-left space-y-2">
          <p className="font-medium text-white/80">Didn't receive the email?</p>
          <ul className="list-disc list-inside space-y-1 text-white/40">
            <li>Check your spam or junk folder</li>
            <li>Ensure your email address was typed correctly</li>
          </ul>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={() => alert('Verification email resent successfully!')}
            className="w-full py-3 px-4 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Resend confirmation email</span>
          </button>

          <button
            onClick={() => onNavigate('sign-in')}
            className="w-full py-3.5 px-4 bg-[#C6FF3D] hover:bg-[#D4FF66] text-[#0A0A0B] font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(198,255,61,0.2)] transition-all cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-white/40 pt-2">
          Already confirmed?{' '}
          <button onClick={() => onNavigate('sign-in')} className="text-[#C6FF3D] font-medium hover:underline">
            Sign in
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
