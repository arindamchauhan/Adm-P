import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  shortDescription?: string;
  slug: string;
  price: number;
  launchSoon?: boolean;
  originalPrice?: number;
  cost?: number;
  discount?: number;
  category: string;
  tags?: string[];
  images: {
    url: string;
    altText?: string;
    isPrimary?: boolean;
    uploadedAt?: Date;
  }[];
  sku: string;
  stock: number;
  minStockLevel?: number;
  ingredients: string[];
  benefits: string[];
  usage?: string;
  specifications?: {
    volume?: string;
    weight?: string;
    expiryMonths?: number;
    packagingType?: string;
    material?: string;
  };
  rating?: number;
  reviewCount?: number;
  reviews?: mongoose.Types.ObjectId[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
  };
  isActive: boolean;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  relatedProducts?: mongoose.Types.ObjectId[];
  views?: number;
  sales?: number;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Please provide product name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide product description'],
    },
    shortDescription: String,
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide product price'],
      min: 0,
    },
    launchSoon: {
      type: Boolean,
      default: false,
    },
    originalPrice: Number,
    cost: Number,
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    category: {
      type: String,
      required: true,
      enum: ['skincare', 'suncare', 'lips', 'serums', 'masks', 'other'],
    },
    tags: [String],
    images: [
      {
        url: { type: String, required: true },
        altText: String,
        isPrimary: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    sku: {
      type: String,
      required: true,
      unique: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    minStockLevel: {
      type: Number,
      default: 5,
    },
    ingredients: [String],
    benefits: [String],
    usage: String,
    specifications: {
      volume: String,
      weight: String,
      expiryMonths: Number,
      packagingType: String,
      material: String,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    reviews: [mongoose.Schema.Types.ObjectId],
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
      canonicalUrl: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: Date,
    createdBy: mongoose.Schema.Types.ObjectId,
    relatedProducts: [mongoose.Schema.Types.ObjectId],
    views: {
      type: Number,
      default: 0,
    },
    sales: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for performance
// `slug` and `sku` are declared `unique` on their fields — avoid duplicate indexes
ProductSchema.index({ category: 1 });
ProductSchema.index({ name: 'text', description: 'text' });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
