import mongoose, { Schema, Document } from 'mongoose';

// Cart item interface
interface CartAddOn {
    id: string;
    name?: string;
    price?: string; // stored as string for backward compatibility with existing price parsing
    quantity?: number;
    description?: string;
}

interface CartItem {
    // Accept either publisherId (string) or mongo ObjectId (_id) depending on which flow added the item
    publisherId: string | mongoose.Types.ObjectId;
    name?: string;
    publisherTitle?: string;
    // Legacy price field (string) used by older flows
    price?: string;
    // Enhanced fields for marketplace flow
    basePrice?: number;
    quantity?: number;
    selectedAddOns?: CartAddOn[];
    subtotal?: number;
    selected?: boolean;
    region_reach?: string[];
    audience_reach?: string;
}

// Cart document interface
interface CartDocument extends Document {
    user_id: mongoose.Types.ObjectId;
    items: CartItem[];
    audience?: string;
    location?: string;
    created_at: Date;
    updated_at: Date;
}

const CartItemSchema = new Schema<CartItem>({
    publisherId: { type: Schema.Types.Mixed, required: true },
    name: { type: String },
    publisherTitle: { type: String },
    price: { type: String },
    basePrice: { type: Number },
    quantity: { type: Number, default: 1 },
    selectedAddOns: [{
        id: { type: String },
        name: { type: String },
        price: { type: String },
        quantity: { type: Number },
        description: { type: String }
    }],
    subtotal: { type: Number },
    selected: { type: Boolean, default: true },
    region_reach: [{ type: String }],
    audience_reach: { type: String }
});

const CartSchema = new Schema<CartDocument>({
    user_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true // One cart per user
    },
    items: [CartItemSchema],
    audience: { type: String, required: false },
    location: { type: String, required: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Update the updated_at timestamp on save
CartSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

export const Cart = mongoose.model<CartDocument>('Cart', CartSchema);