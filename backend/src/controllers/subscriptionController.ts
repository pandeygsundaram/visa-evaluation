import { Request, Response } from 'express';
import Plan from '../models/Plan';
import Subscription from '../models/Subscription';
import stripeService from '../services/stripeService';
import { AuthRequest } from '../middleware/auth';

/**
 * Get all available plans
 */
export const getPlans = async (req: Request, res: Response) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ price: 1 });

    res.json({
      success: true,
      data: plans
    });
  } catch (error: any) {
    console.error('Error getting plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get plans',
      error: error.message
    });
  }
};

/**
 * Create a checkout session for subscription
 */
export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { planId, successUrl, cancelUrl } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }

    // Check if plan exists and is not free
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    if (plan.tier === 'free') {
      return res.status(400).json({
        success: false,
        message: 'Cannot create checkout session for free plan'
      });
    }

    // Create checkout session
    const session = await stripeService.createCheckoutSession(
      userId,
      planId,
      successUrl,
      cancelUrl
    );

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: error.message
    });
  }
};

/**
 * Get current subscription status
 */
export const getSubscriptionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const subscription = await stripeService.getSubscriptionDetails(userId);

    if (!subscription) {
      // Check if user should be on free plan
      const freePlan = await Plan.findOne({ tier: 'free', billingPeriod: 'monthly' });

      return res.json({
        success: true,
        data: {
          subscription: null,
          plan: freePlan,
          isActive: false,
          onFreePlan: true
        }
      });
    }

    const plan = subscription.planId;
    const callsRemaining = (plan as any).callLimit - subscription.callsUsed;

    res.json({
      success: true,
      data: {
        subscription: {
          id: subscription._id,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          callsUsed: subscription.callsUsed,
          callsRemaining
        },
        plan,
        isActive: subscription.status === 'active',
        onFreePlan: false
      }
    });
  } catch (error: any) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription status',
      error: error.message
    });
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    await stripeService.cancelSubscription(userId);

    res.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period'
    });
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message
    });
  }
};

/**
 * Get subscription usage stats
 */
export const getSubscriptionUsage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const quotaCheck = await stripeService.checkSubscriptionQuota(userId);

    if (!quotaCheck.subscription) {
      // User is on free plan or has no subscription
      const freePlan = await Plan.findOne({ tier: 'free', billingPeriod: 'monthly' });

      // Count evaluations for this month
      const Evaluation = require('../models/Evaluation').default;
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const evaluationCount = await Evaluation.countDocuments({
        userId,
        createdAt: { $gte: startOfMonth }
      });

      const callsLimit = freePlan?.callLimit || 2;
      const callsRemaining = Math.max(0, callsLimit - evaluationCount);
      const usagePercentage = callsLimit > 0 ? (evaluationCount / callsLimit) * 100 : 0;

      return res.json({
        success: true,
        data: {
          callsUsed: evaluationCount,
          callsLimit,
          callsRemaining,
          usagePercentage: Math.round(usagePercentage * 100) / 100,
          plan: freePlan
        }
      });
    }

    const callsLimit = quotaCheck.plan.callLimit;
    const callsUsed = quotaCheck.subscription.callsUsed;
    const usagePercentage = (callsUsed / callsLimit) * 100;

    res.json({
      success: true,
      data: {
        callsUsed,
        callsLimit,
        callsRemaining: quotaCheck.callsRemaining,
        usagePercentage: Math.round(usagePercentage * 100) / 100,
        plan: quotaCheck.plan,
        currentPeriodEnd: quotaCheck.subscription.currentPeriodEnd
      }
    });
  } catch (error: any) {
    console.error('Error getting subscription usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription usage',
      error: error.message
    });
  }
};

/**
 * Create a Stripe billing portal session
 * Allows users to manage subscription, payment methods, and invoices
 */
export const createBillingPortalSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { returnUrl } = req.body;

    // Create billing portal session
    const session = await stripeService.createBillingPortalSession(
      userId,
      returnUrl
    );

    res.json({
      success: true,
      data: {
        url: session.url
      }
    });
  } catch (error: any) {
    console.error('Error creating billing portal session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create billing portal session',
      error: error.message
    });
  }
};

export default {
  getPlans,
  createCheckoutSession,
  getSubscriptionStatus,
  cancelSubscription,
  getSubscriptionUsage,
  createBillingPortalSession
};
