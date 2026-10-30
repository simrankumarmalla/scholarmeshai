import express from 'express';
import db from '../config/db.js';
import authenticateToken from '../middleware/authMiddleware.js';
import { copilotQuestionSchema, validateRequest } from '../validators/schemas.js';
import { askResearchCopilot } from '../services/geminiService.js';

const router = express.Router({ mergeParams: true });
router.use(authenticateToken);

// GET /api/workspaces/:workspaceId/copilot
router.get('/', async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    // Verify workspace
    const wsRes = await db.query('SELECT id FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
    if (wsRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Workspace not found or unauthorized' });
    }

    const messagesRes = await db.query(
      'SELECT * FROM copilot_messages WHERE workspace_id = $1 AND user_id = $2 ORDER BY created_at ASC',
      [workspaceId, userId]
    );

    return res.json({
      success: true,
      messages: messagesRes.rows
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/workspaces/:workspaceId/copilot
router.post('/', validateRequest(copilotQuestionSchema), async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { question } = req.validatedBody;
    const userId = req.user.id;

    // 1. Verify workspace
    const wsRes = await db.query('SELECT * FROM workspaces WHERE id = $1 AND user_id = $2', [workspaceId, userId]);
    if (wsRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Workspace not found or unauthorized' });
    }
    const workspace = wsRes.rows[0];

    // 2. Fetch workspace sources & claims for context
    const sourcesRes = await db.query(
      'SELECT * FROM sources WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, userId]
    );

    if (sourcesRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No sources found in this workspace. Ingest at least 1 document or study to ground the Copilot.'
      });
    }

    const claimsRes = await db.query(
      'SELECT * FROM extracted_claims WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, userId]
    );

    const enrichedSources = sourcesRes.rows.map(s => ({
      ...s,
      claims: claimsRes.rows.filter(c => c.source_id === s.id)
    }));

    // 3. Fetch recent conversation history
    const historyRes = await db.query(
      'SELECT role, message_text FROM copilot_messages WHERE workspace_id = $1 AND user_id = $2 ORDER BY created_at ASC LIMIT 10',
      [workspaceId, userId]
    );

    // 4. Save user message to database
    await db.query(
      `INSERT INTO copilot_messages (workspace_id, user_id, role, message_text, citations, follow_up_questions)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [workspaceId, userId, 'user', question, JSON.stringify([]), JSON.stringify([])]
    );

    // 5. Invoke Gemini Grounded Research Copilot
    const copilotAnswer = await askResearchCopilot({
      research_question: workspace.research_question,
      sources: enrichedSources,
      history: historyRes.rows,
      question
    });

    // 6. Save assistant message to database
    const assistantRes = await db.query(
      `INSERT INTO copilot_messages (workspace_id, user_id, role, message_text, citations, follow_up_questions)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        workspaceId,
        userId,
        'assistant',
        copilotAnswer.answer_markdown,
        JSON.stringify(copilotAnswer.citations || []),
        JSON.stringify(copilotAnswer.follow_up_questions || [])
      ]
    );

    return res.status(201).json({
      success: true,
      message: assistantRes.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

export default router;

