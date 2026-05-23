import mongoose, { Document, Schema } from "mongoose";

export interface IAdminEmailOtp extends Document {
  email: string;
  otpCode: string;
  requestId: string;
  purpose: "change_password";
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminEmailOtpSchema = new Schema<IAdminEmailOtp>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otpCode: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 6,
    },
    requestId: {
      type: String,
      required: true,
      unique: true,
    },
    purpose: {
      type: String,
      enum: ["change_password"],
      default: "change_password",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: Date,
  },
  { timestamps: true }
);

AdminEmailOtpSchema.index({ email: 1, purpose: 1, createdAt: -1 });
AdminEmailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.AdminEmailOtp || mongoose.model<IAdminEmailOtp>("AdminEmailOtp", AdminEmailOtpSchema);
