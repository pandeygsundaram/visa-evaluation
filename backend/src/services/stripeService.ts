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

    // Update subscription
    await Subscription.findByIdAndUpdate(dbSubscription._id, {
      status: subscription.status as any,
      currentPeriodStart: new Date(periodStart * 1000),
      currentPeriodEnd: new Date(periodEnd * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined
    });

    // Reset usage at period renewal - reload document to use instance methods
    if (subscription.status === 'active') {
      const updatedSubscription = await Subscription.findById(dbSubscription._id);
      if (updatedSubscription && typeof (updatedSubscription as any).resetUsage === 'function') {
        await (updatedSubscription as any).resetUsage();
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
      return {
        hasQuota: false,
        subscription: null,
        plan: null,
        callsRemaining: 0
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

export default {
  getOrCreateStripeCustomer,
  createCheckoutSession,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  getSubscriptionDetails,
  cancelSubscription,
  checkSubscriptionQuota
};
