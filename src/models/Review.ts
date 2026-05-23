import mongoose, { Document, Schema } from "mongoose";

export interface IReview extends Document {
  name: string;
  rating: number;
  text: string;
  source: string;
  location?: string;
  instagramVideoUrl?: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    name: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, trim: true },
    source: { type: String, default: "Written review", trim: true },
    location: { type: String, trim: true },
    instagramVideoUrl: { type: String, trim: true },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ReviewSchema.index({ createdAt: -1 });

export default mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);
