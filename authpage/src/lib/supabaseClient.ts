import { createClient, SupabaseClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as { env?: Record<string, string> }).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  !supabaseUrl.includes('placeholder')
);

// Create client if configured, otherwise null
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Database helper functions for profiles and auth
export async function fetchAthleteProfile(userId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching athlete profile:', error);
    return null;
  }
  return data;
}

export async function upsertAthleteProfile(profileData: {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
  sport?: string;
  school?: string;
  plan?: string;
}) {
  if (!supabase) return { error: null };
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' });
  
  return { data, error };
}
