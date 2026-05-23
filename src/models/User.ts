import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username?: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'customer' | 'admin';
  addresses?: {
    _id?: string;
    label?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    isDefault?: boolean;
  }[];
  defaultAddressId?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  permissions?: string[];
  preferences?: {
    emailUpdates?: boolean;
    smsNotifications?: boolean;
    language?: string;
  };
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      unique: true,
      sparse: true,
      match: [/^[a-z0-9_.-]+$/, 'Username can only contain lowercase letters, numbers, dot, underscore and hyphen'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    firstName: {
      type: String,
      required: [true, 'Please provide first name'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Please provide last name'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide phone number'],
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    addresses: [
      {
        label: String,
        address: String,
        city: String,
        state: String,
        pincode: String,
        isDefault: Boolean,
      },
    ],
    defaultAddressId: mongoose.Schema.Types.ObjectId,
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: Date,
    permissions: [String],
    preferences: {
      emailUpdates: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      language: { type: String, default: 'en' },
    },
  },
  { timestamps: true }
);

// Index for performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 }, { unique: true, sparse: true });
UserSchema.index({ phone: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
