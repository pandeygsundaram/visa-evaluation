import mongoose, { Document, Schema } from 'mongoose';

export interface IDocument {
  type: string; // e.g., 'resume', 'personal_statement', 'police_report', etc.
  url?: string; // Optional - signed URLs generated on-demand from r2Key
  r2Key: string; // R2 storage key for the file
  fileName: string; // Original file name
  uploadedAt: Date;
}

export interface ICheckpointAnalysis {
  checkpoint: string; // The checking point/requirement name
  status: 'met' | 'partially_met' | 'not_met' | 'not_applicable';
  evidence?: string; // Evidence found in the document
  feedback?: string; // Specific feedback for this checkpoint
  score?: number; // Individual score for this checkpoint
}

export interface IEvaluationResult {
  isMalicious: boolean; // Flag for malicious content detection
  maliciousReason?: string; // Reason if marked as malicious
  score: number; // 0-100
  summary: string;
  checkpoints?: ICheckpointAnalysis[]; // Detailed checkpoint analysis
  suggestions?: string[];
  strengths?: string[];
  weaknesses?: string[];
  rawAnalysis?: string; // Raw LLM response for debugging
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
    required: false, // Not required - signed URLs generated on-demand
    default: ''
  },
  r2Key: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const CheckpointAnalysisSchema = new Schema<ICheckpointAnalysis>({
  checkpoint: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['met', 'partially_met', 'not_met', 'not_applicable'],
    required: true
  },
  evidence: String,
  feedback: String,
  score: Number
});

const EvaluationResultSchema = new Schema<IEvaluationResult>({
  isMalicious: {
    type: Boolean,
    required: true,
    default: false
  },
  maliciousReason: String,
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
  checkpoints: [CheckpointAnalysisSchema],
  suggestions: [String],
  strengths: [String],
  weaknesses: [String],
  rawAnalysis: String
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
