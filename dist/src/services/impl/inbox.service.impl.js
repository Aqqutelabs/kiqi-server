"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inboxService = exports.InboxServiceImpl = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = require("../../utils/ApiError");
const Message_1 = require("../../models/Message");
const Thread_1 = require("../../models/Thread");
const mongoose_1 = __importDefault(require("mongoose"));
class InboxServiceImpl {
    /**
     * Send an email and save to database
     */
    sendMessage(userId, input) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate user ID
            if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid user ID");
            }
            // Get or create thread
            let thread;
            if (input.threadId && mongoose_1.default.Types.ObjectId.isValid(input.threadId)) {
                const found = yield Thread_1.ThreadModel.findById(input.threadId);
                if (!found) {
                    throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, "Thread not found");
                }
                thread = found;
            }
            else {
                // Create new thread
                const participants = Array.from(new Set([input.from, ...input.to, ...(input.cc || []), ...(input.bcc || [])]));
                thread = yield Thread_1.ThreadModel.create({
                    user_id: new mongoose_1.default.Types.ObjectId(userId),
                    subject: input.subject,
                    participants,
                    lastMessageAt: new Date()
                });
            }
            // Create message
            const message = yield Message_1.MessageModel.create({
                user_id: new mongoose_1.default.Types.ObjectId(userId),
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
                attachmentIds: input.attachmentIds ? input.attachmentIds.map(id => new mongoose_1.default.Types.ObjectId(id)) : []
            });
            // Update thread's last message timestamp
            yield Thread_1.ThreadModel.findByIdAndUpdate(thread._id, { lastMessageAt: new Date() });
            return message;
        });
    }
    /**
     * Get messages by folder
     */
    getMessagesByFolder(userId, folder, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const limit = (options === null || options === void 0 ? void 0 : options.limit) || 20;
            const page = (options === null || options === void 0 ? void 0 : options.page) || 1;
            const skip = (page - 1) * limit;
            if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid user ID");
            }
            const total = yield Message_1.MessageModel.countDocuments({
                user_id: new mongoose_1.default.Types.ObjectId(userId),
                folder
            });
            const messages = yield Message_1.MessageModel.find({
                user_id: new mongoose_1.default.Types.ObjectId(userId),
                folder
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('attachmentIds');
            return { messages, total };
        });
    }
    /**
     * Get starred messages
     */
    getStarredMessages(userId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const limit = (options === null || options === void 0 ? void 0 : options.limit) || 20;
            const page = (options === null || options === void 0 ? void 0 : options.page) || 1;
            const skip = (page - 1) * limit;
            if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid user ID");
            }
            const total = yield Message_1.MessageModel.countDocuments({
                user_id: new mongoose_1.default.Types.ObjectId(userId),
                isStarred: true
            });
            const messages = yield Message_1.MessageModel.find({
                user_id: new mongoose_1.default.Types.ObjectId(userId),
                isStarred: true
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('attachmentIds');
            return { messages, total };
        });
    }
    /**
     * Get messages in a thread
     */
    getThreadMessages(userId, threadId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.default.Types.ObjectId.isValid(userId) || !mongoose_1.default.Types.ObjectId.isValid(threadId)) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid user ID or thread ID");
            }
            const messages = yield Message_1.MessageModel.find({
                user_id: new mongoose_1.default.Types.ObjectId(userId),
                threadId: new mongoose_1.default.Types.ObjectId(threadId)
            })
                .sort({ createdAt: 1 })
                .populate('attachmentIds');
            return messages;
        });
    }
    /**
     * Get all threads for user
     */
    getThreads(userId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const limit = (options === null || options === void 0 ? void 0 : options.limit) || 20;
            const page = (options === null || options === void 0 ? void 0 : options.page) || 1;
            const skip = (page - 1) * limit;
            if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid user ID");
            }
            const total = yield Thread_1.ThreadModel.countDocuments({
                user_id: new mongoose_1.default.Types.ObjectId(userId)
            });
            const threads = yield Thread_1.ThreadModel.find({
                user_id: new mongoose_1.default.Types.ObjectId(userId)
            })
                .sort({ lastMessageAt: -1 })
                .skip(skip)
                .limit(limit);
            return { threads, total };
        });
    }
    /**
     * Update message (mark as read, star, move to folder, etc.)
     */
    updateMessage(userId, messageId, input) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.default.Types.ObjectId.isValid(userId) || !mongoose_1.default.Types.ObjectId.isValid(messageId)) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid user ID or message ID");
            }
            const message = yield Message_1.MessageModel.findOneAndUpdate({
                _id: new mongoose_1.default.Types.ObjectId(messageId),
                user_id: new mongoose_1.default.Types.ObjectId(userId)
            }, {
                $set: Object.assign(Object.assign(Object.assign({}, (input.isRead !== undefined && { isRead: input.isRead })), (input.isStarred !== undefined && { isStarred: input.isStarred })), (input.folder && { folder: input.folder }))
            }, { new: true }).populate('attachmentIds');
            if (!message) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, "Message not found");
            }
            return message;
        });
    }
    /**
     * Delete message (move to trash)
     */
    deleteMessage(userId, messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.default.Types.ObjectId.isValid(userId) || !mongoose_1.default.Types.ObjectId.isValid(messageId)) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid user ID or message ID");
            }
            const result = yield Message_1.MessageModel.findOneAndUpdate({
                _id: new mongoose_1.default.Types.ObjectId(messageId),
                user_id: new mongoose_1.default.Types.ObjectId(userId)
            }, { $set: { folder: 'trash' } });
            if (!result) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, "Message not found");
            }
        });
    }
    /**
     * Get inbox statistics
     */
    getInboxStats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid user ID");
            }
            const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
            const [total, unread, starred, drafts] = yield Promise.all([
                Message_1.MessageModel.countDocuments({ user_id: userObjectId, folder: { $ne: 'trash' } }),
                Message_1.MessageModel.countDocuments({ user_id: userObjectId, isRead: false, folder: { $ne: 'trash' } }),
                Message_1.MessageModel.countDocuments({ user_id: userObjectId, isStarred: true }),
                Message_1.MessageModel.countDocuments({ user_id: userObjectId, folder: 'draft' })
            ]);
            return { total, unread, starred, drafts };
        });
    }
    /**
     * Search messages
     */
    searchMessages(userId, query, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const limit = (options === null || options === void 0 ? void 0 : options.limit) || 20;
            const page = (options === null || options === void 0 ? void 0 : options.page) || 1;
            const skip = (page - 1) * limit;
            if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid user ID");
            }
            const searchFilter = {
                user_id: new mongoose_1.default.Types.ObjectId(userId),
                $or: [
                    { subject: { $regex: query, $options: 'i' } },
                    { body: { $regex: query, $options: 'i' } },
                    { from: { $regex: query, $options: 'i' } },
                    { to: { $regex: query, $options: 'i' } }
                ]
            };
            if (options === null || options === void 0 ? void 0 : options.folder) {
                searchFilter.folder = options.folder;
            }
            const total = yield Message_1.MessageModel.countDocuments(searchFilter);
            const messages = yield Message_1.MessageModel.find(searchFilter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('attachmentIds');
            return { messages, total };
        });
    }
    /**
     * Save draft message
     */
    saveDraft(userId, input) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendMessage(userId, Object.assign(Object.assign({}, input), { folder: 'draft' }));
        });
    }
    /**
     * Receive email from SendGrid Inbound Parse webhook
     */
    receiveEmail(input) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.default.Types.ObjectId.isValid(input.userId)) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid user ID");
            }
            // Extract thread ID from to address (e.g., conversation+threadId@yourapp.com)
            const threadIdMatch = input.to.match(/\+([a-f0-9]+)@/i);
            let thread;
            if (threadIdMatch && mongoose_1.default.Types.ObjectId.isValid(threadIdMatch[1])) {
                const found = yield Thread_1.ThreadModel.findById(threadIdMatch[1]);
                if (!found) {
                    throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, "Thread not found");
                }
                thread = found;
            }
            else {
                // Create new thread
                const participants = Array.from(new Set([input.from, input.to]));
                thread = yield Thread_1.ThreadModel.create({
                    user_id: new mongoose_1.default.Types.ObjectId(input.userId),
                    subject: input.subject,
                    participants,
                    lastMessageAt: new Date()
                });
            }
            if (!thread) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Failed to create or find thread");
            }
            const message = yield Message_1.MessageModel.create({
                user_id: new mongoose_1.default.Types.ObjectId(input.userId),
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
            yield Thread_1.ThreadModel.findByIdAndUpdate(thread._id, { lastMessageAt: new Date() });
            return message;
        });
    }
}
exports.InboxServiceImpl = InboxServiceImpl;
exports.inboxService = new InboxServiceImpl();
