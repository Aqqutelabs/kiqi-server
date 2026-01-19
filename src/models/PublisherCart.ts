import mongoose, { Schema, Document } from 'mongoose';

// Interface for shopping cart items
export interface ICartItem {
  publisherId: mongoose.Types.ObjectId;
  publisherTitle: string;
  basePrice: number;
  quantity: number;
  selectedAddOns: {
    addonName: string;
    addonPrice: number;
    quantity?: number; // For featured placement
    budget?: number; // For paid amplification
  }[];
  subtotal: number;
}

// Interface for bookmarks
export interface IBookmark extends Document {
  userId: mongoose.Types.ObjectId;
  publisherId: mongoose.Types.ObjectId;
  createdAt: Date;
}

// Interface for cart
export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  totalAmount: number;
  currency: string;
  expiresAt: Date; // Cart expiration
  createdAt: Date;
  updatedAt: Date;
}

// Bookmark Schema
const BookmarkSchema = new Schema<IBookmark>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publisherId: {
    type: Schema.Types.ObjectId,
    ref: 'PublisherListing',
    required: true
  }
}, {
  timestamps: true
});

// Ensure unique bookmark per user-publisher combination
BookmarkSchema.index({ userId: 1, publisherId: 1 }, { unique: true });

// Cart Schema
const CartSchema = new Schema<ICart>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One cart per user
  },
  items: [{
    publisherId: {
      type: Schema.Types.ObjectId,
      ref: 'PublisherListing',
      required: true
    },
    publisherTitle: {
      type: String,
      required: true
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    selectedAddOns: [{
      addonName: {
        type: String,
        required: true
      },
      addonPrice: {
        type: Number,
        required: true,
        min: 0
      },
      quantity: {
        type: Number,
        min: 1
      },
      budget: {
        type: Number,
        min: 0
      }
    }],
    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate total amount
CartSchema.pre('save', function(next) {
  this.totalAmount = this.items.reduce((total, item) => total + item.subtotal, 0);
  next();
});

// Index for cart expiration cleanup
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Bookmark = mongoose.model<IBookmark>('Bookmark', BookmarkSchema);
export const Cart = mongoose.model<ICart>('Cart', CartSchema);