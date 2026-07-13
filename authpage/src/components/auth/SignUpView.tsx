import { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { PasswordField } from './PasswordField';
import { ReferralInviteBanner } from './ReferralInviteBanner';
import { ProcessingOverlay } from './ProcessingOverlay';
import { Mail, User, ArrowRight, AlertCircle, CheckCircle2, Database, Loader2 } from 'lucide-react';
import { AuthView, UserSession } from '../../types';
import { supabase, isSupabaseConfigured, upsertAthleteProfile } from '../../lib/supabaseClient';
import type { FormEvent } from 'react';

interface SignUpViewProps {
  onNavigate: (view: AuthView) => void;
  onLoginSuccess: (session: UserSession) => void;
}

export function SignUpView({ onNavigate, onLoginSuccess }: SignUpViewProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  const isNameValid = fullName.trim().length > 0;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 6;
  const isConfirmValid = confirmPassword === password && confirmPassword.length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmTouched(true);

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmValid) {
      setError('Please fix the validation errors below before submitting.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const generatedUsername = fullName ? fullName.toLowerCase().replace(/[^a-z0-9]/g, '') : 'athlete' + Math.floor(Math.random() * 1000);

      if (isSupabaseConfigured && supabase) {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              username: generatedUsername,
            },
          },
        });

        if (authError) {
          throw new Error(authError.message);
        }

        if (data.user) {
          // Upsert athlete profile in Supabase profiles table
          await upsertAthleteProfile({
            id: data.user.id,
            email,
            full_name: fullName,
            username: generatedUsername,
            sport: 'Basketball',
            school: 'University',
            plan: 'free',
          });

          onLoginSuccess({
            email,
            name: fullName || 'New Athlete',
            username: generatedUsername,
            sport: 'Basketball',
            school: 'University',
            plan: 'free',
            isVerified: false,
          });
          onNavigate('account-created');
          return;
        }
      }

      // Fallback demo signup
      await new Promise((r) => setTimeout(r, 1200));
      onLoginSuccess({
        email: email || 'athlete@athleteos.app',
        name: fullName || 'New Athlete',
        username: generatedUsername,
        sport: 'Basketball',
        school: 'University',
        plan: 'free',
        isVerified: false,
      });
      onNavigate('account-created');
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (oauthError) throw new Error(oauthError.message);
        return;
      }

      // Fallback demo Google signup
      await new Promise((r) => setTimeout(r, 1100));
      onLoginSuccess({
        email: 'maya.reyes@stanford.edu',
        name: 'Maya Reyes',
        username: 'maya',
        sport: 'Basketball',
        school: 'Stanford University',
        plan: 'pro',
        isVerified: true,
      });
      onNavigate('account-created');
    } catch (err: any) {
      setError(err.message || 'Google signup failed.');
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Claim your athlete card" subtitle="Join 1,200+ athletes building their NIL business">
      <ProcessingOverlay show={isLoading} message={isSupabaseConfigured ? 'Writing to Supabase database & sending confirmation...' : 'Creating your AthleteOS account...'} />

      <div className="mb-6">
        <ReferralInviteBanner referrerName="Maya Reyes" />
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          className="w-full py-3 px-4 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-white font-medium text-sm flex items-center justify-center gap-3 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.6 6.4C.6 8.4 0 10.6 0 13s.6 4.6 1.6 6.6l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"
            />
          </svg>
          Sign up with Google
        </button>

        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.06]" />
          </div>
          <span className="relative px-3 bg-[#111113] text-xs text-white/40 uppercase tracking-wider">
            Or with email
          </span>
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <label htmlFor="fullName" className="block text-xs font-medium text-white/80 tracking-wide uppercase">
            Full Athlete Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => setNameTouched(true)}
              required
              placeholder="Maya Reyes"
              className={`w-full pl-10 pr-4 py-3 bg-[#111113] border ${nameTouched && !isNameValid ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.08] focus:border-[#C6FF3D]'} rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-1 focus:ring-[#C6FF3D]/50 transition-all`}
            />
          </div>
          {nameTouched && !isNameValid && (
            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>Full name is required</span>
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="signup-email" className="block text-xs font-medium text-white/80 tracking-wide uppercase">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              id="signup-email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              required
              placeholder="maya.reyes@stanford.edu"
              className={`w-full pl-10 pr-4 py-3 bg-[#111113] border ${emailTouched && !isEmailValid ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.08] focus:border-[#C6FF3D]'} rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-1 focus:ring-[#C6FF3D]/50 transition-all`}
            />
          </div>
          {emailTouched && !isEmailValid && (
            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>Please enter a valid email address</span>
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <div onBlur={() => setPasswordTouched(true)}>
            <PasswordField
              id="signup-password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              label="Create Password"
            />
          </div>
          {passwordTouched && !isPasswordValid && (
            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>Password must be at least 6 characters long</span>
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <div onBlur={() => setConfirmTouched(true)}>
            <PasswordField
              id="confirm-password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              label="Confirm Password"
            />
          </div>
          {confirmTouched && !isConfirmValid && (
            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>Passwords must match</span>
            </p>
          )}
        </div>

        {/* Perks Checklist */}
        <div className="pt-2 pb-1 space-y-2 text-xs text-white/60">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#C6FF3D]" />
            <span>Instant public athlete profile & QR code</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#C6FF3D]" />
            <span>Stripe-powered tip jar & monetization</span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-3 py-3.5 px-4 bg-[#C6FF3D] hover:bg-[#D4FF66] text-[#0A0A0B] font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(198,255,61,0.2)] hover:shadow-[0_0_30px_rgba(198,255,61,0.35)] transition-all disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <span>Create Free Athlete Card</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Sign In */}
      <div className="mt-6 text-center text-xs text-white/50">
        Already have an account?{' '}
        <button
          onClick={() => onNavigate('sign-in')}
          className="text-[#C6FF3D] font-medium hover:underline ml-1 cursor-pointer"
        >
          Sign in
        </button>
      </div>
    </AuthLayout>
  );
}
