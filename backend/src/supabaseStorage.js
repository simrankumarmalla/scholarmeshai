import { supabaseAdmin, isSupabaseConfigured } from './supabaseClient.js';
import path from 'path';

const BUCKET_NAME = 'research-documents';

/**
 * Ensure storage bucket exists in Supabase
 */
export async function ensureStorageBucket() {
  if (!isSupabaseConfigured() || !supabaseAdmin) return false;

  try {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    if (error) {
      console.warn('[ScholarMesh Storage] List buckets warning:', error.message);
      return false;
    }

    const exists = buckets.some(b => b.name === BUCKET_NAME);
    if (!exists) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10485760 // 10MB
      });
      if (createError) {
        console.warn('[ScholarMesh Storage] Bucket creation note:', createError.message);
        return false;
      }
      console.log(`[ScholarMesh Storage] Bucket "${BUCKET_NAME}" created successfully.`);
    }
    return true;
  } catch (err) {
    console.warn('[ScholarMesh Storage] Storage check error:', err.message);
    return false;
  }
}

/**
 * Upload a research document buffer to Supabase Storage
 */
export async function uploadDocumentToSupabase({ fileBuffer, originalFilename, mimeType, workspaceId }) {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    return null;
  }

  try {
    await ensureStorageBucket();

    const timestamp = Date.now();
    const cleanName = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${workspaceId}/${timestamp}-${cleanName}`;

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType || 'application/octet-stream',
        upsert: true
      });

    if (error) {
      console.warn('[ScholarMesh Storage] Upload error:', error.message);
      return null;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    return {
      storagePath,
      publicUrl: urlData?.publicUrl || null
    };
  } catch (err) {
    console.warn('[ScholarMesh Storage] Upload exception:', err.message);
    return null;
  }
}

export default {
  ensureStorageBucket,
  uploadDocumentToSupabase
};

