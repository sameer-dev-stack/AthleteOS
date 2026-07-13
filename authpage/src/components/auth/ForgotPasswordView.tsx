import { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { ProcessingOverlay } from './ProcessingOverlay';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { AuthView } from '../../types';
import type { FormEvent } from 'react';

interface ForgotPasswordViewProps {
  onNavigate: (view: AuthView) => void;
}

export function ForgotPasswordView({ onNavigate }: ForgotPasswordViewProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSent(true);
    }, 1200);
  };

  return (
    <AuthLayout title="Reset password" subtitle="We'll send you secure recovery instructions">
      <ProcessingOverlay show={isLoading} message="Sending password reset email..." />

      {sent ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#C6FF3D]/10 text-[#C6FF3D] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-white font-semibold text-lg">Check your inbox</h3>
          <p className="text-xs text-white/60 max-w-xs mx-auto">
            We’ve sent a password reset link to <strong className="text-white">{email}</strong>. Follow the link to create your new password.
          </p>
          <div className="pt-4">
            <button
              onClick={() => onNavigate('sign-in')}
              className="inline-flex items-center gap-2 text-xs font-medium text-[#C6FF3D] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to sign in
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="reset-email" className="block text-xs font-medium text-white/80 tracking-wide uppercase">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                id="reset-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="maya.reyes@stanford.edu"
                className="w-full pl-10 pr-4 py-3 bg-[#111113] border border-white/[0.08] focus:border-[#C6FF3D] rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-1 focus:ring-[#C6FF3D]/50 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-4 bg-[#C6FF3D] hover:bg-[#D4FF66] text-[#0A0A0B] font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(198,255,61,0.2)] transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending Instructions...</span>
              </>
            ) : (
              <>
                <span>Send Reset Instructions</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => onNavigate('sign-in')}
              className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to sign in
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
