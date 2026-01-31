# SendGrid Verified Senders API Documentation

## Overview
This document describes the new endpoints for fetching verified SendGrid sender IDs. These endpoints allow you to retrieve only successfully created and verified sender IDs from your SendGrid account.

## New Endpoints

### 1. Get User's Single Verified Sender
**Endpoint:** `GET /api/v1/sender-emails/sendgrid/verified-sender`

**Authentication:** Required (Bearer Token)

**Description:** Retrieves the first verified SendGrid sender email for the authenticated user.

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/sender-emails/sendgrid/verified-sender \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Response (Success):**
```json
{
  "error": false,
  "message": "Verified sender found",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "senderName": "John Doe",
    "type": "sendgrid",
    "senderEmail": "john@example.com",
    "user_id": "507f1f77bcf86cd799439012",
    "verified": true,
    "sendgridId": "sg-sender-123456",
    "createdAt": "2024-01-30T10:00:00Z",
    "updatedAt": "2024-01-30T10:05:00Z"
  }
}
```

**Response (Not Found):**
```json
{
  "error": true,
  "message": "No verified sender found for user"
}
```

**Status Codes:**
- `200 OK` - Verified sender found
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - No verified sender for user

---

### 2. Get All User's Verified Senders
**Endpoint:** `GET /api/v1/sender-emails/sendgrid/verified-senders`

**Authentication:** Required (Bearer Token)

**Description:** Retrieves all verified SendGrid sender emails for the authenticated user.

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/sender-emails/sendgrid/verified-senders \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Response (Success):**
```json
{
  "error": false,
  "message": "Found 3 verified sender(s)",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "senderName": "John Doe",
      "type": "sendgrid",
      "senderEmail": "john@example.com",
      "user_id": "507f1f77bcf86cd799439012",
      "verified": true,
      "sendgridId": "sg-sender-123456",
      "createdAt": "2024-01-30T10:00:00Z",
      "updatedAt": "2024-01-30T10:05:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "senderName": "Business Account",
      "type": "sendgrid",
      "senderEmail": "business@example.com",
      "user_id": "507f1f77bcf86cd799439012",
      "verified": true,
      "sendgridId": "sg-sender-789012",
      "createdAt": "2024-01-28T15:00:00Z",
      "updatedAt": "2024-01-29T11:30:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "senderName": "Support Team",
      "type": "sendgrid",
      "senderEmail": "support@example.com",
      "user_id": "507f1f77bcf86cd799439012",
      "verified": true,
      "sendgridId": "sg-sender-345678",
      "createdAt": "2024-01-25T12:00:00Z",
      "updatedAt": "2024-01-26T09:00:00Z"
    }
  ],
  "count": 3
}
```

**Response (Empty):**
```json
{
  "error": false,
  "message": "Found 0 verified sender(s)",
  "data": [],
  "count": 0
}
```

**Status Codes:**
- `200 OK` - Returns array of verified senders (may be empty)
- `401 Unauthorized` - User not authenticated

---

### 3. Get All Verified Senders (System-wide)
**Endpoint:** `GET /api/v1/sender-emails/sendgrid/all-verified-senders`

**Authentication:** Required (Bearer Token)

**Description:** Retrieves all verified SendGrid sender emails across all users. **This is typically an admin endpoint.**

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/sender-emails/sendgrid/all-verified-senders \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Response (Success):**
```json
{
  "error": false,
  "message": "Found 5 verified sender(s) across all users",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "senderName": "John Doe",
      "type": "sendgrid",
      "senderEmail": "john@example.com",
      "user_id": "507f1f77bcf86cd799439012",
      "verified": true,
      "sendgridId": "sg-sender-123456",
      "createdAt": "2024-01-30T10:00:00Z",
      "updatedAt": "2024-01-30T10:05:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "senderName": "Jane Smith",
      "type": "sendgrid",
      "senderEmail": "jane@example.com",
      "user_id": "507f1f77bcf86cd799439015",
      "verified": true,
      "sendgridId": "sg-sender-789012",
      "createdAt": "2024-01-28T15:00:00Z",
      "updatedAt": "2024-01-29T11:30:00Z"
    }
  ],
  "count": 5
}
```

**Status Codes:**
- `200 OK` - Returns array of all verified senders across users
- `401 Unauthorized` - User not authenticated

**Note:** Consider restricting this endpoint to admin users by adding an admin middleware.

---

## Implementation Details

### Service Methods Added

#### 1. `getUserVerifiedSender(userId: string)`
- **Purpose:** Get the first verified sender for a user
- **Returns:** Single `SenderEmailModel` or `null`
- **Filters:** `{ user_id: userId, verified: true, type: 'sendgrid' }`

#### 2. `getUserVerifiedSenders(userId: string)`
- **Purpose:** Get all verified senders for a user
- **Returns:** Array of `SenderEmailModel`
- **Filters:** `{ user_id: userId, verified: true, type: 'sendgrid' }`

#### 3. `getAllVerifiedSenders()`
- **Purpose:** Get all verified senders across all users
- **Returns:** Array of `SenderEmailModel`
- **Filters:** `{ verified: true, type: 'sendgrid' }`

### Database Queries

All queries use the `SenderModel` MongoDB collection and filter by:
- `verified: true` - Only successfully verified senders
- `type: 'sendgrid'` - Only SendGrid sender type (excludes other types)

### Error Handling

All endpoints include:
- Try-catch blocks for database errors
- Proper HTTP status codes
- User authentication validation
- Empty array returns instead of errors when no senders found (for list endpoints)

---

## Usage Examples

### Example 1: Get User's Verified Senders in Your Campaign

```typescript
// In your campaign service
async createCampaign(userId: string, campaignData: any) {
  // Fetch verified senders for the user
  const verifiedSenders = await this.senderEmailService.getUserVerifiedSenders(userId);
  
  if (!verifiedSenders.length) {
    throw new Error('No verified senders available. Please verify a sender first.');
  }
  
  // Use the first verified sender or let user pick
  const selectedSender = verifiedSenders[0];
  
  // Create campaign with verified sender
  const campaign = await this.campaignModel.create({
    ...campaignData,
    senderId: selectedSender._id,
    senderEmail: selectedSender.senderEmail
  });
  
  return campaign;
}
```

### Example 2: Display Verified Senders to User

```typescript
// In your frontend
async function loadVerifiedSenders(authToken: string) {
  const response = await fetch(
    'http://localhost:3000/api/v1/sender-emails/sendgrid/verified-senders',
    {
      headers: { 'Authorization': `Bearer ${authToken}` }
    }
  );
  
  const result = await response.json();
  
  if (!result.error) {
    console.log(`Found ${result.count} verified senders`);
    result.data.forEach(sender => {
      console.log(`- ${sender.senderName} (${sender.senderEmail})`);
    });
    return result.data;
  }
}
```

### Example 3: Admin Dashboard - View All Verified Senders

```typescript
// In your admin dashboard
async function viewAllVerifiedSenders(adminToken: string) {
  const response = await fetch(
    'http://localhost:3000/api/v1/sender-emails/sendgrid/all-verified-senders',
    {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }
  );
  
  const result = await response.json();
  
  if (!result.error) {
    console.log(`Total verified senders: ${result.count}`);
    
    // Group by user
    const byUser = {};
    result.data.forEach(sender => {
      const userId = sender.user_id;
      if (!byUser[userId]) byUser[userId] = [];
      byUser[userId].push(sender);
    });
    
    return byUser;
  }
}
```

---

## Filtering & Advanced Usage

### Filtering by Status
The endpoints only return `verified: true` senders. If you need unverified senders, use the existing `/` endpoint with filtering in your frontend.

### Filtering by User
Use the per-user endpoints (`/verified-senders`) to get only senders for the authenticated user.

### Pagination (Future Enhancement)
Current implementation returns all results. For large datasets, consider adding pagination:

```typescript
// Example pagination enhancement
async getUserVerifiedSenders(userId: string, skip: number = 0, limit: number = 10) {
  return SenderModel.find({ user_id: userId, verified: true, type: 'sendgrid' })
    .skip(skip)
    .limit(limit)
    .exec();
}
```

---

## Security Considerations

1. **Authentication:** All endpoints require authentication via Bearer token
2. **User Isolation:** Per-user endpoints only return senders owned by authenticated user
3. **Admin Endpoint:** The `all-verified-senders` endpoint should be restricted to admin users:

```typescript
// Add admin middleware
senderRouter.get(
  '/sendgrid/all-verified-senders',
  isAuthenticated,
  isAdmin, // Add this middleware
  controller.getAllVerifiedSenders
);
```

4. **Data Exposure:** SendGrid API key is never exposed in responses
5. **Sensitive Fields:** Only verified senders are returned (reduces data exposure for unverified/failed senders)

---

## Related Endpoints

For context, here are the existing SendGrid verification endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/sender-emails/sendgrid/request-verification` | Request verification for a new sender |
| POST | `/api/v1/sender-emails/sendgrid/confirm-verification` | Confirm a sender is verified in SendGrid |
| GET | `/api/v1/sender-emails/sendgrid/verified-sender` | Get user's single verified sender *(NEW)* |
| GET | `/api/v1/sender-emails/sendgrid/verified-senders` | Get all user's verified senders *(NEW)* |
| GET | `/api/v1/sender-emails/sendgrid/all-verified-senders` | Get all verified senders system-wide *(NEW)* |

---

## Troubleshooting

### No Senders Returned
1. Check that senders exist in database: `db.senderemails.find({ type: 'sendgrid' })`
2. Verify `verified: true` status: `db.senderemails.find({ type: 'sendgrid', verified: true })`
3. Confirm user_id is set correctly for per-user endpoints

### 401 Unauthorized
- Check that Bearer token is valid
- Ensure token is included in `Authorization` header
- Format: `Authorization: Bearer YOUR_TOKEN`

### Database Errors
- Check MongoDB connection
- Verify SenderModel schema is correct
- Check server logs for detailed error messages

---

## Testing the Endpoints

### Using cURL
```bash
# Get user's verified senders
curl -X GET http://localhost:3000/api/v1/sender-emails/sendgrid/verified-senders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json"

# Get all verified senders (admin)
curl -X GET http://localhost:3000/api/v1/sender-emails/sendgrid/all-verified-senders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json"
```

### Using Postman
1. Import your auth token as Bearer token
2. Create GET requests to the endpoints
3. Check response body for verified sender data

### Using JavaScript/Fetch API
```javascript
const headers = {
  'Authorization': 'Bearer YOUR_AUTH_TOKEN',
  'Content-Type': 'application/json'
};

// Get all verified senders
fetch('http://localhost:3000/api/v1/sender-emails/sendgrid/verified-senders', { headers })
  .then(res => res.json())
  .then(data => console.log(data.data));
```

---

## Response Format

All endpoints follow the standard response format:

```json
{
  "error": false,
  "message": "Human-readable message",
  "data": [...],
  "count": 3
}
```

- `error` (boolean): Indicates if there's an error
- `message` (string): Descriptive message about the response
- `data` (array or object): The actual data returned
- `count` (number): Number of items returned (for list endpoints)

---

## What's Next?

1. **Restrict Admin Endpoint:** Add admin role check to `all-verified-senders`
2. **Add Pagination:** For large datasets, add skip/limit parameters
3. **Add Sorting:** Allow sorting by creation date, email, etc.
4. **Add Filtering:** Filter by sender name, email domain, etc.
5. **Add Caching:** Cache verified senders list to reduce database queries

---

## Questions?

Refer to `SENDGRID_VERIFICATION.md` for details on the verification flow, or check server logs for debugging information.
