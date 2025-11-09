import express from 'express';
import multer from 'multer';
import {
  createEvaluation,
  getUserEvaluations,
  getEvaluationById,
  deleteEvaluation
} from '../controllers/evaluationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDF, DOC, DOCX files
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  }
});

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/evaluations
 * Create new evaluation with document upload
 *
 * Body (multipart/form-data):
 * - country: string (required)
 * - visaType: string (required)
 * - documents: File[] (required, at least 1)
 */
router.post('/', upload.array('documents', 10), createEvaluation);

/**
 * GET /api/evaluations
 * Get all evaluations for the authenticated user
 *
 * Query params:
 * - status: string (optional) - Filter by status
 * - country: string (optional) - Filter by country
 * - visaType: string (optional) - Filter by visa type
 * - limit: number (optional, default: 20) - Number of results
 * - skip: number (optional, default: 0) - Offset for pagination
 */
router.get('/', getUserEvaluations);

/**
 * GET /api/evaluations/:id
 * Get evaluation by ID
 */
router.get('/:id', getEvaluationById);

/**
 * DELETE /api/evaluations/:id
 * Delete evaluation by ID
 */
router.delete('/:id', deleteEvaluation);

export default router;
