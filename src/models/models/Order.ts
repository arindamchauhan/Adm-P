import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  orderId: string;
  userId?: mongoose.Types.ObjectId;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
  items: {
    productId: mongoose.Types.ObjectId;
    productName: string;
    productImage?: string;
    quantity: number;
    price: number;
    discount?: number;
    total: number;
  }[];
  summary: {
    subtotal: number;
    tax?: number;
    taxPercentage?: number;
    shipping?: number;
    discount?: number;
    total: number;
  };
  coupon?: {
    code?: string;
    discount?: number;
    discountType?: string;
  };
  payment: {
    method: 'cashfree' | 'bank_transfer' | 'cod';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
    transactionId?: string;
    cashfree?: {
      orderId?: string;
      paymentSessionId?: string;
      paymentId?: string;
      orderStatus?: string;
    };
    paidAt?: Date;
  };
  status: 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  timeline: {
    status: string;
    timestamp: Date;
    notes?: string;
    changedBy?: mongoose.Types.ObjectId;
  }[];
  shipping?: {
    method?: string;
    carrier?: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
    actualDelivery?: Date;
  };
  notes?: {
    customerNotes?: string;
    adminNotes?: string;
  };
  return?: {
    status?: string;
    reason?: string;
    requestedAt?: Date;
    approvedAt?: Date;
    refundStatus?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  source?: 'web' | 'mobile' | 'admin';
}

const OrderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: mongoose.Schema.Types.ObjectId,
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        productName: String,
        productImage: String,
        quantity: { type: Number, required: true, min: 1 },
        price: Number,
        discount: Number,
        total: Number,
      },
    ],
    summary: {
      subtotal: Number,
      tax: { type: Number, default: 0 },
      taxPercentage: { type: Number, default: 10 },
      shipping: { type: Number, default: 0 },
      discount: Number,
      total: { type: Number, required: true },
    },
    coupon: {
      code: String,
      discount: Number,
      discountType: String,
    },
    payment: {
      method: {
        type: String,
        enum: ['cashfree', 'bank_transfer', 'cod'],
        default: 'cashfree',
      },
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
        default: 'pending',
      },
      transactionId: String,
      cashfree: {
        orderId: String,
        paymentSessionId: String,
        paymentId: String,
        orderStatus: String,
      },
      paidAt: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
      default: 'pending',
    },
    timeline: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        notes: String,
        changedBy: mongoose.Schema.Types.ObjectId,
      },
    ],
    shipping: {
      method: String,
      carrier: String,
      trackingNumber: String,
      estimatedDelivery: Date,
      actualDelivery: Date,
    },
    notes: {
      customerNotes: String,
      adminNotes: String,
    },
    return: {
      status: String,
      reason: String,
      requestedAt: Date,
      approvedAt: Date,
      refundStatus: String,
    },
    source: {
      type: String,
      enum: ['web', 'mobile', 'admin'],
      default: 'web',
    },
  },
  { timestamps: true }
);

// Indexes for performance
OrderSchema.index({ orderId: 1 });
OrderSchema.index({ userId: 1 });
OrderSchema.index({ 'customer.email': 1 });
OrderSchema.index({ createdAt: -1 });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
