import mongoose, { Document, Schema } from "mongoose";

export interface ISubscriber extends Document {
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// `email` is already declared `unique: true` on the field — avoid duplicate index

export default mongoose.models.Subscriber || mongoose.model<ISubscriber>("Subscriber", SubscriberSchema);
