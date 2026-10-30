import { z } from 'zod';

export const DOMAINS = [
  'biomedical_clinical',
  'ai_computer_science',
  'climate_sustainability',
  'economics_market',
  'legal_regulatory',
  'social_behavioral'
];

export const SYNTHESIS_MODES = [
  'systematic_review',
  'contradiction_audit',
  'decision_brief',
  'gap_analysis'
];

export const SOURCE_TYPES = [
  'peer_reviewed_paper',
  'technical_report',
  'raw_field_notes',
  'web_article_abstract'
];

export const CLAIM_CATEGORIES = [
  'empirical_finding',
  'statistic',
  'methodology',
  'limitation',
  'hypothesis'
];

export const registerSchema = z.object({
  full_name: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  institution: z.string().trim().optional().default('Independent Research Institute'),
  research_role: z.string().trim().optional().default('Principal Investigator')
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const createWorkspaceSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(200, 'Title cannot exceed 200 characters'),
  domain: z.enum(DOMAINS, {
    errorMap: () => ({ message: `Domain must be one of: ${DOMAINS.join(', ')}` })
  }),
  research_question: z.string().trim().min(10, 'Research question must be at least 10 characters'),
  working_hypothesis: z.string().trim().optional().nullable(),
  default_synthesis_mode: z.enum(SYNTHESIS_MODES, {
    errorMap: () => ({ message: `Synthesis mode must be one of: ${SYNTHESIS_MODES.join(', ')}` })
  }).default('systematic_review')
});

export const ingestSourceSchema = z.object({
  title: z.string().trim().min(3, 'Source title must be at least 3 characters'),
  authors: z.string().trim().optional().default('Unknown Authors'),
  publication_year: z.coerce.number().int().min(1900).max(2030).optional().default(new Date().getFullYear()),
  source_type: z.enum(SOURCE_TYPES, {
    errorMap: () => ({ message: `Source type must be one of: ${SOURCE_TYPES.join(', ')}` })
  }).default('peer_reviewed_paper'),
  raw_content: z.string().trim().optional()
});

export const synthesizeRequestSchema = z.object({
  source_ids: z.array(z.string().uuid({ message: 'Each source_id must be a valid UUID' }))
    .min(2, 'Cross-source synthesis requires at least 2 sources'),
  synthesis_mode: z.enum(SYNTHESIS_MODES, {
    errorMap: () => ({ message: `Synthesis mode must be one of: ${SYNTHESIS_MODES.join(', ')}` })
  }),
  title: z.string().trim().optional()
});

export const copilotQuestionSchema = z.object({
  question: z.string().trim().min(5, 'Question must be at least 5 characters').max(2000, 'Question cannot exceed 2000 characters')
});

export const validateRequest = (schema) => (req, res, next) => {
  try {
    req.validatedBody = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
    }
    return res.status(400).json({ success: false, message: 'Invalid request payload' });
  }
};
