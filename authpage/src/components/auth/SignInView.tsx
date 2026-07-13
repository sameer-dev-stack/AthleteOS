import { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { PasswordField } from './PasswordField';
import { ProcessingOverlay } from './ProcessingOverlay';
import { Mail, ArrowRight, AlertCircle, Database, Loader2 } from 'lucide-react';
import { AuthView, UserSession } from '../../types';
import { supabase, isSupabaseConfigured, fetchAthleteProfile } from '../../lib/supabaseClient';
import type { FormEvent } from 'react';

interface SignInViewProps {
  onNavigate: (view: AuthView) => void;
  onLoginSuccess: (session: UserSession, rememberMe?: boolean) => void;
}

export function SignInView({ onNavigate, onLoginSuccess }: SignInViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 6;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);

    if (!isEmailValid || !isPasswordValid) {
      setError('Please fix the errors below before submitting.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          throw new Error(authError.message);
        }

        if (data.user) {
          const profile = await fetchAthleteProfile(data.user.id);
          onLoginSuccess({
            email: data.user.email || email,
            name: profile?.full_name || data.user.user_metadata?.full_name || 'Athlete',
            username: profile?.username || 'athlete',
            sport: profile?.sport || 'Basketball',
            school: profile?.school || 'University',
            plan: profile?.plan || 'pro',
            isVerified: profile?.is_verified ?? true,
          }, rememberMe);
          onNavigate('dashboard');
          return;
        }
      }

      // Fallback demo login if Supabase is not configured or in preview mode
      await new Promise((r) => setTimeout(r, 1000));
      if (email.toLowerCase() === 'error@athleteos.app') {
        throw new Error('Invalid login credentials. Please check your email and password.');
      }
      onLoginSuccess({
        email: email || 'maya.reyes@stanford.edu',
        name: 'Maya Reyes',
        username: 'maya',
        sport: 'Basketball',
        school: 'Stanford University',
        plan: 'pro',
        isVerified: true,
      }, rememberMe);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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

      // Fallback demo Google login
      await new Promise((r) => setTimeout(r, 900));
      onLoginSuccess({
        email: 'maya.reyes@stanford.edu',
        name: 'Maya Reyes',
        username: 'maya',
        sport: 'Basketball',
        school: 'Stanford University',
        plan: 'pro',
        isVerified: true,
      });
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your AthleteOS business suite">
      <ProcessingOverlay show={isLoading} message={isSupabaseConfigured ? 'Connecting to Supabase Database...' : 'Authenticating session...'} />

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
          onClick={handleGoogleLogin}
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
          Continue with Google
        </button>

        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.06]" />
          </div>
          <span className="relative px-3 bg-[#111113] text-xs text-white/40 uppercase tracking-wider">
            Or with email
          </span>
        </div>

        {/* Email Field */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-medium text-white/80 tracking-wide uppercase">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              required
              autoComplete="email"
              placeholder="maya.reyes@stanford.edu"
              className={`w-full pl-10 pr-4 py-3 bg-[#111113] border ${emailTouched && !isEmailValid ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.08] focus:border-[#C6FF3D]'} rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-1 focus:ring-[#C6FF3D]/50 transition-all`}
            />
          </div>
          {emailTouched && !isEmailValid && (
            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>Please enter a valid email address (e.g. name@domain.com)</span>
            </p>
          )}
        </div>

        {/* Password Field with Forgot Link & Remember Me */}
        <div className="space-y-1">
          <div onBlur={() => setPasswordTouched(true)}>
            <PasswordField
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {passwordTouched && !isPasswordValid && (
            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>Password must be at least 6 characters long</span>
            </p>
          )}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-white/70 hover:text-white select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-[#111113] border-white/[0.15] text-[#C6FF3D] focus:ring-[#C6FF3D]/50 focus:ring-1 accent-[#C6FF3D] cursor-pointer"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => onNavigate('forgot-password')}
              className="text-xs text-[#C6FF3D]/80 hover:text-[#C6FF3D] hover:underline transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3.5 px-4 bg-[#C6FF3D] hover:bg-[#D4FF66] text-[#0A0A0B] font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(198,255,61,0.2)] hover:shadow-[0_0_30px_rgba(198,255,61,0.35)] transition-all disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Sign Up */}
      <div className="mt-6 text-center text-xs text-white/50">
        Don't have an athlete account?{' '}
        <button
          onClick={() => onNavigate('sign-up')}
          className="text-[#C6FF3D] font-medium hover:underline ml-1 cursor-pointer"
        >
          Create free card
        </button>
      </div>
    </AuthLayout>
  );
}
