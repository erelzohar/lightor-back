import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  isVerified: boolean;
  verificationToken?: string;
  verificationExpire?: Date;
  subscription: {
    status: string;
    planId?: string;
    customerId?: string;
    subscriptionId?: string;
    nextBillDate?: Date;
  };
  role: string;
  webConfig_id?: mongoose.Types.ObjectId;
  defaultLanguage: string;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        'Please add a valid email',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Please add a username'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot be more than 20 characters'],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    // --- VERIFICATION FIELDS ---
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: String,
    verificationExpire: Date,

    // --- SUBSCRIPTION FIELDS ---
    subscription: {
      status: { 
        type: String, 
        enum: ['free', 'active', 'past_due', 'canceled', 'deleted'], 
        default: 'free' 
      },
      planId: String,         // Paddle Price ID (e.g., 'pri_123')
      customerId: String,     // Paddle Customer ID (e.g., 'ctm_123')
      subscriptionId: String, // Paddle Subscription ID (e.g., 'sub_123')
      nextBillDate: Date,     // Next payment or expiration date
    },

    role: {
      type: String,
      enum: ['admin', 'client', 'user'],
      default: 'user',
    },
    webConfig_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WebConfig',
    },
    defaultLanguage: {
      type: String,
      enum: ['en', 'he', 'ar', 'fr', 'es'],
      default: 'he',
    },
  },
  {
    timestamps: true,
    versionKey: false,
    id: false,
    toJSON: { virtuals: true }
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);