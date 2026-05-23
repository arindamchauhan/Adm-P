import mongoose, { Schema, Document } from "mongoose";

export interface ICollabVideo extends Document {
  creatorName: string;
  instagramUrl: string;
  thumbnailUrl: string;
  caption: string;
  viewsLabel?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CollabVideoSchema = new Schema<ICollabVideo>(
  {
    creatorName: {
      type: String,
      required: true,
      trim: true,
    },
    instagramUrl: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      required: true,
      trim: true,
    },
    caption: {
      type: String,
      required: true,
      trim: true,
    },
    viewsLabel: {
      type: String,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

CollabVideoSchema.index({ sortOrder: 1, createdAt: 1 });

export default mongoose.models.CollabVideo ||
  mongoose.model<ICollabVideo>("CollabVideo", CollabVideoSchema);
