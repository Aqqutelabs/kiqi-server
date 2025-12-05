import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/AsyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { inboxService } from "../services/impl/inbox.service.impl";
import { MessageFolder } from "../models/Message";

export class InboxController {
    /**
     * Send an email
     * POST /inbox/send
     */
    public sendMessage = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?._id;
        if (!userId) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
        }

        const { from, to, cc, bcc, subject, body, plainText, attachmentIds } = req.body;

        if (!from || !to || !subject || !body || !plainText) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Missing required fields: from, to, subject, body, plainText");
        }

        if (!Array.isArray(to) || to.length === 0) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "To field must be a non-empty array of emails");
        }

        const message = await inboxService.sendMessage(userId, {
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

        res.status(StatusCodes.CREATED).json(
            new ApiResponse(StatusCodes.CREATED, message, "Email sent successfully")
        );
    });

    /**
     * Get messages by folder
     * GET /inbox/folder/:folder
     */
    public getMessagesByFolder = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?._id;
        if (!userId) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
        }

        const { folder } = req.params;
        const { limit, page } = req.query;

        const validFolders: MessageFolder[] = ['inbox', 'sent', 'draft', 'trash', 'archive'];
        if (!validFolders.includes(folder as MessageFolder)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid folder. Must be one of: ${validFolders.join(', ')}`);
        }

        const { messages, total } = await inboxService.getMessagesByFolder(
            userId,
            folder as MessageFolder,
            {
                limit: Number(limit) || 20,
                page: Number(page) || 1
            }
        );

        res.status(StatusCodes.OK).json(
            new ApiResponse(StatusCodes.OK, { messages, total, limit: Number(limit) || 20, page: Number(page) || 1 }, "Messages retrieved successfully")
        );
    });

    /**
     * Get starred messages
     * GET /inbox/starred
     */
    public getStarredMessages = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?._id;
        if (!userId) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
        }

        const { limit, page } = req.query;

        const { messages, total } = await inboxService.getStarredMessages(
            userId,
            {
                limit: Number(limit) || 20,
                page: Number(page) || 1
            }
        );

        res.status(StatusCodes.OK).json(
            new ApiResponse(StatusCodes.OK, { messages, total, limit: Number(limit) || 20, page: Number(page) || 1 }, "Starred messages retrieved successfully")
        );
    });

    /**
     * Get all threads
     * GET /inbox/threads
     */
    public getThreads = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?._id;
        if (!userId) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
        }

        const { limit, page } = req.query;

        const { threads, total } = await inboxService.getThreads(
            userId,
            {
                limit: Number(limit) || 20,
                page: Number(page) || 1
            }
        );

        res.status(StatusCodes.OK).json(
            new ApiResponse(StatusCodes.OK, { threads, total, limit: Number(limit) || 20, page: Number(page) || 1 }, "Threads retrieved successfully")
        );
    });

    /**
     * Get messages in a thread
     * GET /inbox/thread/:threadId
     */
    public getThreadMessages = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?._id;
        if (!userId) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
        }

        const { threadId } = req.params;

        const messages = await inboxService.getThreadMessages(userId, threadId);

        res.status(StatusCodes.OK).json(
            new ApiResponse(StatusCodes.OK, messages, "Thread messages retrieved successfully")
        );
    });

    /**
     * Update message (mark as read, star, move to folder)
     * PATCH /inbox/message/:messageId
     */
    public updateMessage = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?._id;
        if (!userId) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
        }

        const { messageId } = req.params;
        const { isRead, isStarred, folder } = req.body;

        const message = await inboxService.updateMessage(userId, messageId, {
            isRead,
            isStarred,
            folder
        });

        res.status(StatusCodes.OK).json(
            new ApiResponse(StatusCodes.OK, message, "Message updated successfully")
        );
    });

    /**
     * Delete message (move to trash)
     * DELETE /inbox/message/:messageId
     */
    public deleteMessage = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?._id;
        if (!userId) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
        }

        const { messageId } = req.params;

        await inboxService.deleteMessage(userId, messageId);

        res.status(StatusCodes.OK).json(
            new ApiResponse(StatusCodes.OK, null, "Message deleted successfully")
        );
    });

    /**
     * Get inbox statistics
     * GET /inbox/stats
     */
    public getInboxStats = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?._id;
        if (!userId) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
        }

        const stats = await inboxService.getInboxStats(userId);

        res.status(StatusCodes.OK).json(
            new ApiResponse(StatusCodes.OK, stats, "Inbox statistics retrieved successfully")
        );
    });

    /**
     * Search messages
     * GET /inbox/search
     */
    public searchMessages = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?._id;
        if (!userId) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
        }

        const { q, folder, limit, page } = req.query;

        if (!q || typeof q !== 'string') {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Search query (q) is required");
        }

        const { messages, total } = await inboxService.searchMessages(
            userId,
            q,
            {
                limit: Number(limit) || 20,
                page: Number(page) || 1,
                folder: folder as MessageFolder
            }
        );

        res.status(StatusCodes.OK).json(
            new ApiResponse(StatusCodes.OK, { messages, total, limit: Number(limit) || 20, page: Number(page) || 1 }, "Search results retrieved successfully")
        );
    });

    /**
     * Save draft message
     * POST /inbox/draft
     */
    public saveDraft = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?._id;
        if (!userId) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
        }

        const { from, to, cc, bcc, subject, body, plainText, attachmentIds } = req.body;

        if (!from || !to || !subject || !body || !plainText) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Missing required fields: from, to, subject, body, plainText");
        }

        const draft = await inboxService.saveDraft(userId, {
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

        res.status(StatusCodes.CREATED).json(
            new ApiResponse(StatusCodes.CREATED, draft, "Draft saved successfully")
        );
    });

    /**
     * Receive email from SendGrid Inbound Parse webhook
     * POST /inbox/receive (public endpoint - should validate SendGrid token)
     */
    public receiveEmail = asyncHandler(async (req: Request, res: Response) => {
        // TODO: Verify SendGrid webhook signature

        const { from, to, subject, text, html, userId } = req.body;

        if (!from || !to || !subject || !userId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Missing required fields: from, to, subject, userId");
        }

        const message = await inboxService.receiveEmail({
            from,
            to,
            subject,
            text: text || '',
            html: html || '',
            userId
        });

        res.status(StatusCodes.CREATED).json(
            new ApiResponse(StatusCodes.CREATED, message, "Email received successfully")
        );
    });
}

export const inboxController = new InboxController();
