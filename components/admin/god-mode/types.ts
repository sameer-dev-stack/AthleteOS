export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  sport: string | null;
  school: string | null;
  class_year: string | null;
  bio: string | null;
  stats: Record<string, any> | null;
  links: Record<string, any> | null;
  social: Record<string, any> | null;
  is_verified: boolean;
  profile_published: boolean;
  plan: 'free' | 'pro';
  stripe_subscription_id: string | null;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  role: 'user' | 'admin';
  suspended: boolean;
  waitlist_position: number | null;
  pro_expires_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface AiUsage {
  user_id: string;
  tool: string;
  used_count: number;
  period_start: string;
}

export interface PageView {
  id: string;
  athlete_id: string;
  viewer_ip_hash: string;
  referrer: string | null;
  user_agent: string | null;
  country: string | null;
  city: string | null;
  created_at: string;
}

export interface LinkClick {
  id: string;
  athlete_id: string;
  link_label: string;
  link_url: string;
  viewer_ip_hash: string;
  created_at: string;
}

export interface NilDeal {
  id: string;
  athlete_id: string;
  company_name: string;
  deal_value: number;
  compensation_type: string;
  status: 'pending' | 'cleared' | 'rejected';
  description: string | null;
  document_url: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface NilValueMetric {
  profile_id: string;
  period_start: string;
  period_end: string;
  card_views: number;
  link_clicks: number;
  tips_amount: number;
  tips_count: number;
  followers_total: number;
  nil_score: number;
}

export interface SocialAccount {
  profile_id: string;
  platform: string;
  handle: string;
  followers: number;
}

export interface Waitlist {
  id: string;
  email: string;
  source: string | null;
  confirmed: boolean;
  joined_at: string;
}

export interface RateLimit {
  id: string;
  key: string;
  count: number;
  window_start: string;
}
