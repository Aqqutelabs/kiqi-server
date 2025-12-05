import { Router } from 'express';
import { verifyJWT } from '../middlewares/Auth.middlewares';
import { inboxController } from '../controllers/inbox.controller';

const inboxRoute = Router();

// All routes protected by JWT authentication
inboxRoute.use(verifyJWT);

/**
 * Message Operations
 */

// Send an email
inboxRoute.post('/send', inboxController.sendMessage);

// Save draft
inboxRoute.post('/draft', inboxController.saveDraft);

// Get messages by folder (inbox, sent, draft, trash, archive)
inboxRoute.get('/folder/:folder', inboxController.getMessagesByFolder);

// Get starred messages
inboxRoute.get('/starred', inboxController.getStarredMessages);

// Update message (mark as read, star, move to folder)
inboxRoute.patch('/message/:messageId', inboxController.updateMessage);

// Delete message (move to trash)
inboxRoute.delete('/message/:messageId', inboxController.deleteMessage);

/**
 * Thread Operations
 */

// Get all threads
inboxRoute.get('/threads', inboxController.getThreads);

// Get messages in a specific thread
inboxRoute.get('/thread/:threadId', inboxController.getThreadMessages);

/**
 * Search & Statistics
 */

// Search messages
inboxRoute.get('/search', inboxController.searchMessages);

// Get inbox statistics
inboxRoute.get('/stats', inboxController.getInboxStats);

/**
 * Webhooks (Public endpoints - should be protected in production)
 */

// Receive email from SendGrid Inbound Parse webhook
// Note: In production, this should validate SendGrid webhook signature
inboxRoute.post('/receive', inboxController.receiveEmail);

export default inboxRoute;
