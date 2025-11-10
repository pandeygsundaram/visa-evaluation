import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPlans,
  createCheckoutSession,
  getSubscriptionStatus,
  cancelSubscription,
  getSubscriptionUsage,
  createBillingPortalSession
} from '../controllers/subscriptionController';

const router = express.Router();

/**
 * @route   GET /api/subscription/plans
 * @desc    Get all available plans
 * @access  Public
 */
router.get('/plans', getPlans);

/**
 * @route   POST /api/subscription/create-checkout
 * @desc    Create a Stripe checkout session for subscription
 * @access  Private
 */
router.post('/create-checkout', authenticate, createCheckoutSession);

/**
 * @route   GET /api/subscription/status
 * @desc    Get current subscription status
 * @access  Private
 */
router.get('/status', authenticate, getSubscriptionStatus);

/**
 * @route   GET /api/subscription/usage
 * @desc    Get subscription usage stats
 * @access  Private
 */
router.get('/usage', authenticate, getSubscriptionUsage);

/**
 * @route   POST /api/subscription/cancel
 * @desc    Cancel current subscription
 * @access  Private
 */
router.post('/cancel', authenticate, cancelSubscription);

/**
 * @route   POST /api/subscription/billing-portal
 * @desc    Create a Stripe billing portal session
 * @access  Private
 */
router.post('/billing-portal', authenticate, createBillingPortalSession);

export default router;
