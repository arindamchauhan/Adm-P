import mongoose, { Document, Schema } from "mongoose";

export interface IQuickOrder extends Document {
  orderId: string;
  product: {
    name: string;
    quantity: number;
    unitPrice: number;
  };
  customer: {
    fullName: string;
    phoneNumber: string;
    emailAddress: string;
    houseAddress: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
  };
  orderSummary: {
    subtotal: number;
    shipping: number;
    total: number;
  };
  payment: {
    method: "cod" | "upi" | "card";
    status: "pending" | "completed" | "failed";
  };
  delivery?: {
    isServiceable: boolean;
    estimatedDeliveryDate?: Date;
    estimatedDays?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const QuickOrderSchema = new Schema<IQuickOrder>(
  {
    orderId: { type: String, required: true, unique: true },
    product: {
      name: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },
      unitPrice: { type: Number, required: true, min: 0 },
    },
    customer: {
      fullName: { type: String, required: true, trim: true },
      phoneNumber: { type: String, required: true, trim: true },
      emailAddress: { type: String, required: true, trim: true },
      houseAddress: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      district: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },
    orderSummary: {
      subtotal: { type: Number, required: true, min: 0 },
      shipping: { type: Number, required: true, min: 0 },
      total: { type: Number, required: true, min: 0 },
    },
    payment: {
      method: {
        type: String,
        required: true,
        enum: ["cod", "upi", "card"],
        default: "cod",
      },
      status: {
        type: String,
        required: true,
        enum: ["pending", "completed", "failed"],
        default: "pending",
      },
    },
    delivery: {
      isServiceable: { type: Boolean, default: true },
      estimatedDeliveryDate: { type: Date },
      estimatedDays: { type: Number },
    },
  },
  { timestamps: true }
);

// `orderId` is declared `unique: true` on the field — avoid duplicate index
QuickOrderSchema.index({ createdAt: -1 });

export default mongoose.models.QuickOrder || mongoose.model<IQuickOrder>("QuickOrder", QuickOrderSchema);
