import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Plan from '../models/Plan';
import { stripe } from '../config/stripe';

dotenv.config();

/**
 * Create Stripe products and prices, then seed database with plans
 */
const seedPlans = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing plans
    await Plan.deleteMany({});
    console.log('🗑️  Cleared existing plans');

    // Define plans
    const plansData = [
      {
        name: 'Free',
        tier: 'free' as const,
        price: 0,
        billingPeriod: 'monthly' as const,
        callLimit: 5,
        modelAccess: {
          gpt4oMini: true,
          gpt4o: false
        },
        features: [
          '5 evaluations per month',
          'GPT-4o-mini model',
          'Basic features',
          'Community support'
        ]
      },
      {
        name: 'Pro Monthly',
        tier: 'pro' as const,
        price: 2900, // $29.00
        billingPeriod: 'monthly' as const,
        callLimit: 5000,
        modelAccess: {
          gpt4oMini: true,
          gpt4o: true
        },
        features: [
          '5,000 evaluations per month',
          'GPT-4o-mini + GPT-4o access',
          'All features unlocked',
          'Email support',
          'API access',
          'Priority processing'
        ]
      },
      {
        name: 'Pro Yearly',
        tier: 'pro' as const,
        price: 29000, // $290.00 (save ~17%)
        billingPeriod: 'yearly' as const,
        callLimit: 60000, // 5000 * 12
        modelAccess: {
          gpt4oMini: true,
          gpt4o: true
        },
        features: [
          '60,000 evaluations per year',
          'GPT-4o-mini + GPT-4o access',
          'All features unlocked',
          'Email support',
          'API access',
          'Priority processing',
          'Save 17% with annual billing'
        ]
      },
      {
        name: 'Business Monthly',
        tier: 'business' as const,
        price: 9900, // $99.00
        billingPeriod: 'monthly' as const,
        callLimit: 25000,
        modelAccess: {
          gpt4oMini: true,
          gpt4o: true
        },
        features: [
          '25,000 evaluations per month',
          'Full GPT-4o access',
          'Priority support',
          'Advanced analytics',
          'Team collaboration',
          'Custom integrations',
          'Dedicated account manager'
        ]
      },
      {
        name: 'Business Yearly',
        tier: 'business' as const,
        price: 99000, // $990.00 (save ~17%)
        billingPeriod: 'yearly' as const,
        callLimit: 300000, // 25000 * 12
        modelAccess: {
          gpt4oMini: true,
          gpt4o: true
        },
        features: [
          '300,000 evaluations per year',
          'Full GPT-4o access',
          'Priority support',
          'Advanced analytics',
          'Team collaboration',
          'Custom integrations',
          'Dedicated account manager',
          'Save 17% with annual billing'
        ]
      }
    ];

    // Create Stripe products and prices for paid plans
    for (const planData of plansData) {
      let stripePriceId: string | undefined;
      let stripeProductId: string | undefined;

      if (planData.tier !== 'free') {
        try {
          // Create Stripe product
          const product = await stripe.products.create({
            name: planData.name,
            description: planData.features.join(', '),
            metadata: {
              tier: planData.tier,
              billingPeriod: planData.billingPeriod
            }
          });

          stripeProductId = product.id;

          // Create Stripe price
          const price = await stripe.prices.create({
            product: product.id,
            unit_amount: planData.price,
            currency: 'usd',
            recurring: {
              interval: planData.billingPeriod === 'monthly' ? 'month' : 'year'
            },
            metadata: {
              tier: planData.tier,
              callLimit: planData.callLimit.toString()
            }
          });

          stripePriceId = price.id;

          console.log(`✅ Created Stripe product and price for ${planData.name}`);
        } catch (error: any) {
          console.error(`❌ Error creating Stripe product for ${planData.name}:`, error.message);
        }
      }

      // Create plan in database
      await Plan.create({
        ...planData,
        stripePriceId,
        stripeProductId,
        isActive: true
      });

      console.log(`✅ Seeded plan: ${planData.name}`);
    }

    console.log('\n🎉 Successfully seeded all plans!');
    console.log('\nPlans created:');
    const plans = await Plan.find({});
    plans.forEach(plan => {
      console.log(`  - ${plan.name} (${plan.tier}): $${plan.price / 100}/${plan.billingPeriod}`);
    });

  } catch (error: any) {
    console.error('❌ Error seeding plans:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
};

// Run the seed script
seedPlans()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
