import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover', // Use latest API version
  typescript: true
});

// Stripe configuration constants
export const STRIPE_CONFIG = {
  currency: 'usd',
  successUrl: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
  cancelUrl: `${process.env.FRONTEND_URL}/dashboard?payment=canceled`,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
};

export default stripe;
