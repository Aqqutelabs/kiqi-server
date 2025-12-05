"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const inbox_controller_1 = require("../controllers/inbox.controller");
const inboxRoute = (0, express_1.Router)();
// All routes protected by JWT authentication
inboxRoute.use(Auth_middlewares_1.verifyJWT);
/**
 * Message Operations
 */
// Send an email
inboxRoute.post('/send', inbox_controller_1.inboxController.sendMessage);
// Save draft
inboxRoute.post('/draft', inbox_controller_1.inboxController.saveDraft);
// Get messages by folder (inbox, sent, draft, trash, archive)
inboxRoute.get('/folder/:folder', inbox_controller_1.inboxController.getMessagesByFolder);
// Get starred messages
inboxRoute.get('/starred', inbox_controller_1.inboxController.getStarredMessages);
// Update message (mark as read, star, move to folder)
inboxRoute.patch('/message/:messageId', inbox_controller_1.inboxController.updateMessage);
// Delete message (move to trash)
inboxRoute.delete('/message/:messageId', inbox_controller_1.inboxController.deleteMessage);
/**
 * Thread Operations
 */
// Get all threads
inboxRoute.get('/threads', inbox_controller_1.inboxController.getThreads);
// Get messages in a specific thread
inboxRoute.get('/thread/:threadId', inbox_controller_1.inboxController.getThreadMessages);
/**
 * Search & Statistics
 */
// Search messages
inboxRoute.get('/search', inbox_controller_1.inboxController.searchMessages);
// Get inbox statistics
inboxRoute.get('/stats', inbox_controller_1.inboxController.getInboxStats);
/**
 * Webhooks (Public endpoints - should be protected in production)
 */
// Receive email from SendGrid Inbound Parse webhook
// Note: In production, this should validate SendGrid webhook signature
inboxRoute.post('/receive', inbox_controller_1.inboxController.receiveEmail);
exports.default = inboxRoute;
