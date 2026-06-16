import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  couponType: 'manual' | 'public_auto';
  audience: 'all_users' | 'new_users';
  discountType: 'percentage' | 'fixed';
  discount: number;
  minOrderValue?: number;
  maxDiscount?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  applicableCategories?: string[];
  applicableProducts?: mongoose.Types.ObjectId[];
  excludedProducts?: mongoose.Types.ObjectId[];
  startDate: Date;
  expiryDate: Date;
  isActive: boolean;
  usageCount: number;
  usedBy?: {
    userId?: mongoose.Types.ObjectId;
    orderId?: mongoose.Types.ObjectId;
    usedAt?: Date;
    usageCount?: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  description?: string;
  bannerText?: string;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, 'Please provide coupon code'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    couponType: {
      type: String,
      enum: ['manual', 'public_auto'],
      default: 'manual',
    },
    audience: {
      type: String,
      enum: ['all_users', 'new_users'],
      default: 'all_users',
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    maxDiscount: Number,
    maxUses: Number,
    maxUsesPerUser: {
      type: Number,
      default: 1,
    },
    applicableCategories: [String],
    applicableProducts: [mongoose.Schema.Types.ObjectId],
    excludedProducts: [mongoose.Schema.Types.ObjectId],
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Please provide expiry date'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    usedBy: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        orderId: mongoose.Schema.Types.ObjectId,
        usedAt: Date,
        usageCount: Number,
      },
    ],
    createdBy: mongoose.Schema.Types.ObjectId,
    description: String,
    bannerText: String,
  },
  { timestamps: true }
);

// Indexes for performance
// `code` is declared `unique: true` on the field — avoid duplicate index
CouponSchema.index({ expiryDate: 1 });
CouponSchema.index({ couponType: 1, isActive: 1, createdAt: -1 });

export default mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
