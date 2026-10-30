import express from 'express';
import db from '../config/db.js';
import authenticateToken from '../middleware/authMiddleware.js';
import { createWorkspaceSchema, validateRequest } from '../validators/schemas.js';

const router = express.Router();
router.use(authenticateToken);

// GET /api/workspaces
router.get('/', async (req, res, next) => {
  try {
    const { domain, search } = req.query;
    const userId = req.user.id;

    let queryText = `
      SELECT w.*,
        (SELECT COUNT(*) FROM sources s WHERE s.workspace_id = w.id)::int as source_count,
        (SELECT COUNT(*) FROM extracted_claims c WHERE c.workspace_id = w.id)::int as claim_count,
        (SELECT COUNT(*) FROM synthesis_reports sr WHERE sr.workspace_id = w.id)::int as synthesis_count
      FROM workspaces w
      WHERE w.user_id = $1
    `;
    const params = [userId];

    if (domain && domain !== 'all') {
      params.push(domain);
      queryText += ` AND w.domain = $${params.length}`;
    }

    if (search && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      queryText += ` AND (w.title ILIKE $${params.length} OR w.research_question ILIKE $${params.length})`;
    }

    queryText += ` ORDER BY w.updated_at DESC`;

    const result = await db.query(queryText, params);
    return res.json({
      success: true,
      workspaces: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/workspaces
router.post('/', validateRequest(createWorkspaceSchema), async (req, res, next) => {
  try {
    const { title, domain, research_question, working_hypothesis, default_synthesis_mode } = req.validatedBody;
    const userId = req.user.id;

    const result = await db.query(
      `INSERT INTO workspaces (user_id, title, domain, research_question, working_hypothesis, default_synthesis_mode)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, title, domain, research_question, working_hypothesis || null, default_synthesis_mode || 'systematic_review']
    );

    const workspace = result.rows[0];
    return res.status(201).json({
      success: true,
      message: 'Research workspace created',
      workspace: {
        ...workspace,
        source_count: 0,
        claim_count: 0,
        synthesis_count: 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/workspaces/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const wsRes = await db.query(
      'SELECT * FROM workspaces WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (wsRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Workspace not found or unauthorized' });
    }

    const workspace = wsRes.rows[0];

    // Fetch workspace sources
    const sourcesRes = await db.query(
      'SELECT * FROM sources WHERE workspace_id = $1 AND user_id = $2 ORDER BY created_at DESC',
      [id, userId]
    );

    // Fetch claims count
    const claimsRes = await db.query(
      'SELECT COUNT(*) FROM extracted_claims WHERE workspace_id = $1 AND user_id = $2',
      [id, userId]
    );

    // Fetch syntheses
    const synthesesRes = await db.query(
      'SELECT * FROM synthesis_reports WHERE workspace_id = $1 AND user_id = $2 ORDER BY created_at DESC',
      [id, userId]
    );

    return res.json({
      success: true,
      workspace: {
        ...workspace,
        sources: sourcesRes.rows,
        claim_count: parseInt(claimsRes.rows[0]?.count || 0, 10),
        syntheses: synthesesRes.rows
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/workspaces/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const delRes = await db.query(
      'DELETE FROM workspaces WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (delRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Workspace not found or unauthorized' });
    }

    return res.json({
      success: true,
      message: 'Workspace and all associated sources and synthesis reports deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
