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
Object.defineProperty(exports, "__esModule", { value: true });
exports.inboxController = exports.InboxController = void 0;
const http_status_codes_1 = require("http-status-codes");
const AsyncHandler_1 = require("../utils/AsyncHandler");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const inbox_service_impl_1 = require("../services/impl/inbox.service.impl");
class InboxController {
    constructor() {
        /**
         * Send an email
         * POST /inbox/send
         */
        this.sendMessage = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            if (!userId) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not authenticated");
            }
            const { from, to, cc, bcc, subject, body, plainText, attachmentIds } = req.body;
            if (!from || !to || !subject || !body || !plainText) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Missing required fields: from, to, subject, body, plainText");
            }
            if (!Array.isArray(to) || to.length === 0) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "To field must be a non-empty array of emails");
            }
            const message = yield inbox_service_impl_1.inboxService.sendMessage(userId, {
                from,
                to,
                cc: cc || [],
                bcc: bcc || [],
                subject,
                body,
                plainText,
                folder: 'sent',
                attachmentIds
            });
            res.status(http_status_codes_1.StatusCodes.CREATED).json(new ApiResponse_1.ApiResponse(http_status_codes_1.StatusCodes.CREATED, message, "Email sent successfully"));
        }));
        /**
         * Get messages by folder
         * GET /inbox/folder/:folder
         */
        this.getMessagesByFolder = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            if (!userId) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not authenticated");
            }
            const { folder } = req.params;
            const { limit, page } = req.query;
            const validFolders = ['inbox', 'sent', 'draft', 'trash', 'archive'];
            if (!validFolders.includes(folder)) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid folder. Must be one of: ${validFolders.join(', ')}`);
            }
            const { messages, total } = yield inbox_service_impl_1.inboxService.getMessagesByFolder(userId, folder, {
                limit: Number(limit) || 20,
                page: Number(page) || 1
            });
            res.status(http_status_codes_1.StatusCodes.OK).json(new ApiResponse_1.ApiResponse(http_status_codes_1.StatusCodes.OK, { messages, total, limit: Number(limit) || 20, page: Number(page) || 1 }, "Messages retrieved successfully"));
        }));
        /**
         * Get starred messages
         * GET /inbox/starred
         */
        this.getStarredMessages = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            if (!userId) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not authenticated");
            }
            const { limit, page } = req.query;
            const { messages, total } = yield inbox_service_impl_1.inboxService.getStarredMessages(userId, {
                limit: Number(limit) || 20,
                page: Number(page) || 1
            });
            res.status(http_status_codes_1.StatusCodes.OK).json(new ApiResponse_1.ApiResponse(http_status_codes_1.StatusCodes.OK, { messages, total, limit: Number(limit) || 20, page: Number(page) || 1 }, "Starred messages retrieved successfully"));
        }));
        /**
         * Get all threads
         * GET /inbox/threads
         */
        this.getThreads = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            if (!userId) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not authenticated");
            }
            const { limit, page } = req.query;
            const { threads, total } = yield inbox_service_impl_1.inboxService.getThreads(userId, {
                limit: Number(limit) || 20,
                page: Number(page) || 1
            });
            res.status(http_status_codes_1.StatusCodes.OK).json(new ApiResponse_1.ApiResponse(http_status_codes_1.StatusCodes.OK, { threads, total, limit: Number(limit) || 20, page: Number(page) || 1 }, "Threads retrieved successfully"));
        }));
        /**
         * Get messages in a thread
         * GET /inbox/thread/:threadId
         */
        this.getThreadMessages = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            if (!userId) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not authenticated");
            }
            const { threadId } = req.params;
            const messages = yield inbox_service_impl_1.inboxService.getThreadMessages(userId, threadId);
            res.status(http_status_codes_1.StatusCodes.OK).json(new ApiResponse_1.ApiResponse(http_status_codes_1.StatusCodes.OK, messages, "Thread messages retrieved successfully"));
        }));
        /**
         * Update message (mark as read, star, move to folder)
         * PATCH /inbox/message/:messageId
         */
        this.updateMessage = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            if (!userId) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not authenticated");
            }
            const { messageId } = req.params;
            const { isRead, isStarred, folder } = req.body;
            const message = yield inbox_service_impl_1.inboxService.updateMessage(userId, messageId, {
                isRead,
                isStarred,
                folder
            });
            res.status(http_status_codes_1.StatusCodes.OK).json(new ApiResponse_1.ApiResponse(http_status_codes_1.StatusCodes.OK, message, "Message updated successfully"));
        }));
        /**
         * Delete message (move to trash)
         * DELETE /inbox/message/:messageId
         */
        this.deleteMessage = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            if (!userId) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not authenticated");
            }
            const { messageId } = req.params;
            yield inbox_service_impl_1.inboxService.deleteMessage(userId, messageId);
            res.status(http_status_codes_1.StatusCodes.OK).json(new ApiResponse_1.ApiResponse(http_status_codes_1.StatusCodes.OK, null, "Message deleted successfully"));
        }));
        /**
         * Get inbox statistics
         * GET /inbox/stats
         */
        this.getInboxStats = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            if (!userId) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not authenticated");
            }
            const stats = yield inbox_service_impl_1.inboxService.getInboxStats(userId);
            res.status(http_status_codes_1.StatusCodes.OK).json(new ApiResponse_1.ApiResponse(http_status_codes_1.StatusCodes.OK, stats, "Inbox statistics retrieved successfully"));
        }));
        /**
         * Search messages
         * GET /inbox/search
         */
        this.searchMessages = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            if (!userId) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not authenticated");
            }
            const { q, folder, limit, page } = req.query;
            if (!q || typeof q !== 'string') {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Search query (q) is required");
            }
            const { messages, total } = yield inbox_service_impl_1.inboxService.searchMessages(userId, q, {
                limit: Number(limit) || 20,
                page: Number(page) || 1,
                folder: folder
            });
            res.status(http_status_codes_1.StatusCodes.OK).json(new ApiResponse_1.ApiResponse(http_status_codes_1.StatusCodes.OK, { messages, total, limit: Number(limit) || 20, page: Number(page) || 1 }, "Search results retrieved successfully"));
        }));
        /**
         * Save draft message
         * POST /inbox/draft
         */
        this.saveDraft = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            if (!userId) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not authenticated");
            }
            const { from, to, cc, bcc, subject, body, plainText, attachmentIds } = req.body;
            if (!from || !to || !subject || !body || !plainText) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Missing required fields: from, to, subject, body, plainText");
            }
            const draft = yield inbox_service_impl_1.inboxService.saveDraft(userId, {
                from,
                to,
                cc: cc || [],
                bcc: bcc || [],
                subject,
                body,
                plainText,
                folder: 'draft',
                attachmentIds
            });
            res.status(http_status_codes_1.StatusCodes.CREATED).json(new ApiResponse_1.ApiResponse(http_status_codes_1.StatusCodes.CREATED, draft, "Draft saved successfully"));
        }));
        /**
         * Receive email from SendGrid Inbound Parse webhook
         * POST /inbox/receive (public endpoint - should validate SendGrid token)
         */
        this.receiveEmail = (0, AsyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            // TODO: Verify SendGrid webhook signature
            const { from, to, subject, text, html, userId } = req.body;
            if (!from || !to || !subject || !userId) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Missing required fields: from, to, subject, userId");
            }
            const message = yield inbox_service_impl_1.inboxService.receiveEmail({
                from,
                to,
                subject,
                text: text || '',
                html: html || '',
                userId
            });
            res.status(http_status_codes_1.StatusCodes.CREATED).json(new ApiResponse_1.ApiResponse(http_status_codes_1.StatusCodes.CREATED, message, "Email received successfully"));
        }));
    }
}
exports.InboxController = InboxController;
exports.inboxController = new InboxController();
