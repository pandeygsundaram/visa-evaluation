import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Plan from '../models/Plan';
import Subscription from '../models/Subscription';
import ApiUsage from '../models/ApiUsage';

// Extend Express Request to include API key context
export interface ApiKeyRequest extends Request {
  apiKeyContext?: {
    userId: string;
    apiKey: string;
    subscription: any;
    plan: any;
    callsRemaining: number;
  };
}

/**
 * Middleware to validate API key and check rate limits
 * Expects API key in x-api-key header
 */
export const validateApiKey = async (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get API key from x-api-key header
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required',
        error: 'Missing x-api-key header'
      });
    }

    // Find user with this API key
    const user = await User.findOne({
      'apiKeys.key': apiKey,
      'apiKeys.isActive': true
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive API key'
      });
    }

    // Update last used timestamp for the API key
    const apiKeyObj = user.apiKeys.find(k => k.key === apiKey);
    if (apiKeyObj) {
      apiKeyObj.lastUsed = new Date();
      await user.save();
    }

    // Check if user has an active subscription
    let subscription = await Subscription.findOne({
      userId: user._id,
      status: 'active',
      currentPeriodEnd: { $gte: new Date() }
    }).populate('planId');

    let plan: any;
    let callsRemaining: number;

    if (!subscription) {
      // User doesn't have active subscription, use free plan
      plan = await Plan.findOne({ tier: 'free', billingPeriod: 'monthly' });

      if (!plan) {
        return res.status(500).json({
          success: false,
          message: 'Free plan not configured. Please contact support.'
        });
      }

      // Check API usage for free plan (count calls in current month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const freeUsageCount = await ApiUsage.countDocuments({
        userId: user._id,
        timestamp: { $gte: startOfMonth },
        success: true
      });

      callsRemaining = plan.callLimit - freeUsageCount;

      if (callsRemaining <= 0) {
        return res.status(429).json({
          success: false,
          message: 'API rate limit exceeded',
          error: 'You have reached your free plan limit. Please upgrade to continue.',
          quota: {
            limit: plan.callLimit,
            used: freeUsageCount,
            remaining: 0,
            plan: 'free'
          }
        });
      }
    } else {
      // User has active subscription
      plan = subscription.planId;
      callsRemaining = plan.callLimit - subscription.callsUsed;

      if (callsRemaining <= 0) {
        return res.status(429).json({
          success: false,
          message: 'API rate limit exceeded',
          error: `You have reached your ${plan.tier} plan limit for this billing period.`,
          quota: {
            limit: plan.callLimit,
            used: subscription.callsUsed,
            remaining: 0,
            plan: plan.tier,
            periodEnd: subscription.currentPeriodEnd
          }
        });
      }
    }

    // Attach API key context to request
    req.apiKeyContext = {
      userId: String(user._id),
      apiKey,
      subscription,
      plan,
      callsRemaining
    };

    // Continue to next middleware
    next();
  } catch (error: any) {
    console.error('Error validating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate API key',
      error: error.message
    });
  }
};

/**
 * Middleware to track API usage after successful request
 */
export const trackApiUsage = async (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
) => {
  // Store original send function
  const originalSend = res.json;

  // Track request start time
  const startTime = Date.now();

  // Override res.json to track response
  res.json = function (data: any) {
    const responseTime = Date.now() - startTime;

    // Track usage asynchronously (don't block response)
    setImmediate(async () => {
      try {
        if (!req.apiKeyContext) {
          return;
        }

        const { userId, apiKey, subscription } = req.apiKeyContext;
        const success = res.statusCode >= 200 && res.statusCode < 300;

        // Create usage record
        await ApiUsage.create({
          userId,
          apiKey,
          endpoint: req.path,
          method: req.method,
          statusCode: res.statusCode,
          success,
          responseTime,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: {
            country: req.body?.country,
            visaType: req.body?.visaType,
            documentCount: req.files?.length || 0
          }
        });

        // Increment subscription usage if applicable
        if (subscription && success) {
          await subscription.incrementUsage();
        }
      } catch (error: any) {
        console.error('Error tracking API usage:', error);
        // Don't throw error, just log it
      }
    });

    // Call original send function
    return originalSend.call(this, data);
  };

  next();
};

export default {
  validateApiKey,
  trackApiUsage
};
