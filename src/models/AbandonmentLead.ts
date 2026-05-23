import mongoose, { Document, Schema } from "mongoose";

export interface IAbandonmentLead extends Document {
  fullName?: string;
  phoneNumber?: string;
  emailAddress?: string;
  pincode?: string;
  intentSource: "exit_intent" | "before_unload" | "inactivity";
  preferredChannel: "whatsapp" | "email";
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AbandonmentLeadSchema = new Schema<IAbandonmentLead>(
  {
    fullName: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    emailAddress: { type: String, trim: true, lowercase: true },
    pincode: { type: String, trim: true },
    intentSource: {
      type: String,
      enum: ["exit_intent", "before_unload", "inactivity"],
      required: true,
    },
    preferredChannel: {
      type: String,
      enum: ["whatsapp", "email"],
      required: true,
    },
    message: { type: String, trim: true },
  },
  { timestamps: true }
);

AbandonmentLeadSchema.index({ createdAt: -1 });

export default mongoose.models.AbandonmentLead ||
  mongoose.model<IAbandonmentLead>("AbandonmentLead", AbandonmentLeadSchema);
