import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IApiKey {
  key: string;
  name: string;
  createdAt: Date;
  lastUsed?: Date;
  isActive: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  provider?: 'credentials' | 'google';
  googleId?: string;
  apiKeys: IApiKey[];
  evaluations: mongoose.Types.ObjectId[]; // References to Evaluation documents
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const ApiKeySchema = new Schema<IApiKey>({
  key: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: function (this: IUser) {
        return this.provider === 'credentials' || !this.provider;
      },
      select: false, // Don't include password in queries by default
      validate: {
        validator: function (this: IUser, value: string) {
          // Skip validation for Google OAuth users
          if (this.provider === 'google') {
            return true;
          }
          // For credentials users, password must be at least 6 characters if provided
          if (value && value.length < 6) {
            return false;
          }
          return true;
        },
        message: 'Password must be at least 6 characters'
      }
    },
    provider: {
      type: String,
      enum: ['credentials', 'google'],
      default: 'credentials'
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true
    },
    apiKeys: [ApiKeySchema],
    evaluations: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Evaluation'
      }
    ]
  },
  {
    timestamps: true
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  // Skip password hashing for OAuth users without password
  if (this.provider === 'google' || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
