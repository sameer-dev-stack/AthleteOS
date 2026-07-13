import { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { PasswordField } from './PasswordField';
import { ProcessingOverlay } from './ProcessingOverlay';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { AuthView } from '../../types';
import type { FormEvent } from 'react';

interface ResetPasswordViewProps {
  onNavigate: (view: AuthView) => void;
}

export function ResetPasswordView({ onNavigate }: ResetPasswordViewProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
    }, 1200);
  };

  return (
    <AuthLayout title="Create new password" subtitle="Choose a strong password to secure your AthleteOS account">
      <ProcessingOverlay show={isLoading} message="Updating password..." />

      {success ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#C6FF3D]/10 text-[#C6FF3D] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-white font-semibold text-lg">Password updated</h3>
          <p className="text-xs text-white/60 max-w-xs mx-auto">
            Your password has been successfully reset. You can now sign in with your new credentials.
          </p>
          <div className="pt-4">
            <button
              onClick={() => onNavigate('sign-in')}
              className="w-full py-3.5 px-4 bg-[#C6FF3D] hover:bg-[#D4FF66] text-[#0A0A0B] font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Sign In Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-xs text-red-400">{error}</p>}

          <PasswordField
            id="new-password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            label="New Password"
          />

          <PasswordField
            id="confirm-new-password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            label="Confirm New Password"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3.5 px-4 bg-[#C6FF3D] hover:bg-[#D4FF66] text-[#0A0A0B] font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(198,255,61,0.2)] transition-all cursor-pointer"
          >
            <span>Update Password</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
