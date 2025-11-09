import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUsageAnalytics,
  getUsageSummary,
  getApiKeyUsage
} from '../controllers/analyticsController';

const router = express.Router();

// All analytics routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/analytics/usage
 * @desc    Get detailed API usage analytics
 * @access  Private
 * @query   startDate, endDate, apiKey (optional filters)
 */
router.get('/usage', getUsageAnalytics);

/**
 * @route   GET /api/analytics/summary
 * @desc    Get usage summary for current billing period
 * @access  Private
 */
router.get('/summary', getUsageSummary);

/**
 * @route   GET /api/analytics/api-keys/:apiKey
 * @desc    Get usage statistics for specific API key
 * @access  Private
 */
router.get('/api-keys/:apiKey', getApiKeyUsage);

export default router;
