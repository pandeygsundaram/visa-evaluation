import Stripe from 'stripe';
import { stripe, STRIPE_CONFIG } from '../config/stripe';
import User from '../models/User';
import Plan from '../models/Plan';
import Subscription from '../models/Subscription';

/**
 * Create or retrieve a Stripe customer for a user
 */
export const getOrCreateStripeCustomer = async (userId: string, email: string, name: string): Promise<string> => {
  try {
    // Check if user already has a Stripe customer ID
    const user = await User.findById(userId);
    if (user?.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId
      }
    });

    // Save customer ID to user
    await User.findByIdAndUpdate(userId, {
      stripeCustomerId: customer.id
    });

    return customer.id;
  } catch (error: any) {
    console.error('Error creating Stripe customer:', error);
    throw new Error(`Failed to create Stripe customer: ${error.message}`);
  }
};

/**
 * Create a Stripe checkout session for subscription
 */
export const createCheckoutSession = async (
  userId: string,
  planId: string,
  successUrl?: string,
  cancelUrl?: string
): Promise<Stripe.Checkout.Session> => {
  try {
    // Get user and plan
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      throw new Error('Invalid or inactive plan');
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(userId, user.email, user.name);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1
        }
      ],
      success_url: successUrl || STRIPE_CONFIG.successUrl,
      cancel_url: cancelUrl || STRIPE_CONFIG.cancelUrl,
      metadata: {
        userId,
        planId
      },
      subscription_data: {
        metadata: {
          userId,
          planId
        }
      }
    });

    return session;
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
};

/**
 * Handle successful subscription creation from webhook
 */
export const handleSubscriptionCreated = async (subscription: Stripe.Subscription): Promise<void> => {
  try {
    const userId = subscription.metadata.userId;
    const planId = subscription.metadata.planId;

    if (!userId || !planId) {
      console.error('Missing userId or planId in subscription metadata');
      console.error('Subscription metadata:', subscription.metadata);
      return;
    }

    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id
    });

    if (existingSubscription) {
      console.log(`Subscription ${subscription.id} already exists, skipping creation`);
      return;
    }

    // Get period start and end from subscription
    const stripeSubscription = subscription as any;
    const periodStart = typeof stripeSubscription.current_period_start === 'number'
      ? stripeSubscription.current_period_start
      : Math.floor(Date.now() / 1000);
    const periodEnd = typeof stripeSubscription.current_period_end === 'number'
      ? stripeSubscription.current_period_end
      : Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // Default 30 days

    // Create subscription in database
    const newSubscription = await Subscription.create({
      userId,
      planId,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      status: subscription.status as any,
      currentPeriodStart: new Date(periodStart * 1000),
      currentPeriodEnd: new Date(periodEnd * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      callsUsed: 0
    });

    // Update user's current subscription
    await User.findByIdAndUpdate(userId, {
      currentSubscription: newSubscription._id
    });

    console.log(`Subscription created for user ${userId}:`, newSubscription._id);
  } catch (error: any) {
    console.error('Error handling subscription created:', error);
    throw error;
  }
};

/**
 * Handle subscription updates from webhook
 */
export const handleSubscriptionUpdated = async (subscription: Stripe.Subscription): Promise<void> => {
  try {
    const dbSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id
    });

    if (!dbSubscription) {
      console.error('Subscription not found:', subscription.id);
      return;
    }

    // Get period start and end
    const stripeSubscription = subscription as any;
    const periodStart = typeof stripeSubscription.current_period_start === 'number'
      ? stripeSubscription.current_period_start
      : Math.floor(Date.now() / 1000);
    const periodEnd = typeof stripeSubscription.current_period_end === 'number'
      ? stripeSubscription.current_period_end
      : Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

    const newPeriodStart = new Date(periodStart * 1000);

    // Check if period has renewed (period start changed)
    const periodRenewed = newPeriodStart.getTime() !== dbSubscription.currentPeriodStart.getTime();

    // Update subscription
    await Subscription.findByIdAndUpdate(dbSubscription._id, {
      status: subscription.status as any,
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: new Date(periodEnd * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined
    });

    // Reset usage ONLY if period has renewed
    if (periodRenewed && subscription.status === 'active') {
      const updatedSubscription = await Subscription.findById(dbSubscription._id);
      if (updatedSubscription && typeof (updatedSubscription as any).resetUsage === 'function') {
        await (updatedSubscription as any).resetUsage();
        console.log(`Usage reset for subscription ${subscription.id} due to period renewal`);
      }
    }

    console.log(`Subscription updated:`, subscription.id);
  } catch (error: any) {
    console.error('Error handling subscription updated:', error);
    throw error;
  }
};

/**
 * Handle subscription deletion from webhook
 */
export const handleSubscriptionDeleted = async (subscription: Stripe.Subscription): Promise<void> => {
  try {
    const dbSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id
    });

    if (!dbSubscription) {
      console.error('Subscription not found:', subscription.id);
      return;
    }

    // Update subscription status
    await Subscription.findByIdAndUpdate(dbSubscription._id, {
      status: 'canceled',
      canceledAt: new Date()
    });

    // Remove from user's current subscription
    await User.findByIdAndUpdate(dbSubscription.userId, {
      currentSubscription: null
    });

    console.log(`Subscription deleted:`, subscription.id);
  } catch (error: any) {
    console.error('Error handling subscription deleted:', error);
    throw error;
  }
};

/**
 * Get subscription details
 */
export const getSubscriptionDetails = async (userId: string) => {
  try {
    const user = await User.findById(userId).populate('currentSubscription');

    if (!user || !user.currentSubscription) {
      return null;
    }

    const subscription = await Subscription.findById(user.currentSubscription).populate('planId');

    return subscription;
  } catch (error: any) {
    console.error('Error getting subscription details:', error);
    throw new Error(`Failed to get subscription details: ${error.message}`);
  }
};

/**
 * Cancel subscription at period end
 */
export const cancelSubscription = async (userId: string): Promise<void> => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.currentSubscription) {
      throw new Error('No active subscription found');
    }

    const subscription = await Subscription.findById(user.currentSubscription);
    if (!subscription || !subscription.stripeSubscriptionId) {
      throw new Error('Invalid subscription');
    }

    // Cancel subscription at period end in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    // Update local subscription
    await Subscription.findByIdAndUpdate(subscription._id, {
      cancelAtPeriodEnd: true
    });

    console.log(`Subscription cancelled for user ${userId}`);
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }
};

/**
 * Handle successful invoice payment
 */
export const handleInvoicePaymentSucceeded = async (invoice: Stripe.Invoice): Promise<void> => {
  try {
    // Cast invoice to access subscription property
    const invoiceData = invoice as any;

    // Only process subscription invoices
    if (!invoiceData.subscription) {
      console.log('Invoice payment succeeded for non-subscription invoice:', invoice.id);
      return;
    }

    const subscriptionId = typeof invoiceData.subscription === 'string'
      ? invoiceData.subscription
      : invoiceData.subscription.id;

    const dbSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscriptionId
    });

    if (!dbSubscription) {
      console.error('Subscription not found for invoice:', invoice.id);
      return;
    }

    // If this is a renewal payment (not the first invoice), reset usage
    if (invoiceData.billing_reason === 'subscription_cycle') {
      await dbSubscription.resetUsage();
      console.log(`Usage reset for subscription ${subscriptionId} due to successful renewal payment`);
    }

    console.log(`Invoice payment succeeded:`, invoice.id);
  } catch (error: any) {
    console.error('Error handling invoice payment succeeded:', error);
    throw error;
  }
};

/**
 * Handle failed invoice payment
 */
export const handleInvoicePaymentFailed = async (invoice: Stripe.Invoice): Promise<void> => {
  try {
    // Cast invoice to access subscription property
    const invoiceData = invoice as any;

    // Only process subscription invoices
    if (!invoiceData.subscription) {
      console.log('Invoice payment failed for non-subscription invoice:', invoice.id);
      return;
    }

    const subscriptionId = typeof invoiceData.subscription === 'string'
      ? invoiceData.subscription
      : invoiceData.subscription.id;

    const dbSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscriptionId
    });

    if (!dbSubscription) {
      console.error('Subscription not found for invoice:', invoice.id);
      return;
    }

    // Update subscription status if needed
    // Stripe will automatically update status via subscription.updated webhook
    // But we log it here for monitoring
    console.error(`Payment failed for subscription ${subscriptionId}, invoice ${invoice.id}`);
    console.error(`Next payment attempt will be made by Stripe automatically`);

    // You could add user notification logic here
    // await notifyUserOfPaymentFailure(dbSubscription.userId, invoice.id);
  } catch (error: any) {
    console.error('Error handling invoice payment failed:', error);
    throw error;
  }
};

/**
 * Check if user has active subscription with sufficient quota
 */
export const checkSubscriptionQuota = async (userId: string): Promise<{
  hasQuota: boolean;
  subscription: any;
  plan: any;
  callsRemaining: number;
}> => {
  try {
    const subscription = await Subscription.findOne({
      userId,
      status: 'active',
      currentPeriodEnd: { $gte: new Date() }
    }).populate('planId');

    if (!subscription) {
      // Check if user should be on free plan
      const freePlan = await Plan.findOne({ tier: 'free', billingPeriod: 'monthly' });
      if (!freePlan) {
        throw new Error('Free plan not found');
      }

      // For free tier users, check how many evaluations they've used this month
      const Evaluation = require('../models/Evaluation').default;
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const evaluationCount = await Evaluation.countDocuments({
        userId,
        createdAt: { $gte: startOfMonth }
      });

      return {
        hasQuota: evaluationCount < freePlan.callLimit,
        subscription: null,
        plan: freePlan,
        callsRemaining: Math.max(0, freePlan.callLimit - evaluationCount)
      };
    }

    const plan = subscription.planId as any;
    const callsRemaining = plan.callLimit - subscription.callsUsed;

    return {
      hasQuota: callsRemaining > 0,
      subscription,
      plan,
      callsRemaining
    };
  } catch (error: any) {
    console.error('Error checking subscription quota:', error);
    throw new Error(`Failed to check subscription quota: ${error.message}`);
  }
};

/**
 * Increment subscription usage count
 */
export const incrementSubscriptionUsage = async (userId: string): Promise<void> => {
  try {
    const subscription = await Subscription.findOne({
      userId,
      status: 'active',
      currentPeriodEnd: { $gte: new Date() }
    });

    if (subscription) {
      subscription.callsUsed += 1;
      await subscription.save();
      console.log(`✅ Incremented subscription usage: ${subscription.callsUsed}/${(subscription.planId as any).callLimit}`);
    } else {
      // Free tier users don't have subscription records, usage is tracked by counting evaluations
      console.log(`ℹ️  User ${userId} is on free tier, usage tracked via evaluation count`);
    }
  } catch (error: any) {
    console.error('Error incrementing subscription usage:', error);
    throw new Error(`Failed to increment subscription usage: ${error.message}`);
  }
};

/**
 * Create a Stripe billing portal session
 * Allows customers to manage their subscription, payment methods, and invoices
 */
export const createBillingPortalSession = async (
  userId: string,
  returnUrl?: string
): Promise<Stripe.BillingPortal.Session> => {
  try {
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has a Stripe customer ID
    if (!user.stripeCustomerId) {
      throw new Error('User does not have a Stripe customer account. Please subscribe first.');
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl || `${process.env.FRONTEND_URL}/dashboard/subscription`,
    });

    console.log(`✅ Created billing portal session for user ${userId}`);
    return session;
  } catch (error: any) {
    console.error('Error creating billing portal session:', error);
    throw new Error(`Failed to create billing portal session: ${error.message}`);
  }
};

export default {
  getOrCreateStripeCustomer,
  createCheckoutSession,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed,
  getSubscriptionDetails,
  cancelSubscription,
  checkSubscriptionQuota,
  incrementSubscriptionUsage,
  createBillingPortalSession
};
