import mongoose, { Document, Schema } from 'mongoose';

export interface IDocument {
  type: string; // e.g., 'resume', 'personal_statement', 'police_report', etc.
  url: string; // Cloudflare link
  uploadedAt: Date;
}

export interface IEvaluationResult {
  score: number; // 0-100
  summary: string;
  suggestions?: string[];
  strengths?: string[];
  weaknesses?: string[];
}

export interface IEvaluation extends Document {
  userId: mongoose.Types.ObjectId;
  country: string;
  visaType: string;
  documents: IDocument[];
  evaluationResult?: IEvaluationResult;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
}

const DocumentSchema = new Schema<IDocument>({
  type: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const EvaluationResultSchema = new Schema<IEvaluationResult>({
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  summary: {
    type: String,
    required: true
  },
  suggestions: [String],
  strengths: [String],
  weaknesses: [String]
});

const EvaluationSchema = new Schema<IEvaluation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      index: true
    },
    visaType: {
      type: String,
      required: [true, 'Visa type is required'],
      index: true
    },
    documents: [DocumentSchema],
    evaluationResult: EvaluationResultSchema,
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    processedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
EvaluationSchema.index({ userId: 1, createdAt: -1 });
EvaluationSchema.index({ country: 1, visaType: 1 });

export default mongoose.model<IEvaluation>('Evaluation', EvaluationSchema);
