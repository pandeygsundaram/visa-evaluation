import mongoose, { Document, Schema } from 'mongoose';

export type BillingPeriod = 'monthly' | 'yearly';
export type PlanTier = 'free' | 'pro' | 'business';

export interface IPlan extends Document {
  name: string;
  tier: PlanTier;
  price: number; // Price in cents (e.g., 2900 for $29.00)
  billingPeriod: BillingPeriod;
  callLimit: number; // API calls allowed per billing period
  modelAccess: {
    gpt4oMini: boolean;
    gpt4o: boolean;
  };
  features: string[];
  stripePriceId?: string; // Stripe Price ID
  stripeProductId?: string; // Stripe Product ID
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    tier: {
      type: String,
      enum: ['free', 'pro', 'business'],
      required: true,
      index: true
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    billingPeriod: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true
    },
    callLimit: {
      type: Number,
      required: true,
      min: 0
    },
    modelAccess: {
      gpt4oMini: {
        type: Boolean,
        default: true
      },
      gpt4o: {
        type: Boolean,
        default: false
      }
    },
    features: {
      type: [String],
      default: []
    },
    stripePriceId: {
      type: String,
      sparse: true
    },
    stripeProductId: {
      type: String,
      sparse: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient plan lookup
PlanSchema.index({ tier: 1, billingPeriod: 1, isActive: 1 });

export default mongoose.model<IPlan>('Plan', PlanSchema);
