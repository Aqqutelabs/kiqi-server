import mongoose, { Schema, Document } from 'mongoose';

// Cart item interface
interface CartItem {
    publisherId: string;
    name: string;
    price: string;
    selected: boolean;
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
    publisherId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    selected: { type: Boolean, default: true }
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