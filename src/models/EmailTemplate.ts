import mongoose, { Schema, Document } from 'mongoose';

export interface TemplateVariable {
    name: string;
    description: string;
    defaultValue?: string;
    required: boolean;
    type: 'string' | 'number' | 'date' | 'boolean' | 'array';
}

export interface EmailTemplate extends Document {
    name: string;
    description: string;
    category: 'Transactional' | 'Marketing' | 'Newsletter' | 'Custom';
    subject: string;
    htmlContent: string;
    plainText: string;
    variables: TemplateVariable[];
    userId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    metadata?: {
        tags?: string[];
        version?: string;
        [key: string]: any;
    };
}

const templateVariableSchema = new Schema<TemplateVariable>({
    name: { type: String, required: true },
    description: { type: String, required: true },
    defaultValue: { type: String },
    required: { type: Boolean, default: true },
    type: { 
        type: String,
        enum: ['string', 'number', 'date', 'boolean', 'array'],
        default: 'string'
    }
});

const emailTemplateSchema = new Schema<EmailTemplate>({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    description: { 
        type: String,
        required: true 
    },
    category: { 
        type: String,
        enum: ['Transactional', 'Marketing', 'Newsletter', 'Custom'],
        required: true
    },
    subject: { 
        type: String,
        required: true 
    },
    htmlContent: { 
        type: String,
        required: true 
    },
    plainText: { 
        type: String,
        required: true 
    },
    variables: [templateVariableSchema],
    userId: { 
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    metadata: {
        tags: [String],
        version: String
    }
}, {
    timestamps: true
});

// Ensure uniqueness of template names per user
emailTemplateSchema.index({ name: 1, userId: 1 }, { unique: true });

// Add search index for template discovery
emailTemplateSchema.index({ 
    name: 'text',
    description: 'text',
    'metadata.tags': 'text'
});

export const EmailTemplateModel = mongoose.model<EmailTemplate>('EmailTemplate', emailTemplateSchema);