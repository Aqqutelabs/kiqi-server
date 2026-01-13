# Email/Messaging System - Quick Reference

## 📂 Files Created

| File | Purpose |
|------|---------|
| `src/models/Thread.ts` | Thread schema - represents email conversations |
| `src/models/Message.ts` | Message schema - individual emails with folders |
| `src/models/Attachment.ts` | Attachment schema - file references |
| `src/services/impl/inbox.service.impl.ts` | Business logic for inbox operations |
| `src/controllers/inbox.controller.ts` | HTTP request handlers |
| `src/routes/inbox.route.ts` | Express routes |

## 🚀 Quick Start

### 1. Add Route to Main Server

In your `server.ts` or `index.ts`:

```typescript
import inboxRoute from './routes/inbox.route';

// Add to your Express app
app.use('/api/inbox', inboxRoute);
```

### 2. Send an Email

```bash
POST /api/inbox/send
{
  "from": "sender@yourapp.com",
  "to": ["recipient@example.com"],
  "subject": "Hello",
  "body": "<p>Email HTML</p>",
  "plainText": "Email text"
}
```

### 3. Get Inbox

```bash
GET /api/inbox/folder/inbox?limit=20&page=1
```

### 4. Mark as Read

```bash
PATCH /api/inbox/message/:messageId
{
  "isRead": true
}
```

---

## 📊 Key Features

✅ **Folder Management**
- inbox, sent, draft, trash, archive

✅ **Message Actions**
- Mark as read/unread
- Star/unstar
- Move between folders
- Delete (soft delete to trash)

✅ **Thread Conversations**
- Group related messages
- Track participants
- Maintain conversation history

✅ **Search & Filter**
- Search by subject, body, from, to
- Filter by folder
- Pagination support

✅ **Statistics**
- Total messages
- Unread count
- Starred count
- Draft count

✅ **SendGrid Integration**
- Send via SendGrid
- Receive via Inbound Parse webhook
- Auto-thread incoming replies

---

## 🔗 Database Relationships

```
User (1) ──── (Many) Thread
              ↓
           (Many) Message
              ↓
           (Many) Attachment
```

---

## 📝 API Reference Table

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/inbox/send` | Send email |
| POST | `/inbox/draft` | Save draft |
| GET | `/inbox/folder/:folder` | Get messages in folder |
| GET | `/inbox/starred` | Get starred messages |
| PATCH | `/inbox/message/:id` | Update message |
| DELETE | `/inbox/message/:id` | Delete message |
| GET | `/inbox/threads` | Get all threads |
| GET | `/inbox/thread/:id` | Get thread messages |
| GET | `/inbox/search` | Search messages |
| GET | `/inbox/stats` | Get inbox stats |
| POST | `/inbox/receive` | Webhook for incoming emails |

---

## 💡 Best Practices

### Frontend Integration

```typescript
// Get unread count for notification badge
const stats = await fetch('/api/inbox/stats', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

console.log(`${stats.data.unread} unread emails`);
```

### Sending with Attachments

```typescript
// First upload file to S3/Cloudinary
const fileUrl = await uploadFile(file);

// Create attachment record
const attachment = await createAttachment({
  messageId: messageId,
  fileName: file.name,
  mimeType: file.type,
  size: file.size,
  url: fileUrl
});

// Reference in message
await sendMessage({
  to: ['recipient@example.com'],
  attachmentIds: [attachment._id]
});
```

### Real-time Updates

```typescript
// Use Socket.io or Pusher for real-time inbox sync
socket.on('new-message', (message) => {
  updateInboxUI(message);
  updateStats();
});
```

---

## 🔐 Security Checklist

- [ ] JWT authentication on all endpoints
- [ ] User ID validation on all requests
- [ ] Webhook signature verification
- [ ] HTML sanitization on message body
- [ ] Email address validation
- [ ] Rate limiting on webhook
- [ ] CORS configuration

---

## 🐛 Testing

### Test Sending
```bash
curl -X POST http://localhost:3000/api/inbox/send \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@yourapp.com",
    "to": ["test@example.com"],
    "subject": "Test",
    "body": "<p>Test email</p>",
    "plainText": "Test email"
  }'
```

### Test Receiving (Webhook)
```bash
curl -X POST http://localhost:3000/api/inbox/receive \
  -H "Content-Type: application/json" \
  -d '{
    "from": "sender@example.com",
    "to": "conversation+60d5ec49c1a2b3c4d5e6f7a8@yourapp.com",
    "subject": "RE: Test",
    "text": "Reply text",
    "html": "<p>Reply HTML</p>",
    "userId": "YOUR_USER_OBJECT_ID"
  }'
```

---

## 🎯 Next: Frontend Components

You'll want to build:

1. **Inbox List View** - Display threads/messages in folders
2. **Message Composer** - Send/draft emails
3. **Thread View** - Show conversation
4. **Search Box** - Search messages
5. **Notification Badge** - Show unread count
6. **Attachment Preview** - Display file attachments

---

## 📚 Documentation Files

- `EMAIL_MESSAGING_SYSTEM.md` - Comprehensive guide with all details
- This file - Quick reference

---

**Ready to go!** Add the route to your main server and start using the API. 🚀
