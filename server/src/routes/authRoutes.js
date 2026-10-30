import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { registerSchema, loginSchema, validateRequest } from '../validators/schemas.js';
import authenticateToken from '../middleware/authMiddleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'scholarmesh_ultra_secure_jwt_secret_key_2026_scholar_mesh';

// POST /api/auth/register
router.post('/register', validateRequest(registerSchema), async (req, res, next) => {
  try {
    const { full_name, email, password, institution, research_role } = req.validatedBody;

    // Check existing email
    const existing = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (full_name, email, password_hash, institution, research_role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email, institution, research_role, created_at`,
      [full_name, email.toLowerCase(), password_hash, institution, research_role]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Researcher registered successfully',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', validateRequest(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      institution: user.institution,
      research_role: user.research_role,
      created_at: user.created_at
    };

    return res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: safeUser
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const userRes = await db.query(
      'SELECT id, full_name, email, institution, research_role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userRes.rows[0];

    // Aggregate counts for researcher profile & dashboard
    const wsCountRes = await db.query('SELECT COUNT(*) FROM workspaces WHERE user_id = $1', [req.user.id]);
    const srcCountRes = await db.query('SELECT COUNT(*) FROM sources WHERE user_id = $1', [req.user.id]);
    const claimCountRes = await db.query('SELECT COUNT(*) FROM extracted_claims WHERE user_id = $1', [req.user.id]);
    const synthCountRes = await db.query('SELECT COUNT(*) FROM synthesis_reports WHERE user_id = $1', [req.user.id]);

    const stats = {
      totalWorkspaces: parseInt(wsCountRes.rows[0]?.count || 0, 10),
      totalSources: parseInt(srcCountRes.rows[0]?.count || 0, 10),
      totalClaims: parseInt(claimCountRes.rows[0]?.count || 0, 10),
      totalSyntheses: parseInt(synthCountRes.rows[0]?.count || 0, 10)
    };

    return res.json({
      success: true,
      user,
      stats
    });
  } catch (error) {
    next(error);
  }
});

export default router;

