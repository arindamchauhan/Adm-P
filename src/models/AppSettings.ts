import mongoose, { Document, Schema } from "mongoose";

export interface IAppSettings extends Document {
  singletonKey: string;
  supportEmail: string;
  supportPhone: string;
  supportWhatsapp: string;
  contactEmail: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppSettingsSchema = new Schema<IAppSettings>(
  {
    singletonKey: {
      type: String,
      required: true,
      unique: true,
      default: "default",
    },
    supportEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      default: "support@bijnoor.com",
    },
    supportPhone: {
      type: String,
      required: true,
      trim: true,
      default: "+919876543210",
    },
    supportWhatsapp: {
      type: String,
      required: true,
      trim: true,
      default: "919999999999",
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      default: "info@bijnoor.com",
    },
    updatedBy: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// singletonKey is declared `unique: true` on the field — no duplicate schema index needed

export default mongoose.models.AppSettings || mongoose.model<IAppSettings>("AppSettings", AppSettingsSchema);
