import supabaseClient, { supabase, supabaseAdmin, isSupabaseConfigured, hasAdminPrivileges } from './supabaseClient.js';
import supabaseStorage from './supabaseStorage.js';
import { createSupabasePool } from './supabaseDb.js';

export {
  supabase,
  supabaseAdmin,
  isSupabaseConfigured,
  hasAdminPrivileges,
  supabaseStorage,
  createSupabasePool
};

export default {
  supabase,
  supabaseAdmin,
  isSupabaseConfigured,
  hasAdminPrivileges,
  supabaseStorage,
  createSupabasePool
};
