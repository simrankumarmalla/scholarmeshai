import express from 'express';
import db from '../config/db.js';
import authenticateToken from '../middleware/authMiddleware.js';
import { synthesizeRequestSchema, validateRequest } from '../validators/schemas.js';
import { generateCrossSourceSynthesis } from '../services/geminiService.js';

const router = express.Router({ mergeParams: true });
router.use(authenticateToken);

// POST /api/workspaces/:workspaceId/synthesize
router.post('/workspaces/:workspaceId/synthesize', validateRequest(synthesizeRequestSchema), async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { source_ids, synthesis_mode, title } = req.validatedBody;
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

    // 2. Fetch selected sources & verify they belong to this workspace and user
    const sourcesRes = await db.query(
      'SELECT * FROM sources WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, userId]
    );

    const availableSources = sourcesRes.rows.filter(s => source_ids.includes(s.id));
    if (availableSources.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 valid sources belonging to this workspace must be selected for cross-source synthesis.'
      });
    }

    // 3. Attach claims to each source
    const claimsRes = await db.query(
      'SELECT * FROM extracted_claims WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, userId]
    );

    const enrichedSources = availableSources.map(s => ({
      ...s,
      claims: claimsRes.rows.filter(c => c.source_id === s.id)
    }));

    // 4. Generate AI cross-source synthesis
    const synthesisResult = await generateCrossSourceSynthesis({
      research_question: workspace.research_question,
      working_hypothesis: workspace.working_hypothesis,
      synthesis_mode,
      sources: enrichedSources
    });

    const reportTitle = title && title.trim() !== ''
      ? title.trim()
      : `Cross-Source ${synthesis_mode.replace('_', ' ').toUpperCase()} Synthesis (${enrichedSources.length} Studies)`;

    // 5. Save report to PostgreSQL synthesis_reports table
    const saveRes = await db.query(
      `INSERT INTO synthesis_reports (
        workspace_id, user_id, title, synthesis_mode, source_ids,
        executive_summary, consensus_themes, contradictions,
        research_gaps, decision_recommendations, overall_evidence_strength
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        workspaceId,
        userId,
        reportTitle,
        synthesis_mode,
        JSON.stringify(source_ids),
        synthesisResult.executive_summary,
        JSON.stringify(synthesisResult.consensus_themes || []),
        JSON.stringify(synthesisResult.contradictions || []),
        JSON.stringify(synthesisResult.research_gaps || []),
        JSON.stringify(synthesisResult.decision_recommendations || []),
        synthesisResult.overall_evidence_strength || 'Moderate Evidence'
      ]
    );

    const savedReport = saveRes.rows[0];

    // Update workspace updated_at
    await db.query('UPDATE workspaces SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [workspaceId]);

    return res.status(201).json({
      success: true,
      message: 'Cross-source synthesis generated successfully',
      report: savedReport
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/workspaces/:workspaceId/syntheses
router.get('/workspaces/:workspaceId/syntheses', async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    const wsRes = await db.query('SELECT id FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
    if (wsRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Workspace not found or unauthorized' });
    }

    const reportsRes = await db.query(
      'SELECT * FROM synthesis_reports WHERE workspace_id = $1 AND user_id = $2 ORDER BY created_at DESC',
      [workspaceId, userId]
    );

    return res.json({
      success: true,
      reports: reportsRes.rows
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/syntheses (Cross-workspace synthesis archive)
router.get('/syntheses', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const reportsRes = await db.query(
      `SELECT sr.*, w.title as workspace_title, w.domain as workspace_domain
       FROM synthesis_reports sr
       JOIN workspaces w ON sr.workspace_id = w.id
       WHERE sr.user_id = $1
       ORDER BY sr.created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      reports: reportsRes.rows
    });
  } catch (error) {
    next(error);
  }
});

export default router;
