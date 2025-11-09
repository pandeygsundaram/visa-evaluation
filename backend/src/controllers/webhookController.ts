import { Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe, STRIPE_CONFIG } from '../config/stripe';
import stripeService from '../services/stripeService';

/**
 * Handle Stripe webhook events
 */
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.error('No stripe signature found');
    return res.status(400).json({
      success: false,
      message: 'No stripe signature'
    });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature and construct event
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_CONFIG.webhookSecret
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({
      success: false,
      message: `Webhook Error: ${err.message}`
    });
  }

  console.log(`Received webhook event: ${event.type}`);

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        // Payment successful, subscription created
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);
        // Subscription will be created via subscription.created event
        break;

      case 'customer.subscription.created':
        // New subscription created
        const createdSubscription = event.data.object as Stripe.Subscription;
        await stripeService.handleSubscriptionCreated(createdSubscription);
        break;

      case 'customer.subscription.updated':
        // Subscription updated (renewal, plan change, etc.)
        const updatedSubscription = event.data.object as Stripe.Subscription;
        await stripeService.handleSubscriptionUpdated(updatedSubscription);
        break;

      case 'customer.subscription.deleted':
        // Subscription canceled or expired
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await stripeService.handleSubscriptionDeleted(deletedSubscription);
        break;

      case 'invoice.payment_succeeded':
        // Successful payment (initial or recurring)
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment succeeded for invoice:', invoice.id);
        break;

      case 'invoice.payment_failed':
        // Failed payment
        const failedInvoice = event.data.object as Stripe.Invoice;
        console.log('Payment failed for invoice:', failedInvoice.id);
        // You might want to notify the user or update subscription status
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response
    res.json({
      success: true,
      received: true
    });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook handler failed',
      error: error.message
    });
  }
};

export default {
  handleStripeWebhook
};
