import { StatusCodes } from "http-status-codes";
import { ApiError } from "../../utils/ApiError";
import { MessageModel, MessageDoc, MessageFolder } from "../../models/Message";
import { ThreadModel, ThreadDoc } from "../../models/Thread";
import { AttachmentModel, AttachmentDoc } from "../../models/Attachment";
import mongoose from "mongoose";

export interface CreateMessageInput {
    threadId?: string;
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    plainText: string;
    folder: MessageFolder;
    attachmentIds?: string[];
}

export interface UpdateMessageInput {
    isRead?: boolean;
    isStarred?: boolean;
    folder?: MessageFolder;
}

export interface InboxStats {
    total: number;
    unread: number;
    starred: number;
    drafts: number;
}

export class InboxServiceImpl {
    /**
     * Send an email and save to database
     */
    async sendMessage(userId: string, input: CreateMessageInput): Promise<MessageDoc> {
        // Validate user ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid user ID");
        }

        // Get or create thread
        let thread: ThreadDoc;
        if (input.threadId && mongoose.Types.ObjectId.isValid(input.threadId)) {
            const found = await ThreadModel.findById(input.threadId);
            if (!found) {
                throw new ApiError(StatusCodes.NOT_FOUND, "Thread not found");
            }
            thread = found;
        } else {
            // Create new thread
            const participants = Array.from(new Set([input.from, ...input.to, ...(input.cc || []), ...(input.bcc || [])]));
            thread = await ThreadModel.create({
                user_id: new mongoose.Types.ObjectId(userId),
                subject: input.subject,
                participants,
                lastMessageAt: new Date()
            });
        }

        // Create message
        const message = await MessageModel.create({
            user_id: new mongoose.Types.ObjectId(userId),
            threadId: thread._id,
            from: input.from.toLowerCase(),
            to: input.to.map(e => e.toLowerCase()),
            cc: (input.cc || []).map(e => e.toLowerCase()),
            bcc: (input.bcc || []).map(e => e.toLowerCase()),
            subject: input.subject,
            body: input.body,
            plainText: input.plainText,
            folder: input.folder || 'sent',
            isRead: true, // Sender always sees their own message as read
            attachmentIds: input.attachmentIds ? input.attachmentIds.map(id => new mongoose.Types.ObjectId(id)) : []
        });

        // Update thread's last message timestamp
        await ThreadModel.findByIdAndUpdate(
            thread._id,
            { lastMessageAt: new Date() }
        );

        return message;
    }

    /**
     * Get messages by folder
     */
    async getMessagesByFolder(
        userId: string,
        folder: MessageFolder,
        options?: { limit?: number; page?: number }
    ): Promise<{ messages: MessageDoc[]; total: number }> {
        const limit = options?.limit || 20;
        const page = options?.page || 1;
        const skip = (page - 1) * limit;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid user ID");
        }

        const total = await MessageModel.countDocuments({
            user_id: new mongoose.Types.ObjectId(userId),
            folder
        });

        const messages = await MessageModel.find({
            user_id: new mongoose.Types.ObjectId(userId),
            folder
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('attachmentIds');

        return { messages, total };
    }

    /**
     * Get starred messages
     */
    async getStarredMessages(
        userId: string,
        options?: { limit?: number; page?: number }
    ): Promise<{ messages: MessageDoc[]; total: number }> {
        const limit = options?.limit || 20;
        const page = options?.page || 1;
        const skip = (page - 1) * limit;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid user ID");
        }

        const total = await MessageModel.countDocuments({
            user_id: new mongoose.Types.ObjectId(userId),
            isStarred: true
        });

        const messages = await MessageModel.find({
            user_id: new mongoose.Types.ObjectId(userId),
            isStarred: true
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('attachmentIds');

        return { messages, total };
    }

    /**
     * Get messages in a thread
     */
    async getThreadMessages(userId: string, threadId: string): Promise<MessageDoc[]> {
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(threadId)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid user ID or thread ID");
        }

        const messages = await MessageModel.find({
            user_id: new mongoose.Types.ObjectId(userId),
            threadId: new mongoose.Types.ObjectId(threadId)
        })
            .sort({ createdAt: 1 })
            .populate('attachmentIds');

        return messages;
    }

    /**
     * Get all threads for user
     */
    async getThreads(
        userId: string,
        options?: { limit?: number; page?: number }
    ): Promise<{ threads: ThreadDoc[]; total: number }> {
        const limit = options?.limit || 20;
        const page = options?.page || 1;
        const skip = (page - 1) * limit;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid user ID");
        }

        const total = await ThreadModel.countDocuments({
            user_id: new mongoose.Types.ObjectId(userId)
        });

        const threads = await ThreadModel.find({
            user_id: new mongoose.Types.ObjectId(userId)
        })
            .sort({ lastMessageAt: -1 })
            .skip(skip)
            .limit(limit);

        return { threads, total };
    }

    /**
     * Update message (mark as read, star, move to folder, etc.)
     */
    async updateMessage(
        userId: string,
        messageId: string,
        input: UpdateMessageInput
    ): Promise<MessageDoc> {
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(messageId)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid user ID or message ID");
        }

        const message = await MessageModel.findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(messageId),
                user_id: new mongoose.Types.ObjectId(userId)
            },
            {
                $set: {
                    ...(input.isRead !== undefined && { isRead: input.isRead }),
                    ...(input.isStarred !== undefined && { isStarred: input.isStarred }),
                    ...(input.folder && { folder: input.folder })
                }
            },
            { new: true }
        ).populate('attachmentIds');

        if (!message) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Message not found");
        }

        return message;
    }

    /**
     * Delete message (move to trash)
     */
    async deleteMessage(userId: string, messageId: string): Promise<void> {
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(messageId)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid user ID or message ID");
        }

        const result = await MessageModel.findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(messageId),
                user_id: new mongoose.Types.ObjectId(userId)
            },
            { $set: { folder: 'trash' } }
        );

        if (!result) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Message not found");
        }
    }

    /**
     * Get inbox statistics
     */
    async getInboxStats(userId: string): Promise<InboxStats> {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid user ID");
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);

        const [total, unread, starred, drafts] = await Promise.all([
            MessageModel.countDocuments({ user_id: userObjectId, folder: { $ne: 'trash' } }),
            MessageModel.countDocuments({ user_id: userObjectId, isRead: false, folder: { $ne: 'trash' } }),
            MessageModel.countDocuments({ user_id: userObjectId, isStarred: true }),
            MessageModel.countDocuments({ user_id: userObjectId, folder: 'draft' })
        ]);

        return { total, unread, starred, drafts };
    }

    /**
     * Search messages
     */
    async searchMessages(
        userId: string,
        query: string,
        options?: { limit?: number; page?: number; folder?: MessageFolder }
    ): Promise<{ messages: MessageDoc[]; total: number }> {
        const limit = options?.limit || 20;
        const page = options?.page || 1;
        const skip = (page - 1) * limit;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid user ID");
        }

        const searchFilter: any = {
            user_id: new mongoose.Types.ObjectId(userId),
            $or: [
                { subject: { $regex: query, $options: 'i' } },
                { body: { $regex: query, $options: 'i' } },
                { from: { $regex: query, $options: 'i' } },
                { to: { $regex: query, $options: 'i' } }
            ]
        };

        if (options?.folder) {
            searchFilter.folder = options.folder;
        }

        const total = await MessageModel.countDocuments(searchFilter);

        const messages = await MessageModel.find(searchFilter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('attachmentIds');

        return { messages, total };
    }

    /**
     * Save draft message
     */
    async saveDraft(userId: string, input: CreateMessageInput): Promise<MessageDoc> {
        return this.sendMessage(userId, { ...input, folder: 'draft' });
    }

    /**
     * Receive email from SendGrid Inbound Parse webhook
     */
    async receiveEmail(input: {
        from: string;
        to: string;
        subject: string;
        text: string;
        html: string;
        userId: string;
    }): Promise<MessageDoc> {
        if (!mongoose.Types.ObjectId.isValid(input.userId)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid user ID");
        }

        // Extract thread ID from to address (e.g., conversation+threadId@yourapp.com)
        const threadIdMatch = input.to.match(/\+([a-f0-9]+)@/i);
        let thread: ThreadDoc | null;

        if (threadIdMatch && mongoose.Types.ObjectId.isValid(threadIdMatch[1])) {
            const found = await ThreadModel.findById(threadIdMatch[1]);
            if (!found) {
                throw new ApiError(StatusCodes.NOT_FOUND, "Thread not found");
            }
            thread = found;
        } else {
            // Create new thread
            const participants = Array.from(new Set([input.from, input.to]));
            thread = await ThreadModel.create({
                user_id: new mongoose.Types.ObjectId(input.userId),
                subject: input.subject,
                participants,
                lastMessageAt: new Date()
            });
        }

        if (!thread) {
            throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to create or find thread");
        }

        const message = await MessageModel.create({
            user_id: new mongoose.Types.ObjectId(input.userId),
            threadId: thread._id,
            from: input.from.toLowerCase(),
            to: [input.to.toLowerCase()],
            subject: input.subject,
            body: input.html || input.text,
            plainText: input.text,
            folder: 'inbox',
            isRead: false
        });

        // Update thread's last message timestamp
        await ThreadModel.findByIdAndUpdate(
            thread._id,
            { lastMessageAt: new Date() }
        );

        return message;
    }
}

export const inboxService = new InboxServiceImpl();
