import { Request, Response } from 'express';
import ApiUsage from '../models/ApiUsage';
import Subscription from '../models/Subscription';
import { AuthRequest } from '../middleware/auth';

/**
 * Get API usage analytics for authenticated user
 * GET /api/analytics/usage
 */
export const getUsageAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate, apiKey } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Build query
    const query: any = { userId };

    // Filter by date range if provided
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate as string);
      }
    }

    // Filter by specific API key if provided
    if (apiKey) {
      query.apiKey = apiKey;
    }

    // Get usage records
    const usageRecords = await ApiUsage.find(query)
      .sort({ timestamp: -1 })
      .limit(1000);

    // Calculate statistics
    const totalCalls = usageRecords.length;
    const successfulCalls = usageRecords.filter(r => r.success).length;
    const failedCalls = totalCalls - successfulCalls;
    const averageResponseTime = usageRecords.length > 0
      ? usageRecords.reduce((sum, r) => sum + (r.responseTime || 0), 0) / usageRecords.length
      : 0;

    // Group by date
    const callsByDate: { [key: string]: number } = {};
    usageRecords.forEach(record => {
      const date = record.timestamp.toISOString().split('T')[0];
      callsByDate[date] = (callsByDate[date] || 0) + 1;
    });

    // Group by endpoint
    const callsByEndpoint: { [key: string]: number } = {};
    usageRecords.forEach(record => {
      callsByEndpoint[record.endpoint] = (callsByEndpoint[record.endpoint] || 0) + 1;
    });

    // Group by status code
    const callsByStatus: { [key: number]: number } = {};
    usageRecords.forEach(record => {
      callsByStatus[record.statusCode] = (callsByStatus[record.statusCode] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalCalls,
          successfulCalls,
          failedCalls,
          successRate: totalCalls > 0 ? (successfulCalls / totalCalls * 100).toFixed(2) + '%' : '0%',
          averageResponseTime: Math.round(averageResponseTime) + 'ms'
        },
        charts: {
          callsByDate,
          callsByEndpoint,
          callsByStatus
        },
        recentCalls: usageRecords.slice(0, 50).map(r => ({
          timestamp: r.timestamp,
          endpoint: r.endpoint,
          method: r.method,
          statusCode: r.statusCode,
          success: r.success,
          responseTime: r.responseTime,
          ipAddress: r.ipAddress
        }))
      }
    });
  } catch (error: any) {
    console.error('Error fetching usage analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage analytics',
      error: error.message
    });
  }
};

/**
 * Get usage summary for current billing period
 * GET /api/analytics/summary
 */
export const getUsageSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get active subscription
    const subscription = await Subscription.findOne({
      userId,
      status: 'active',
      currentPeriodEnd: { $gte: new Date() }
    }).populate('planId');

    let usageSummary: any;

    if (subscription) {
      // User has active subscription
      const plan = subscription.planId as any;
      const callsUsed = subscription.callsUsed;
      const callsRemaining = plan.callLimit - callsUsed;
      const usagePercentage = (callsUsed / plan.callLimit * 100).toFixed(1);

      usageSummary = {
        plan: {
          name: plan.name,
          tier: plan.tier,
          billingPeriod: plan.billingPeriod
        },
        quota: {
          limit: plan.callLimit,
          used: callsUsed,
          remaining: callsRemaining,
          percentage: parseFloat(usagePercentage)
        },
        billingPeriod: {
          start: subscription.currentPeriodStart,
          end: subscription.currentPeriodEnd,
          daysRemaining: Math.ceil(
            (subscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        },
        status: subscription.status
      };
    } else {
      // Free plan
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);

      const freeUsageCount = await ApiUsage.countDocuments({
        userId,
        timestamp: { $gte: startOfMonth },
        success: true
      });

      const FREE_PLAN_LIMIT = 5;
      const callsRemaining = Math.max(0, FREE_PLAN_LIMIT - freeUsageCount);
      const usagePercentage = (freeUsageCount / FREE_PLAN_LIMIT * 100).toFixed(1);

      usageSummary = {
        plan: {
          name: 'Free',
          tier: 'free',
          billingPeriod: 'monthly'
        },
        quota: {
          limit: FREE_PLAN_LIMIT,
          used: freeUsageCount,
          remaining: callsRemaining,
          percentage: parseFloat(usagePercentage)
        },
        billingPeriod: {
          start: startOfMonth,
          end: endOfMonth,
          daysRemaining: Math.ceil(
            (endOfMonth.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        },
        status: 'free'
      };
    }

    res.json({
      success: true,
      data: usageSummary
    });
  } catch (error: any) {
    console.error('Error fetching usage summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage summary',
      error: error.message
    });
  }
};

/**
 * Get API key specific usage
 * GET /api/analytics/api-keys/:apiKey
 */
export const getApiKeyUsage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { apiKey } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify API key belongs to user
    const User = (await import('../models/User')).default;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const apiKeyObj = user.apiKeys.find(k => k.key === apiKey);
    if (!apiKeyObj) {
      return res.status(403).json({
        success: false,
        message: 'API key not found or does not belong to you'
      });
    }

    // Get usage for this specific API key
    const usageRecords = await ApiUsage.find({
      userId,
      apiKey
    }).sort({ timestamp: -1 }).limit(100);

    const totalCalls = usageRecords.length;
    const successfulCalls = usageRecords.filter(r => r.success).length;

    res.json({
      success: true,
      data: {
        apiKey: {
          key: apiKey,
          name: apiKeyObj.name,
          createdAt: apiKeyObj.createdAt,
          lastUsed: apiKeyObj.lastUsed
        },
        usage: {
          totalCalls,
          successfulCalls,
          failedCalls: totalCalls - successfulCalls
        },
        recentCalls: usageRecords.slice(0, 20).map(r => ({
          timestamp: r.timestamp,
          endpoint: r.endpoint,
          statusCode: r.statusCode,
          success: r.success,
          responseTime: r.responseTime
        }))
      }
    });
  } catch (error: any) {
    console.error('Error fetching API key usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API key usage',
      error: error.message
    });
  }
};

export default {
  getUsageAnalytics,
  getUsageSummary,
  getApiKeyUsage
};
