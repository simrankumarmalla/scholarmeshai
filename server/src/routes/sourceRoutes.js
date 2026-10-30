import express from 'express';
import db from '../config/db.js';
import authenticateToken from '../middleware/authMiddleware.js';
import uploadSingle from '../middleware/uploadMiddleware.js';
import { extractTextFromUpload } from '../services/pdfParserService.js';
import { analyzeSourceDocument } from '../services/geminiService.js';
import { ingestSourceSchema } from '../validators/schemas.js';
import { uploadDocumentToSupabase } from '../../../backend/src/supabaseStorage.js';

const router = express.Router({ mergeParams: true });
router.use(authenticateToken);

// POST /api/workspaces/:workspaceId/sources
router.post('/', uploadSingle, async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    // 1. Verify workspace ownership
    const wsRes = await db.query(
      'SELECT * FROM workspaces WHERE id = $1 AND user_id = $2',
      [workspaceId, userId]
    );

    if (wsRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Workspace not found or unauthorized' });
    }
    const workspace = wsRes.rows[0];

    // 2. Extract content either from uploaded file or request body
    let rawContent = '';
    let originalFilename = null;
    let wordCount = 0;

    let storageInfo = null;
    if (req.file) {
      originalFilename = req.file.originalname;
      const parsed = await extractTextFromUpload(req.file.buffer, req.file.originalname, req.file.mimetype);
      rawContent = parsed.text;
      wordCount = parsed.wordCount;

      try {
        storageInfo = await uploadDocumentToSupabase({
          fileBuffer: req.file.buffer,
          originalFilename: req.file.originalname,
          mimeType: req.file.mimetype,
          workspaceId
        });
      } catch (err) {
        console.warn('[Supabase Storage] Notice: File upload to bucket skipped/optional:', err.message);
      }
    } else if (req.body.raw_content && req.body.raw_content.trim().length >= 40) {
      rawContent = req.body.raw_content.trim();
      wordCount = rawContent.split(/\s+/).filter(Boolean).length;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please upload a valid research paper (.pdf, .txt, .md) or paste at least 40 characters of source text/abstract.'
      });
    }

    // 3. Validate metadata
    const parsedMeta = ingestSourceSchema.safeParse({
      title: req.body.title || (originalFilename ? originalFilename.replace(/\.[^/.]+$/, '') : 'Untitled Research Study'),
      authors: req.body.authors || 'Unknown Authors',
      publication_year: req.body.publication_year || new Date().getFullYear(),
      source_type: req.body.source_type || (req.file && req.file.originalname.endsWith('.pdf') ? 'peer_reviewed_paper' : 'raw_field_notes'),
      raw_content: rawContent
    });

    if (!parsedMeta.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid source metadata',
        errors: parsedMeta.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
    }

    const { title, authors, publication_year, source_type } = parsedMeta.data;

    // 4. Call Gemini AI extraction
    const analysis = await analyzeSourceDocument({
      research_question: workspace.research_question,
      title,
      authors,
      source_type,
      raw_content: rawContent
    });

    const {
      ai_summary,
      methodology_notes,
      rigor_score,
      rigor_justification,
      key_topics,
      extracted_claims
    } = analysis;

    // 5. Store source in database
    const insertSourceRes = await db.query(
      `INSERT INTO sources (
        workspace_id, user_id, title, authors, publication_year, source_type,
        original_filename, raw_content, word_count, ai_summary, methodology_notes,
        rigor_score, rigor_justification, key_topics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        workspaceId,
        userId,
        title,
        authors,
        publication_year,
        source_type,
        originalFilename,
        rawContent,
        wordCount,
        ai_summary,
        methodology_notes,
        rigor_score,
        rigor_justification,
        JSON.stringify(key_topics || [])
      ]
    );

    const savedSource = insertSourceRes.rows[0];

    // 6. Bulk insert extracted atomic claims
    const savedClaims = [];
    if (Array.isArray(extracted_claims) && extracted_claims.length > 0) {
      for (const claim of extracted_claims) {
        const claimRes = await db.query(
          `INSERT INTO extracted_claims (
            source_id, workspace_id, user_id, claim_text, claim_category, supporting_quote, confidence_level
          ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            savedSource.id,
            workspaceId,
            userId,
            claim.claim_text,
            claim.claim_category,
            claim.supporting_quote || null,
            claim.confidence_level || 'high'
          ]
        );
        savedClaims.push(claimRes.rows[0]);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Source ingested and indexed successfully',
      source: savedSource,
      claims: savedClaims
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/workspaces/:workspaceId/sources
router.get('/', async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    // Verify workspace
    const wsRes = await db.query(
      'SELECT id FROM workspaces WHERE id = $1 AND user_id = $2',
      [workspaceId, userId]
    );
    if (wsRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Workspace not found or unauthorized' });
    }

    const sourcesRes = await db.query(
      'SELECT * FROM sources WHERE workspace_id = $1 AND user_id = $2 ORDER BY created_at DESC',
      [workspaceId, userId]
    );

    return res.json({
      success: true,
      sources: sourcesRes.rows
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/workspaces/:workspaceId/sources/:sourceId
router.delete('/:sourceId', async (req, res, next) => {
  try {
    const { workspaceId, sourceId } = req.params;
    const userId = req.user.id;

    const delRes = await db.query(
      'DELETE FROM sources WHERE id = $1 AND workspace_id = $2 AND user_id = $3 RETURNING id',
      [sourceId, workspaceId, userId]
    );

    if (delRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Source not found or unauthorized' });
    }

    return res.json({
      success: true,
      message: 'Source and its associated claims deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/workspaces/:workspaceId/claims (Matrix / Explorer view)
router.get('/claims/all', async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { category, confidence, search } = req.query;
    const userId = req.user.id;

    // Verify workspace
    const wsRes = await db.query(
      'SELECT id FROM workspaces WHERE id = $1 AND user_id = $2',
      [workspaceId, userId]
    );
    if (wsRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Workspace not found or unauthorized' });
    }

    let queryText = `
      SELECT c.*, s.title as source_title, s.authors as source_authors, s.rigor_score as source_rigor_score
      FROM extracted_claims c
      JOIN sources s ON c.source_id = s.id
      WHERE c.workspace_id = $1 AND c.user_id = $2
    `;
    const params = [workspaceId, userId];

    if (category && category !== 'all') {
      params.push(category);
      queryText += ` AND c.claim_category = $${params.length}`;
    }

    if (confidence && confidence !== 'all') {
      params.push(confidence);
      queryText += ` AND c.confidence_level = $${params.length}`;
    }

    if (search && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      queryText += ` AND (c.claim_text ILIKE $${params.length} OR c.supporting_quote ILIKE $${params.length} OR s.title ILIKE $${params.length})`;
    }

    queryText += ` ORDER BY c.created_at DESC`;

    const claimsRes = await db.query(queryText, params);

    return res.json({
      success: true,
      claims: claimsRes.rows
    });
  } catch (error) {
    next(error);
  }
});

export default router;

