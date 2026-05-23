import mongoose, { Document, Schema } from "mongoose";

export interface IOtpVerification extends Document {
  requestId: string;
  phoneNumber: string;
  otpCode: string;
  verificationToken?: string;
  isVerified: boolean;
  isLocked?: boolean;
  failedAttempts?: number;
  expiresAt: Date;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OtpVerificationSchema = new Schema<IOtpVerification>(
  {
    requestId: { type: String, required: true, unique: true, index: true },
    phoneNumber: { type: String, required: true, index: true },
    otpCode: { type: String, required: true },
    verificationToken: { type: String },
    isVerified: { type: Boolean, default: false, index: true },
    isLocked: { type: Boolean, default: false },
    failedAttempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: true },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

// Index for cleanup of expired OTPs
OtpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.OtpVerification ||
  mongoose.model<IOtpVerification>("OtpVerification", OtpVerificationSchema);
