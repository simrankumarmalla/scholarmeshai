import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend/.env or server/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../server/.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    supabaseUrl !== 'https://your-project-ref.supabase.co' &&
    Boolean(supabaseAnonKey) &&
    supabaseAnonKey !== 'your_supabase_anon_public_key_here'
  );
};

export const hasAdminPrivileges = () => {
  return (
    isSupabaseConfigured() &&
    Boolean(supabaseServiceRoleKey) &&
    supabaseServiceRoleKey !== 'your_supabase_service_role_secret_key_here'
  );
};

// 1. Client-safe Public Supabase Client (uses ANON key)
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false
      }
    })
  : null;

// 2. Superuser Admin Supabase Client (uses SERVICE ROLE key)
// Bypasses Row Level Security (RLS) for backend indexing, schema verification, and admin operations
export const supabaseAdmin = hasAdminPrivileges()
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase; // Fallback to standard client if service role not set yet

if (!isSupabaseConfigured()) {
  console.log('[ScholarMesh Supabase] Notice: SUPABASE_URL / SUPABASE_ANON_KEY not set yet. Running in dual-mode with local database adapter.');
} else {
  console.log(`[ScholarMesh Supabase] Connected to Supabase Project: ${supabaseUrl}`);
  if (hasAdminPrivileges()) {
    console.log('[ScholarMesh Supabase] Service Role Admin Client initialized successfully.');
  }
}

export default {
  supabase,
  supabaseAdmin,
  isSupabaseConfigured,
  hasAdminPrivileges
};

