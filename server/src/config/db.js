import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

let pool = null;
let useFallback = false;
const fallbackDataPath = path.resolve(__dirname, '../../data/scholarmesh_db.json');

// Ensure data folder exists
const dataDir = path.dirname(fallbackDataPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-Memory / File-based Fallback Store
const fallbackStore = {
  users: [],
  workspaces: [],
  sources: [],
  extracted_claims: [],
  synthesis_reports: [],
  copilot_messages: []
};

function loadFallbackData() {
  try {
    if (fs.existsSync(fallbackDataPath)) {
      const content = fs.readFileSync(fallbackDataPath, 'utf-8');
      const parsed = JSON.parse(content);
      Object.assign(fallbackStore, parsed);
    }
  } catch (err) {
    console.error('[ScholarMesh DB] Error reading fallback data file:', err.message);
  }
}

function saveFallbackData() {
  try {
    fs.writeFileSync(fallbackDataPath, JSON.stringify(fallbackStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('[ScholarMesh DB] Error saving fallback data file:', err.message);
  }
}

// Initialize Fallback Query Router
async function executeFallbackQuery(sql, params = []) {
  loadFallbackData();
  const trimmed = sql.trim().replace(/\s+/g, ' ');
  const upper = trimmed.toUpperCase();

  // 1. users
  if (upper.startsWith('SELECT * FROM USERS WHERE EMAIL = $1')) {
    const email = params[0]?.toLowerCase();
    const rows = fallbackStore.users.filter(u => u.email.toLowerCase() === email);
    return { rows, rowCount: rows.length };
  }

  if (upper.startsWith('SELECT ID, FULL_NAME, EMAIL, INSTITUTION, RESEARCH_ROLE, CREATED_AT FROM USERS WHERE ID = $1')) {
    const id = params[0];
    const user = fallbackStore.users.find(u => u.id === id);
    const rows = user ? [{
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      institution: user.institution,
      research_role: user.research_role,
      created_at: user.created_at
    }] : [];
    return { rows, rowCount: rows.length };
  }

  if (upper.startsWith('INSERT INTO USERS')) {
    const newUser = {
      id: uuidv4(),
      full_name: params[0],
      email: params[1],
      password_hash: params[2],
      institution: params[3] || 'Independent Research Institute',
      research_role: params[4] || 'Principal Investigator',
      created_at: new Date().toISOString()
    };
    fallbackStore.users.push(newUser);
    saveFallbackData();
    return { rows: [newUser], rowCount: 1 };
  }

  // 2. Dashboard Metrics
  if (upper.includes('COUNT(*)') && upper.includes('FROM WORKSPACES WHERE USER_ID = $1')) {
    const count = fallbackStore.workspaces.filter(w => w.user_id === params[0]).length;
    return { rows: [{ count: count.toString() }], rowCount: 1 };
  }
  if (upper.includes('COUNT(*)') && upper.includes('FROM SOURCES WHERE USER_ID = $1')) {
    const count = fallbackStore.sources.filter(s => s.user_id === params[0]).length;
    return { rows: [{ count: count.toString() }], rowCount: 1 };
  }
  if (upper.includes('COUNT(*)') && upper.includes('FROM EXTRACTED_CLAIMS WHERE USER_ID = $1')) {
    const count = fallbackStore.extracted_claims.filter(c => c.user_id === params[0]).length;
    return { rows: [{ count: count.toString() }], rowCount: 1 };
  }
  if (upper.includes('COUNT(*)') && upper.includes('FROM SYNTHESIS_REPORTS WHERE USER_ID = $1')) {
    const count = fallbackStore.synthesis_reports.filter(r => r.user_id === params[0]).length;
    return { rows: [{ count: count.toString() }], rowCount: 1 };
  }

  // 3. Workspaces
  if (upper.startsWith('SELECT W.*') && upper.includes('FROM WORKSPACES W WHERE W.USER_ID = $1')) {
    const userId = params[0];
    let list = fallbackStore.workspaces.filter(w => w.user_id === userId);

    if (params.length >= 2 && params[1]) {
      const filter = params[1];
      if (filter.startsWith('%') && filter.endsWith('%')) {
        const term = filter.slice(1, -1).toLowerCase();
        list = list.filter(w => w.title.toLowerCase().includes(term) || w.research_question.toLowerCase().includes(term));
      } else {
        list = list.filter(w => w.domain === filter);
      }
    }

    if (params.length >= 3 && params[2]) {
      const term = params[2].slice(1, -1).toLowerCase();
      list = list.filter(w => w.title.toLowerCase().includes(term) || w.research_question.toLowerCase().includes(term));
    }

    const rows = list.map(w => ({
      ...w,
      source_count: fallbackStore.sources.filter(s => s.workspace_id === w.id).length,
      claim_count: fallbackStore.extracted_claims.filter(c => c.workspace_id === w.id).length,
      synthesis_count: fallbackStore.synthesis_reports.filter(sr => sr.workspace_id === w.id).length
    })).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    return { rows, rowCount: rows.length };
  }

  if (upper.includes('FROM WORKSPACES WHERE ID = $1 AND USER_ID = $2')) {
    const [id, userId] = params;
    const row = fallbackStore.workspaces.find(w => w.id === id && w.user_id === userId);
    return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
  }

  if (upper.startsWith('INSERT INTO WORKSPACES')) {
    const newWs = {
      id: uuidv4(),
      user_id: params[0],
      title: params[1],
      domain: params[2],
      research_question: params[3],
      working_hypothesis: params[4] || null,
      default_synthesis_mode: params[5] || 'systematic_review',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    fallbackStore.workspaces.unshift(newWs);
    saveFallbackData();
    return { rows: [newWs], rowCount: 1 };
  }

  if (upper.startsWith('DELETE FROM WORKSPACES WHERE ID = $1 AND USER_ID = $2')) {
    const [id, userId] = params;
    const initialLen = fallbackStore.workspaces.length;
    fallbackStore.workspaces = fallbackStore.workspaces.filter(w => !(w.id === id && w.user_id === userId));
    // Cascade delete
    fallbackStore.sources = fallbackStore.sources.filter(s => s.workspace_id !== id);
    fallbackStore.extracted_claims = fallbackStore.extracted_claims.filter(c => c.workspace_id !== id);
    fallbackStore.synthesis_reports = fallbackStore.synthesis_reports.filter(r => r.workspace_id !== id);
    fallbackStore.copilot_messages = fallbackStore.copilot_messages.filter(m => m.workspace_id !== id);
    saveFallbackData();
    return { rows: [{ id }], rowCount: initialLen - fallbackStore.workspaces.length };
  }

  // 4. Sources
  if (upper.includes('FROM SOURCES WHERE WORKSPACE_ID = $1 AND USER_ID = $2')) {
    const [workspaceId, userId] = params;
    const rows = fallbackStore.sources
      .filter(s => s.workspace_id === workspaceId && s.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows, rowCount: rows.length };
  }

  if (upper.includes('FROM SOURCES WHERE ID = $1 AND WORKSPACE_ID = $2 AND USER_ID = $3')) {
    const [id, workspaceId, userId] = params;
    const row = fallbackStore.sources.find(s => s.id === id && s.workspace_id === workspaceId && s.user_id === userId);
    return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
  }

  if (upper.startsWith('INSERT INTO SOURCES')) {
    const newSrc = {
      id: uuidv4(),
      workspace_id: params[0],
      user_id: params[1],
      title: params[2],
      authors: params[3] || 'Unknown Authors',
      publication_year: params[4] || new Date().getFullYear(),
      source_type: params[5] || 'peer_reviewed_paper',
      original_filename: params[6] || null,
      raw_content: params[7],
      word_count: params[8] || 0,
      ai_summary: params[9] || '',
      methodology_notes: params[10] || '',
      rigor_score: typeof params[11] === 'number' ? params[11] : 75,
      rigor_justification: params[12] || '',
      key_topics: typeof params[13] === 'string' ? JSON.parse(params[13]) : (params[13] || []),
      created_at: new Date().toISOString()
    };
    fallbackStore.sources.unshift(newSrc);
    // update workspace updated_at
    const ws = fallbackStore.workspaces.find(w => w.id === params[0]);
    if (ws) ws.updated_at = new Date().toISOString();
    saveFallbackData();
    return { rows: [newSrc], rowCount: 1 };
  }

  if (upper.startsWith('DELETE FROM SOURCES WHERE ID = $1 AND WORKSPACE_ID = $2 AND USER_ID = $3')) {
    const [id, workspaceId, userId] = params;
    const initialLen = fallbackStore.sources.length;
    fallbackStore.sources = fallbackStore.sources.filter(s => !(s.id === id && s.workspace_id === workspaceId && s.user_id === userId));
    fallbackStore.extracted_claims = fallbackStore.extracted_claims.filter(c => c.source_id !== id);
    saveFallbackData();
    return { rows: [{ id }], rowCount: initialLen - fallbackStore.sources.length };
  }

  // 5. Extracted Claims
  if (upper.startsWith('INSERT INTO EXTRACTED_CLAIMS')) {
    const newClaim = {
      id: uuidv4(),
      source_id: params[0],
      workspace_id: params[1],
      user_id: params[2],
      claim_text: params[3],
      claim_category: params[4],
      supporting_quote: params[5],
      confidence_level: params[6] || 'high',
      created_at: new Date().toISOString()
    };
    fallbackStore.extracted_claims.push(newClaim);
    saveFallbackData();
    return { rows: [newClaim], rowCount: 1 };
  }

  if (upper.includes('FROM EXTRACTED_CLAIMS WHERE WORKSPACE_ID = $1 AND USER_ID = $2')) {
    const [workspaceId, userId] = params;
    const count = fallbackStore.extracted_claims.filter(c => c.workspace_id === workspaceId && c.user_id === userId).length;
    return { rows: [{ count: count.toString() }], rowCount: 1 };
  }

  if (upper.includes('FROM EXTRACTED_CLAIMS C') && upper.includes('JOIN SOURCES S ON C.SOURCE_ID = S.ID')) {
    const [workspaceId, userId] = params;
    let claims = fallbackStore.extracted_claims.filter(c => c.workspace_id === workspaceId && c.user_id === userId);

    const rows = claims.map(c => {
      const src = fallbackStore.sources.find(s => s.id === c.source_id);
      return {
        ...c,
        source_title: src ? src.title : 'Unknown Source',
        source_authors: src ? src.authors : 'Unknown Authors',
        source_rigor_score: src ? src.rigor_score : 0
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return { rows, rowCount: rows.length };
  }

  // 6. Synthesis Reports
  if (upper.startsWith('INSERT INTO SYNTHESIS_REPORTS')) {
    const newReport = {
      id: uuidv4(),
      workspace_id: params[0],
      user_id: params[1],
      title: params[2],
      synthesis_mode: params[3],
      source_ids: typeof params[4] === 'string' ? JSON.parse(params[4]) : params[4],
      executive_summary: params[5],
      consensus_themes: typeof params[6] === 'string' ? JSON.parse(params[6]) : params[6],
      contradictions: typeof params[7] === 'string' ? JSON.parse(params[7]) : params[7],
      research_gaps: typeof params[8] === 'string' ? JSON.parse(params[8]) : params[8],
      decision_recommendations: typeof params[9] === 'string' ? JSON.parse(params[9]) : params[9],
      overall_evidence_strength: params[10],
      created_at: new Date().toISOString()
    };
    fallbackStore.synthesis_reports.unshift(newReport);
    saveFallbackData();
    return { rows: [newReport], rowCount: 1 };
  }

  if (upper.includes('UPDATE WORKSPACES SET UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = $1')) {
    const ws = fallbackStore.workspaces.find(w => w.id === params[0]);
    if (ws) ws.updated_at = new Date().toISOString();
    saveFallbackData();
    return { rows: [], rowCount: 1 };
  }

  if (upper.includes('FROM SYNTHESIS_REPORTS WHERE WORKSPACE_ID = $1 AND USER_ID = $2')) {
    const [workspaceId, userId] = params;
    const rows = fallbackStore.synthesis_reports
      .filter(r => r.workspace_id === workspaceId && r.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows, rowCount: rows.length };
  }

  if (upper.startsWith('SELECT SR.*, W.TITLE AS WORKSPACE_TITLE')) {
    const [userId] = params;
    const rows = fallbackStore.synthesis_reports
      .filter(r => r.user_id === userId)
      .map(r => {
        const ws = fallbackStore.workspaces.find(w => w.id === r.workspace_id);
        return {
          ...r,
          workspace_title: ws ? ws.title : 'Workspace',
          workspace_domain: ws ? ws.domain : 'General'
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows, rowCount: rows.length };
  }

  // 7. Copilot Messages
  if (upper.startsWith('SELECT * FROM COPILOT_MESSAGES WHERE WORKSPACE_ID = $1 AND USER_ID = $2')) {
    const [workspaceId, userId] = params;
    const rows = fallbackStore.copilot_messages
      .filter(m => m.workspace_id === workspaceId && m.user_id === userId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return { rows, rowCount: rows.length };
  }

  if (upper.startsWith('INSERT INTO COPILOT_MESSAGES')) {
    const newMsg = {
      id: uuidv4(),
      workspace_id: params[0],
      user_id: params[1],
      role: params[2],
      message_text: params[3],
      citations: typeof params[4] === 'string' ? JSON.parse(params[4]) : (params[4] || []),
      follow_up_questions: typeof params[5] === 'string' ? JSON.parse(params[5]) : (params[5] || []),
      created_at: new Date().toISOString()
    };
    fallbackStore.copilot_messages.push(newMsg);
    saveFallbackData();
    return { rows: [newMsg], rowCount: 1 };
  }

  return { rows: [], rowCount: 0 };
}

export const query = async (text, params = []) => {
  if (useFallback) {
    return executeFallbackQuery(text, params);
  }
  try {
    return await pool.query(text, params);
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('connect')) {
      console.warn('[ScholarMesh DB] PostgreSQL connection error, switching to persistent fallback adapter.');
      useFallback = true;
      return executeFallbackQuery(text, params);
    }
    throw error;
  }
};

export const getClient = async () => {
  if (useFallback) {
    return {
      query: (text, params) => executeFallbackQuery(text, params),
      release: () => {}
    };
  }
  try {
    const client = await pool.connect();
    return client;
  } catch (err) {
    console.warn('[ScholarMesh DB] getClient failed, falling back.');
    useFallback = true;
    return {
      query: (text, params) => executeFallbackQuery(text, params),
      release: () => {}
    };
  }
};

export function sanitizeDatabaseUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  const match = rawUrl.match(/^(postgres(?:ql)?:\/\/)([^:]+):(.+)@([^@]+)$/);
  if (match) {
    const [, protocol, user, pass, hostAndDb] = match;
    try {
      const decoded = decodeURIComponent(pass);
      const encodedPass = encodeURIComponent(decoded);
      return `${protocol}${user}:${encodedPass}@${hostAndDb}`;
    } catch {
      return rawUrl;
    }
  }
  return rawUrl;
}

export const initDb = async () => {
  loadFallbackData();
  const rawDbUrl = process.env.DATABASE_URL;
  const dbUrl = sanitizeDatabaseUrl(rawDbUrl);

  const isCloudPostgres = Boolean(dbUrl) && (
    dbUrl.includes('supabase.co') ||
    dbUrl.includes('supabase.com') ||
    dbUrl.includes('render.com') ||
    dbUrl.includes('neon.tech') ||
    dbUrl.includes('pooler.supabase')
  );

  try {
    pool = new Pool({
      connectionString: dbUrl,
      connectionTimeoutMillis: isCloudPostgres ? 4000 : 2500,
      ssl: isCloudPostgres ? { rejectUnauthorized: false } : undefined
    });

    // Test connection
    await pool.query('SELECT 1');
    console.log('[ScholarMesh DB] Connected successfully to PostgreSQL.');

    const sqlPath = path.resolve(__dirname, '../db/init.sql');
    if (fs.existsSync(sqlPath)) {
      const initSql = fs.readFileSync(sqlPath, 'utf-8');
      await pool.query(initSql);
      console.log('[ScholarMesh DB] PostgreSQL schema verified and applied.');
    }
  } catch (err) {
    console.warn(`[ScholarMesh DB] PostgreSQL not reachable at ${dbUrl ? dbUrl.split('@')[1] || dbUrl : 'undefined'} (${err.message}). Activating built-in resilient persistent storage engine.`);
    useFallback = true;
  }
};

export default {
  query,
  getClient,
  initDb
};
