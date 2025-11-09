import mongoose, { Document, Schema } from 'mongoose';

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'unpaid'
  | 'incomplete'
  | 'trialing';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  stripePaymentIntentId?: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  callsUsed: number; // Tracks API calls used in current period
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  resetUsage(): Promise<this>;
  incrementUsage(): Promise<this>;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true
    },
    stripeCustomerId: {
      type: String,
      required: true,
      index: true
    },
    stripeSubscriptionId: {
      type: String,
      sparse: true,
      index: true
    },
    stripePaymentIntentId: {
      type: String,
      sparse: true
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'trialing'],
      required: true,
      default: 'incomplete',
      index: true
    },
    currentPeriodStart: {
      type: Date,
      required: true,
      default: Date.now
    },
    currentPeriodEnd: {
      type: Date,
      required: true
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    canceledAt: {
      type: Date
    },
    callsUsed: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ stripeCustomerId: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1 });

// Method to reset monthly usage
SubscriptionSchema.methods.resetUsage = function() {
  this.callsUsed = 0;
  return this.save();
};

// Method to increment usage
SubscriptionSchema.methods.incrementUsage = function() {
  this.callsUsed += 1;
  return this.save();
};

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
