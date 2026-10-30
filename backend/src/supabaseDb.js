import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../server/.env') });

const { Pool } = pg;

export function createSupabasePool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return null;
  }

  const isCloudPostgres = connectionString.includes('supabase.co') ||
                          connectionString.includes('supabase.com') ||
                          connectionString.includes('render.com') ||
                          connectionString.includes('neon.tech');

  const poolConfig = {
    connectionString,
    connectionTimeoutMillis: 5000,
    max: 20
  };

  if (isCloudPostgres) {
    // Supabase & Render require SSL
    poolConfig.ssl = {
      rejectUnauthorized: false
    };
  }

  return new Pool(poolConfig);
}

export default createSupabasePool;

