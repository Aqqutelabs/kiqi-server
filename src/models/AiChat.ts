import mongoose, { Schema } from "mongoose";

export interface AiChat extends Document{
    _id: string;
    sessionId: string;
    message: string;
}

const AiChatSchema: Schema = new Schema<AiChat>({
    sessionId: { type: String, required: true },
    message: { type: String, required: true }
})

export const AiChatModel = mongoose.model<AiChat>("ai-chat", AiChatSchema)