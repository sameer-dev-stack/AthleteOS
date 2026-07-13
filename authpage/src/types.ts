export type AuthView = 
  | 'sign-in' 
  | 'sign-up' 
  | 'forgot-password' 
  | 'reset-password' 
  | 'account-created'
  | 'dashboard';

export interface UserSession {
  email: string;
  name: string;
  username: string;
  sport: string;
  school: string;
  plan: 'free' | 'pro' | 'elite';
  avatarUrl?: string;
  isVerified: boolean;
}

