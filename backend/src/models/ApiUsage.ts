import mongoose, { Document, Schema } from 'mongoose';

export interface IApiUsage extends Document {
  userId: mongoose.Types.ObjectId;
  apiKey: string; // The API key used
  endpoint: string; // The endpoint called
  method: string; // HTTP method
  statusCode: number; // Response status code
  success: boolean; // Whether the call was successful
  modelUsed?: string; // Which AI model was used (e.g., 'gpt-4o-mini', 'gpt-4o')
  tokensUsed?: number; // Tokens consumed
  responseTime?: number; // Response time in milliseconds
  errorMessage?: string; // Error message if failed
  metadata?: {
    country?: string;
    visaType?: string;
    documentCount?: number;
    [key: string]: any;
  };
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const ApiUsageSchema = new Schema<IApiUsage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    apiKey: {
      type: String,
      required: true,
      index: true
    },
    endpoint: {
      type: String,
      required: true
    },
    method: {
      type: String,
      required: true,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    },
    statusCode: {
      type: Number,
      required: true
    },
    success: {
      type: Boolean,
      required: true,
      default: false
    },
    modelUsed: {
      type: String
    },
    tokensUsed: {
      type: Number,
      min: 0
    },
    responseTime: {
      type: Number,
      min: 0
    },
    errorMessage: {
      type: String
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false // Using timestamp field instead
  }
);

// Compound indexes for efficient analytics queries
ApiUsageSchema.index({ userId: 1, timestamp: -1 });
ApiUsageSchema.index({ apiKey: 1, timestamp: -1 });
ApiUsageSchema.index({ userId: 1, success: 1, timestamp: -1 });
ApiUsageSchema.index({ timestamp: -1 }); // For time-based queries

// TTL index to auto-delete old records after 90 days (optional)
ApiUsageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model<IApiUsage>('ApiUsage', ApiUsageSchema);
