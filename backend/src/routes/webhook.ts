import express from 'express';
import { handleStripeWebhook } from '../controllers/webhookController';

const router = express.Router();

/**
 * @route   POST /api/webhook/stripe
 * @desc    Handle Stripe webhook events
 * @access  Public (Stripe)
 * @note    This route must use raw body parser for signature verification
 */
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

export default router;
