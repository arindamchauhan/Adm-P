import mongoose, { Document, Schema } from "mongoose";

export type RealtimeEntity =
  | "product"
  | "order"
  | "coupon"
  | "collab"
  | "site-settings"
  | "staff"
  | "customer"
  | "dashboard";

export interface IRealtimeEvent extends Document {
  entity: RealtimeEntity;
  action: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const RealtimeEventSchema = new Schema<IRealtimeEvent>(
  {
    entity: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    resourceId: { type: String, index: true },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

RealtimeEventSchema.index({ createdAt: -1 });

export default mongoose.models.RealtimeEvent ||
  mongoose.model<IRealtimeEvent>("RealtimeEvent", RealtimeEventSchema);