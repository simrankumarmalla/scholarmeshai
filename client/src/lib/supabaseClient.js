import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseClientConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    supabaseUrl !== 'https://your-project-ref.supabase.co' &&
    Boolean(supabaseAnonKey) &&
    supabaseAnonKey !== 'your_supabase_anon_public_key_here'
  );
};

export const supabase = isSupabaseClientConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default supabase;
