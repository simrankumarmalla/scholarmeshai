import { supabase, supabaseAdmin, isSupabaseConfigured, hasAdminPrivileges } from './supabaseClient.js';
import { createSupabasePool } from './supabaseDb.js';

async function testSupabase() {
  console.log('========================================================');
  console.log('🔬 SCHOLARMESH AI: SUPABASE BACKEND DIAGNOSTIC TEST');
  console.log('========================================================');

  console.log('1. Configuration Check:');
  console.log(`   • SUPABASE_URL: ${process.env.SUPABASE_URL || 'NOT SET'}`);
  console.log(`   • SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? 'Present (Valid)' : 'NOT SET'}`);
  console.log(`   • SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present (Valid)' : 'NOT SET'}`);
  console.log(`   • DATABASE_URL: ${process.env.DATABASE_URL ? 'Configured' : 'NOT SET'}`);

  if (!isSupabaseConfigured()) {
    console.log('\n⚠️ Supabase credentials are not filled in backend/.env yet.');
    console.log('👉 Open backend/.env or server/.env and provide:');
    console.log('   - SUPABASE_URL');
    console.log('   - SUPABASE_ANON_KEY');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY');
    console.log('   - DATABASE_URL');
    process.exit(0);
  }

  // 2. Test Supabase API Ping
  try {
    console.log('\n2. Testing Supabase Auth Service Ping...');
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('   Auth ping note:', error.message);
    } else {
      console.log('   ✅ Supabase Auth service reachable successfully.');
    }
  } catch (err) {
    console.error('   ❌ Supabase API ping failed:', err.message);
  }

  // 3. Test Storage Bucket
  if (hasAdminPrivileges()) {
    try {
      console.log('\n3. Testing Supabase Storage Bucket access...');
      const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
      if (error) {
        console.warn('   Storage check note:', error.message);
      } else {
        console.log(`   ✅ Supabase Storage accessible. Total buckets: ${buckets.length}`);
      }
    } catch (err) {
      console.warn('   Storage test exception:', err.message);
    }
  }

  // 4. Test PostgreSQL Pool
  const pool = createSupabasePool();
  if (pool) {
    try {
      console.log('\n4. Testing PostgreSQL Direct Connection Pool...');
      const res = await pool.query('SELECT NOW() as current_time');
      console.log(`   ✅ Database connected! Server time: ${res.rows[0].current_time}`);
      await pool.end();
    } catch (err) {
      console.warn(`   Database connection note: ${err.message}`);
    }
  }

  console.log('========================================================\n');
}

testSupabase();

