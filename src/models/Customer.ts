import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
    },
    email: { 
      type: String, 
      unique: true, 
      sparse: true 
    },
    phone: { 
      type: String, 
      required: true, 
      unique: true 
    },
    whatsappVerified: { 
      type: Boolean, 
      default: false 
    },
    whatsappAvailable: { 
      type: Boolean, 
      default: false 
    },
    address: { 
      type: String 
    },
    city: { 
      type: String 
    },
    state: { 
      type: String 
    },
    pincode: { 
      type: String 
    },
    totalOrders: { 
      type: Number, 
      default: 0 
    },
    totalSpent: { 
      type: Number, 
      default: 0 
    },
    notes: { 
      type: String 
    },
    lastOrderDate: { 
      type: Date 
    },
    createdFrom: {
      type: String,
      enum: ['website', 'admin', 'import'],
      default: 'website'
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes
CustomerSchema.index({ whatsappVerified: 1 });
CustomerSchema.index({ createdAt: -1 });

export default mongoose.models.Customer || 
  mongoose.model('Customer', CustomerSchema);
