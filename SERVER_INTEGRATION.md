# Server Integration Instructions

## 📌 How to Add Inbox Routes to Your Server

### Step 1: Import the Route

In your main `server.ts` file (or wherever you initialize Express):

```typescript
import inboxRoute from './src/routes/inbox.route';
```

### Step 2: Register the Route

Add this after your other API routes:

```typescript
// Email/Messaging System
app.use('/api/inbox', inboxRoute);
```

**Example full server setup:**

```typescript
import express from 'express';
import { verifyJWT } from './src/middlewares/Auth.middlewares';

// Import all routes
import authRoutes from './src/routes/auth.route';
import campaignRoute from './src/routes/campaign.route';
import emailListRoute from './src/routes/emailList.route';
import inboxRoute from './src/routes/inbox.route';
import walletRoute from './src/routes/wallet.routes';
// ... other routes

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoute);
app.use('/api/email-lists', emailListRoute);
app.use('/api/inbox', inboxRoute);  // ← Add this
app.use('/api/wallet', walletRoute);
// ... other routes

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## ✅ Verify Installation

### 1. Check Models Are Loaded

MongoDB will automatically recognize:
- `Thread` collection
- `Message` collection
- `Attachment` collection

### 2. Test the Endpoint

```bash
# Get inbox stats (should return 200)
curl -X GET http://localhost:3000/api/inbox/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Expected Response

```json
{
  "error": false,
  "message": "Inbox statistics retrieved successfully",
  "data": {
    "total": 0,
    "unread": 0,
    "starred": 0,
    "drafts": 0
  }
}
```

---

## 🔌 SendGrid Setup (Optional but Recommended)

### Configure Sendgrid Inbound Parse

1. **Get SendGrid API Key**
   - Log in to SendGrid Dashboard
   - Go to API Keys section
   - Create a new API key with Mail Send permission

2. **Setup Inbound Parse Webhook**
   - Go to Settings → Inbound Parse
   - Add a new hostname: `conversation.yourapp.com`
   - URL: `https://yourapp.com/api/inbox/receive`
   - POST the raw message: ✓

3. **Update DNS MX Records**
   ```
   conversation.yourapp.com MX 10 mx.sendgrid.net
   ```

4. **Test Webhook**
   - Send test email to: `test+threadId@conversation.yourapp.com`
   - Check if it appears in `/api/inbox/folder/inbox`

---

## 🔐 Add Webhook Security

Optionally secure the webhook endpoint. Update `inbox.controller.ts`:

```typescript
import crypto from 'crypto';

const verifyWebhookSignature = (req: Request): boolean => {
  const signature = req.headers['x-twilio-email-event-signature'] as string;
  const timestamp = req.headers['x-twilio-email-event-timestamp'] as string;
  const body = JSON.stringify(req.body);
  
  const key = process.env.SENDGRID_WEBHOOK_KEY || '';
  const hash = crypto
    .createHmac('sha256', key)
    .update(timestamp + body)
    .digest('base64');
  
  return hash === signature;
};

// In receiveEmail controller:
public receiveEmail = asyncHandler(async (req: Request, res: Response) => {
  // Verify signature
  if (!verifyWebhookSignature(req)) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid webhook signature");
  }
  
  // ... rest of code
});
```

---

## 🎨 Frontend Integration Example

### React Component Example

```typescript
import React, { useState, useEffect } from 'react';

const InboxList = ({ token }: { token: string }) => {
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Get inbox stats
    fetch('/api/inbox/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setStats(data.data));

    // Get inbox messages
    fetch('/api/inbox/folder/inbox?limit=20&page=1', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setMessages(data.data.messages));
  }, [token]);

  return (
    <div>
      <h2>Inbox ({stats?.unread} unread)</h2>
      {messages.map(msg => (
        <div key={msg._id}>
          <h3>{msg.subject}</h3>
          <p>From: {msg.from}</p>
          <p>Read: {msg.isRead ? '✓' : '✗'}</p>
        </div>
      ))}
    </div>
  );
};
```

---

## 📋 Environment Variables

Add to your `.env` file:

```bash
# SendGrid
SENDGRID_API_KEY=your_api_key_here
SENDGRID_WEBHOOK_KEY=your_webhook_key_here

# App
INBOX_DOMAIN=conversation.yourapp.com
INBOX_WEBHOOK_URL=https://yourapp.com/api/inbox/receive
```

---

## 🧪 Complete Testing Workflow

### 1. Send a Test Email

```bash
curl -X POST http://localhost:3000/api/inbox/send \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "user@yourapp.com",
    "to": ["test@example.com"],
    "subject": "Test Email",
    "body": "<p>This is a test</p>",
    "plainText": "This is a test"
  }'
```

### 2. Save a Draft

```bash
curl -X POST http://localhost:3000/api/inbox/draft \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "user@yourapp.com",
    "to": ["recipient@example.com"],
    "subject": "Draft Email",
    "body": "<p>Draft content</p>",
    "plainText": "Draft content"
  }'
```

### 3. Get Inbox

```bash
curl -X GET "http://localhost:3000/api/inbox/folder/inbox?limit=10&page=1" \
  -H "Authorization: Bearer YOUR_JWT"
```

### 4. Get Statistics

```bash
curl -X GET http://localhost:3000/api/inbox/stats \
  -H "Authorization: Bearer YOUR_JWT"
```

### 5. Mark Message as Read

```bash
curl -X PATCH http://localhost:3000/api/inbox/message/MESSAGE_ID \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{ "isRead": true }'
```

### 6. Star a Message

```bash
curl -X PATCH http://localhost:3000/api/inbox/message/MESSAGE_ID \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{ "isStarred": true }'
```

### 7. Move to Archive

```bash
curl -X PATCH http://localhost:3000/api/inbox/message/MESSAGE_ID \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{ "folder": "archive" }'
```

### 8. Search Messages

```bash
curl -X GET "http://localhost:3000/api/inbox/search?q=invoice&limit=10&page=1" \
  -H "Authorization: Bearer YOUR_JWT"
```

---

## 🚨 Troubleshooting

### Issue: 404 on `/api/inbox/...`
**Solution:** Make sure you added the route to your main server file

### Issue: 401 Unauthorized
**Solution:** Pass valid JWT token in Authorization header: `Bearer YOUR_TOKEN`

### Issue: Webhook not receiving emails
**Solution:** 
1. Verify DNS MX records are set
2. Check SendGrid logs for webhook failures
3. Verify webhook URL is publicly accessible
4. Check firewall/CORS settings

### Issue: Messages not saving
**Solution:**
1. Verify MongoDB connection
2. Check user ID is valid ObjectId
3. Verify email addresses are valid format

---

## 📚 Full Documentation Files

- `EMAIL_MESSAGING_SYSTEM.md` - Complete system documentation
- `INBOX_QUICK_REFERENCE.md` - Quick reference guide
- This file - Integration instructions

---

## ✨ You're All Set!

Your email/messaging system is ready to use. Start building amazing features on top of it! 🚀

**Key Files Created:**
- ✅ Thread model
- ✅ Message model  
- ✅ Attachment model
- ✅ Inbox service
- ✅ Inbox controller
- ✅ Inbox routes

**Just add to your server and you're good to go!**
