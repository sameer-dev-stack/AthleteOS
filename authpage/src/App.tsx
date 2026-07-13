import { useState, useEffect } from 'react';
import { AuthView, UserSession } from './types';
import { SignInView } from './components/auth/SignInView';
import { SignUpView } from './components/auth/SignUpView';
import { ForgotPasswordView } from './components/auth/ForgotPasswordView';
import { ResetPasswordView } from './components/auth/ResetPasswordView';
import { AccountCreatedView } from './components/auth/AccountCreatedView';
import { DashboardView } from './components/auth/DashboardView';
import { AuthDemoBar } from './components/auth/AuthDemoBar';
import { getSecureItem, setSecureItem, removeSecureItem } from './lib/secureStorage';

export default function App() {
  const [currentView, setCurrentView] = useState<AuthView>(() => {
    const savedView = localStorage.getItem('athleteos_current_view');
    if (savedView && ['sign-in', 'sign-up', 'forgot-password', 'reset-password', 'account-created', 'dashboard'].includes(savedView)) {
      return savedView as AuthView;
    }
    return 'sign-in';
  });

  const ENABLE_AUTH_DEMO_BAR = false;
  const [session, setSession] = useState<UserSession>(() => {
    const savedSession = getSecureItem<UserSession>('athleteos_session');
    if (savedSession) {
      return savedSession;
    }
    return {
      email: 'maya.reyes@stanford.edu',
      name: 'Maya Reyes',
      username: 'maya',
      sport: 'Basketball',
      school: 'Stanford University',
      plan: 'pro',
      isVerified: true,
    };
  });

  useEffect(() => {
    localStorage.setItem('athleteos_current_view', currentView);
  }, [currentView]);

  useEffect(() => {
    const INACTIVITY_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
    const savedTimestamp = getSecureItem<number>('athleteos_session_timestamp');
    const savedSession = getSecureItem<UserSession>('athleteos_session');

    if (savedSession && savedTimestamp) {
      const elapsed = Date.now() - savedTimestamp;
      if (elapsed > INACTIVITY_TIMEOUT_MS) {
        removeSecureItem('athleteos_session');
        removeSecureItem('athleteos_session_timestamp');
        setCurrentView('sign-in');
      }
    } else if (savedSession && !savedTimestamp) {
      setSecureItem('athleteos_session_timestamp', Date.now());
    }

    const handleUserActivity = () => {
      if (getSecureItem('athleteos_session')) {
        setSecureItem('athleteos_session_timestamp', Date.now());
      }
    };

    window.addEventListener('click', handleUserActivity);
    window.addEventListener('keypress', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    return () => {
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('keypress', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
    };
  }, []);

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    setSecureItem('athleteos_session', newSession);
    setSecureItem('athleteos_session_timestamp', Date.now());
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F5F5F7] selection:bg-[#C6FF3D] selection:text-[#0A0A0B] pb-0">
      {currentView === 'sign-in' && (
        <SignInView
          onNavigate={setCurrentView}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {currentView === 'sign-up' && (
        <SignUpView
          onNavigate={setCurrentView}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {currentView === 'forgot-password' && (
        <ForgotPasswordView
          onNavigate={setCurrentView}
        />
      )}

      {currentView === 'reset-password' && (
        <ResetPasswordView
          onNavigate={setCurrentView}
        />
      )}

      {currentView === 'account-created' && (
        <AccountCreatedView
          onNavigate={setCurrentView}
          email={session.email}
        />
      )}

      {currentView === 'dashboard' && (
        <DashboardView
          session={session}
          onNavigate={setCurrentView}
          onLogout={() => {}}
        />
      )}

      {/* Floating Demo Bar for easy reviewer testing of all auth screens */}
      {ENABLE_AUTH_DEMO_BAR && (
        <AuthDemoBar
          currentView={currentView}
          onSelectView={setCurrentView}
        />
      )}
    </div>
  );
}
