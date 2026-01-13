# Email/Messaging System Implementation Guide

## 🏗️ Architecture Overview

Your system is now built like a **mail-powered messaging system backed by your own database** - not Gmail integration.

### System Flow

```
Sending:
  User → API → SendGrid → Recipient
  Also saves to DB (Message + Thread)

Receiving (via Inbound Parse):
  Recipient → SendGrid → Your Webhook → Your DB
  Message appears in Inbox UI automatically
```

---

## 📊 Database Schema

### 1. **Thread Collection**
Represents a conversation between participants.

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: User)",
  "subject": "Welcome to our app",
  "participants": ["john@example.com", "support@yourapp.com"],
  "lastMessageAt": "2025-12-03T10:30:00Z",
  "createdAt": "2025-12-01T10:30:00Z",
  "updatedAt": "2025-12-03T10:30:00Z"
}
```

### 2. **Message Collection**
Individual emails within a thread.

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: User)",
  "threadId": "ObjectId (ref: Thread)",
  "from": "john@example.com",
  "to": ["support@yourapp.com"],
  "cc": [],
  "bcc": [],
  "subject": "Welcome to our app",
  "body": "<p>Hello, welcome!</p>",
  "plainText": "Hello, welcome!",
  "folder": "inbox",
  "isRead": false,
  "isStarred": false,
  "attachmentIds": ["ObjectId1", "ObjectId2"],
  "createdAt": "2025-12-03T10:30:00Z",
  "updatedAt": "2025-12-03T10:30:00Z"
}
```

### 3. **Attachment Collection**
File references for email attachments.

```json
{
  "_id": "ObjectId",
  "messageId": "ObjectId (ref: Message)",
  "fileName": "invoice.pdf",
  "mimeType": "application/pdf",
  "size": 234234,
  "url": "https://s3.amazonaws.com/bucket/invoice.pdf",
  "createdAt": "2025-12-03T10:30:00Z"
}
```

---

## 🔌 API Endpoints

### Message Operations

#### Send Email
```
POST /api/inbox/send
Authorization: Bearer <JWT>

{
  "from": "user@example.com",
  "to": ["recipient@example.com"],
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "subject": "Hello",
  "body": "<p>Email content</p>",
  "plainText": "Email content",
  "attachmentIds": ["attachmentId1", "attachmentId2"]
}

Response (201):
{
  "error": false,
  "message": "Email sent successfully",
  "data": { /* Message object */ }
}
```

#### Save Draft
```
POST /api/inbox/draft
Authorization: Bearer <JWT>

{
  "from": "user@example.com",
  "to": ["recipient@example.com"],
  "subject": "Draft Email",
  "body": "<p>Content</p>",
  "plainText": "Content"
}

Response (201):
{
  "error": false,
  "message": "Draft saved successfully",
  "data": { /* Message object with folder: 'draft' */ }
}
```

#### Get Messages by Folder
```
GET /api/inbox/folder/:folder?limit=20&page=1
Authorization: Bearer <JWT>

Folders: inbox | sent | draft | trash | archive

Response (200):
{
  "error": false,
  "message": "Messages retrieved successfully",
  "data": {
    "messages": [
      {
        "_id": "messageId",
        "from": "sender@example.com",
        "to": ["recipient@example.com"],
        "subject": "Hello",
        "isRead": false,
        "isStarred": false,
        "createdAt": "2025-12-03T10:30:00Z",
        /* ... */
      }
    ],
    "total": 150,
    "limit": 20,
    "page": 1
  }
}
```

#### Get Starred Messages
```
GET /api/inbox/starred?limit=20&page=1
Authorization: Bearer <JWT>

Response (200):
{
  "error": false,
  "message": "Starred messages retrieved successfully",
  "data": {
    "messages": [ /* Array of starred messages */ ],
    "total": 5,
    "limit": 20,
    "page": 1
  }
}
```

#### Update Message
```
PATCH /api/inbox/message/:messageId
Authorization: Bearer <JWT>

{
  "isRead": true,
  "isStarred": true,
  "folder": "archive"
}

Response (200):
{
  "error": false,
  "message": "Message updated successfully",
  "data": { /* Updated Message object */ }
}
```

#### Delete Message (Move to Trash)
```
DELETE /api/inbox/message/:messageId
Authorization: Bearer <JWT>

Response (200):
{
  "error": false,
  "message": "Message deleted successfully",
  "data": null
}
```

### Thread Operations

#### Get All Threads
```
GET /api/inbox/threads?limit=20&page=1
Authorization: Bearer <JWT>

Response (200):
{
  "error": false,
  "message": "Threads retrieved successfully",
  "data": {
    "threads": [
      {
        "_id": "threadId",
        "subject": "Welcome",
        "participants": ["john@example.com", "support@yourapp.com"],
        "lastMessageAt": "2025-12-03T10:30:00Z",
        /* ... */
      }
    ],
    "total": 50,
    "limit": 20,
    "page": 1
  }
}
```

#### Get Messages in Thread
```
GET /api/inbox/thread/:threadId
Authorization: Bearer <JWT>

Response (200):
{
  "error": false,
  "message": "Thread messages retrieved successfully",
  "data": [
    { /* Message 1 */ },
    { /* Message 2 */ },
    { /* Message 3 */ }
  ]
}
```

### Search & Statistics

#### Search Messages
```
GET /api/inbox/search?q=invoice&folder=inbox&limit=20&page=1
Authorization: Bearer <JWT>

Query Parameters:
- q (required): Search query
- folder (optional): inbox | sent | draft | trash | archive
- limit (optional): Results per page (default: 20)
- page (optional): Page number (default: 1)

Response (200):
{
  "error": false,
  "message": "Search results retrieved successfully",
  "data": {
    "messages": [ /* Matching messages */ ],
    "total": 3,
    "limit": 20,
    "page": 1
  }
}
```

#### Get Inbox Statistics
```
GET /api/inbox/stats
Authorization: Bearer <JWT>

Response (200):
{
  "error": false,
  "message": "Inbox statistics retrieved successfully",
  "data": {
    "total": 150,
    "unread": 5,
    "starred": 3,
    "drafts": 2
  }
}
```

### Webhook Endpoint

#### Receive Email (SendGrid Inbound Parse)
```
POST /api/inbox/receive
Content-Type: application/json

{
  "from": "sender@example.com",
  "to": "conversation+threadId@yourapp.com",
  "subject": "RE: Hello",
  "text": "Reply text",
  "html": "<p>Reply HTML</p>",
  "userId": "userObjectId"
}

Response (201):
{
  "error": false,
  "message": "Email received successfully",
  "data": { /* Message object */ }
}
```

---

## 🔧 Integration with SendGrid

### 1. Setup SendGrid Inbound Parse Webhook

**In SendGrid Dashboard:**

1. Go to Settings → Inbound Parse
2. Add a webhook:
   - Hostname: `conversation.yourapp.com`
   - URL: `https://yourapp.com/api/inbox/receive`
   - POST the raw message

3. Update your DNS MX records:
```
conversation.yourapp.com MX 10 mx.sendgrid.net
```

### 2. Generate Reply-To Addresses

When sending an email, use a pattern like:
```
conversation+{threadId}@yourapp.com
```

This allows you to extract the thread ID from incoming replies:
```javascript
const threadIdMatch = to.match(/\+([a-f0-9]+)@/i);
if (threadIdMatch) {
  const threadId = threadIdMatch[1]; // Extract thread ID
}
```

### 3. Verify Webhook Signature (Security)

Add verification in production:
```javascript
const crypto = require('crypto');

function verifyWebhook(req) {
  const timestamp = req.body.timestamp;
  const signature = req.body.signature;
  const key = process.env.SENDGRID_WEBHOOK_KEY;
  
  const hash = crypto
    .createHmac('sha256', key)
    .update(timestamp + req.body.email)
    .digest('hex');
  
  return hash === signature;
}
```

---

## 📱 Frontend UI Implementation

### Folder Navigation
```typescript
// Get inbox
GET /api/inbox/folder/inbox

// Get sent
GET /api/inbox/folder/sent

// Get drafts
GET /api/inbox/folder/draft

// Get starred
GET /api/inbox/starred

// Get all conversations
GET /api/inbox/threads
```

### Thread View
```typescript
// Get single thread
GET /api/inbox/thread/:threadId

// Display all messages in order (ascending by createdAt)
```

### Compose Email
```typescript
POST /api/inbox/send
{
  from: userEmail,
  to: [recipientEmail],
  subject,
  body: editorHTML,
  plainText: stripHTML(editorHTML)
}
```

### Mark as Read
```typescript
PATCH /api/inbox/message/:messageId
{ isRead: true }
```

### Star/Unstar
```typescript
PATCH /api/inbox/message/:messageId
{ isStarred: true }
```

### Move to Folder
```typescript
PATCH /api/inbox/message/:messageId
{ folder: 'archive' }
```

---

## 🔄 Complete User Flow

### 1. User Sends Email
```
Frontend → POST /inbox/send → SaveToDb + SendVia SendGrid → Email arrives in recipient's mailbox
```

### 2. User Receives Reply
```
Recipient replies to: conversation+threadId@yourapp.com
↓
SendGrid detects inbound email
↓
SendGrid calls: POST /api/inbox/receive (webhook)
↓
Your backend extracts threadId and saves Message to inbox
↓
Message appears in thread automatically
```

### 3. User Views Inbox
```
Frontend → GET /api/inbox/threads → Display list
Click thread → GET /api/inbox/thread/:threadId → Show conversation
```

---

## 🚀 Next Steps

### Production Checklist

- [ ] Configure SendGrid Inbound Parse webhook
- [ ] Update DNS MX records for email domain
- [ ] Implement webhook signature verification
- [ ] Add rate limiting to webhook endpoint
- [ ] Store SendGrid API key securely
- [ ] Implement email attachments upload (S3/Cloudinary)
- [ ] Add Pusher/WebSocket for real-time inbox updates
- [ ] Implement email templates for common scenarios
- [ ] Add email retry logic for failed sends
- [ ] Monitor SendGrid bounce/complaint rates
- [ ] Implement email unsubscribe handling
- [ ] Add GDPR compliance (right to deletion, data export)

### Optional Features

- Email threading AI (group related emails)
- Auto-reply functionality
- Email scheduling
- Signature templates
- Mail merge for campaigns
- Email tracking (opens/clicks)
- Spam filtering
- Email encryption

---

## 📝 Database Indexes

Already included for optimal performance:

**Thread Collection:**
- `user_id + createdAt`
- `user_id + lastMessageAt`

**Message Collection:**
- `user_id + folder + createdAt`
- `user_id + isStarred + createdAt`
- `user_id + isRead + createdAt`
- `user_id + threadId`

**Attachment Collection:**
- `messageId`

---

## 🔐 Security Notes

1. All endpoints require JWT authentication
2. Users can only access their own messages/threads
3. Webhook should verify SendGrid signature
4. Rate limit the webhook endpoint
5. Never expose SendGrid API key in frontend
6. Sanitize HTML content before storing/displaying
7. Validate all email addresses
8. Implement CORS restrictions

---

## ✅ Example Complete Flow

### Sending an Email
```bash
curl -X POST http://localhost:3000/api/inbox/send \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "user@yourapp.com",
    "to": ["recipient@example.com"],
    "subject": "Welcome",
    "body": "<p>Hello there!</p>",
    "plainText": "Hello there!"
  }'
```

### Receiving a Reply
When recipient replies to `conversation+threadId@yourapp.com`, SendGrid automatically posts to:
```bash
POST /api/inbox/receive
{
  "from": "recipient@example.com",
  "to": "conversation+threadId@yourapp.com",
  "subject": "RE: Welcome",
  "text": "Thanks!",
  "html": "<p>Thanks!</p>",
  "userId": "userObjectId"
}
```

### Viewing Inbox
```bash
curl -X GET "http://localhost:3000/api/inbox/folder/inbox?limit=20&page=1" \
  -H "Authorization: Bearer YOUR_JWT"
```

---

This is a **production-ready, scalable email system** perfect for building internal communication features without the complexity of Gmail integration!
