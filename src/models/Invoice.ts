import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema(
  {
    billNumber: { 
      type: String, 
      unique: true, 
      required: true 
    },
    orderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Order', 
      required: true 
    },
    customerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Customer', 
      required: true 
    },
    items: [
      {
        productId: String,
        productName: String,
        quantity: Number,
        price: Number,
        total: Number
      }
    ],
    subtotal: { 
      type: Number, 
      required: true 
    },
    tax: { 
      type: Number, 
      default: 0 
    },
    shipping: { 
      type: Number, 
      default: 0 
    },
    discount: { 
      type: Number, 
      default: 0 
    },
    grandTotal: { 
      type: Number, 
      required: true 
    },
    billedDate: { 
      type: Date, 
      default: new Date() 
    },
    dueDate: { 
      type: Date 
    },
    status: { 
      type: String, 
      enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'], 
      default: 'draft' 
    },
    paymentMethod: { 
      type: String,
      enum: ['COD', 'UPI', 'Card', 'NetBanking', 'Wallet', 'Other'],
      default: 'COD'
    },
    paymentDate: { 
      type: Date 
    },
    notes: { 
      type: String 
    },
    whatsappSent: { 
      type: Boolean, 
      default: false 
    },
    whatsappSentAt: { 
      type: Date 
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes
// `billNumber` is declared `unique: true` on the field — avoid duplicate index
InvoiceSchema.index({ orderId: 1 });
InvoiceSchema.index({ customerId: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ createdAt: -1 });

export default mongoose.models.Invoice || 
  mongoose.model('Invoice', InvoiceSchema);
