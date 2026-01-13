# Admin API Documentation

## Overview
The Admin API provides comprehensive management capabilities for campaigns, press releases, payments, and system operations. All endpoints require authentication and admin privileges.

## Authentication
All admin endpoints require:
1. Valid JWT token in `Authorization` header: `Bearer <token>`
2. User must have `role: 'admin'` or `isAdmin: true`
3. Some operations require `role: 'superuser'` or `isSuperAdmin: true`

## Base URL
```
http://localhost:3000/api/v1/admin
```

## Response Format
All responses follow the standard format:
```json
{
  "error": false,
  "message": "Success message",
  "data": {},
  "statusCode": 200
}
```

---

## System Management

### Get System Overview
**GET** `/overview`

Returns dashboard metrics for the entire system.

**Response:**
```json
{
  "users": 150,
  "campaigns": 45,
  "pressReleases": 23,
  "orders": 120,
  "successfulOrders": 95,
  "campaignsByStatus": [
    { "_id": "Draft", "count": 10 },
    { "_id": "Active", "count": 15 },
    { "_id": "Completed", "count": 20 }
  ],
  "ordersByPaymentStatus": [
    { "_id": "Successful", "count": 95 },
    { "_id": "Pending", "count": 20 },
    { "_id": "Failed", "count": 5 }
  ]
}
```

---

## Campaign Management

### List All Campaigns
**GET** `/campaigns`

List all campaigns with filtering and pagination.

**Query Parameters:**
- `status` (optional): Filter by campaign status (Draft, Scheduled, Active, Completed, Failed, Paused)
- `userId` (optional): Filter by user ID
- `searchTerm` (optional): Search in campaign name or subject line
- `startDate` (optional): Filter campaigns created after date (ISO format)
- `endDate` (optional): Filter campaigns created before date (ISO format)
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 20, max: 100): Items per page

**Example:**
```
GET /campaigns?status=Active&page=1&limit=20
```

**Response:**
```json
{
  "campaigns": [
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "campaignName": "Black Friday Sales",
      "subjectLine": "50% Off Everything",
      "status": "Active",
      "user": {
        "_id": "user-123",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe"
      },
      "audienceSize": 5000,
      "createdAt": "2025-12-16T10:00:00Z",
      "updatedAt": "2025-12-16T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### Get Campaign Details
**GET** `/campaigns/:campaignId`

Get detailed information about a specific campaign.

**Parameters:**
- `campaignId` (required): Campaign ID

**Response:**
```json
{
  "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
  "campaignName": "Black Friday Sales",
  "subjectLine": "50% Off Everything",
  "status": "Active",
  "sender": {
    "senderName": "Sales Team",
    "senderEmail": "sales@company.com",
    "replyToEmail": "sales@company.com"
  },
  "audience": {
    "emailLists": ["list-123", "list-456"],
    "excludeLists": ["list-789"],
    "manualEmails": ["vip@example.com"]
  },
  "content": {
    "htmlContent": "<html>...</html>",
    "plainText": "Content text"
  },
  "analytics": {
    "deliveries": 5000,
    "bounces": 50
  },
  "createdAt": "2025-12-16T10:00:00Z"
}
```

### Get Campaign Statistics
**GET** `/campaigns/stats/overview`

Get aggregate statistics about all campaigns.

**Response:**
```json
{
  "totalCampaigns": 45,
  "byStatus": [
    { "_id": "Draft", "count": 10 },
    { "_id": "Active", "count": 15 },
    { "_id": "Completed", "count": 20 }
  ],
  "averageAudienceSize": 2500
}
```

### Change Campaign Status
**PUT** `/campaigns/:campaignId/status`

Change the status of a campaign.

**Parameters:**
- `campaignId` (required): Campaign ID

**Body:**
```json
{
  "newStatus": "Paused",
  "reason": "Customer requested pause"
}
```

**Allowed Status Transitions:**
- Draft → Scheduled, Active, Completed, Failed, Paused
- Scheduled → Active, Completed, Failed, Paused
- Active → Completed, Failed, Paused
- Completed, Failed, Paused → Draft

**Response:**
```json
{
  "message": "Campaign status changed from Active to Paused",
  "campaign": { ... }
}
```

### Delete Campaign
**DELETE** `/campaigns/:campaignId`

Delete a campaign (soft or hard delete).

**Requires:** Super admin privileges

**Parameters:**
- `campaignId` (required): Campaign ID

**Body:**
```json
{
  "softDelete": true
}
```

**Response:**
```json
{
  "message": "Campaign soft deleted"
}
```

---

## Press Release Management

### List All Press Releases
**GET** `/press-releases`

List all press releases with filtering and pagination.

**Query Parameters:**
- `status` (optional): Filter by status (Draft, Published, Archived, Rejected)
- `userId` (optional): Filter by user ID
- `searchTerm` (optional): Search in title or description
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20, max: 100): Items per page

**Response:**
```json
{
  "pressReleases": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 23,
    "pages": 2
  }
}
```

### Change Press Release Status
**PUT** `/press-releases/:pressReleaseId/status`

Change press release status.

**Parameters:**
- `pressReleaseId` (required): Press release ID

**Body:**
```json
{
  "newStatus": "Published",
  "reason": "Approved for publication"
}
```

**Response:**
```json
{
  "message": "Press release status changed from Draft to Published",
  "pressRelease": { ... }
}
```

### Delete Press Release
**DELETE** `/press-releases/:pressReleaseId`

Permanently delete a press release.

**Requires:** Super admin privileges

**Response:**
```json
{
  "message": "Press release deleted"
}
```

---

## Payment Management

### List All Payments
**GET** `/payments`

List all payments/orders with filtering and pagination.

**Query Parameters:**
- `paymentStatus` (optional): Pending, Successful, Failed
- `status` (optional): Pending, Completed, Failed
- `userId` (optional): Filter by user ID
- `startDate` (optional): Filter after date (ISO format)
- `endDate` (optional): Filter before date (ISO format)
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20, max: 100): Items per page

**Example:**
```
GET /payments?paymentStatus=Successful&startDate=2025-12-01&endDate=2025-12-31
```

**Response:**
```json
{
  "payments": [
    {
      "_id": "order-123",
      "user_id": { ... },
      "order_summary": {
        "subtotal": "₦10,000",
        "vat_percentage": "7.5%",
        "vat_amount": "₦750",
        "total_amount": "₦10,750"
      },
      "payment_status": "Successful",
      "status": "Completed",
      "createdAt": "2025-12-16T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### Get Successful Payments
**GET** `/payments/successful`

Get only successfully completed payments (most commonly used for reconciliation).

**Query Parameters:**
- `startDate` (optional): ISO format date
- `endDate` (optional): ISO format date
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20, max: 100): Items per page

**Response:**
```json
{
  "payments": [...],
  "totalRevenue": "₦1,234,500",
  "pagination": { ... }
}
```

### Get Payment Statistics
**GET** `/payments/stats`

Get comprehensive payment statistics.

**Response:**
```json
{
  "totalOrders": 120,
  "successfulOrders": 95,
  "failedOrders": 5,
  "pendingOrders": 20,
  "successRate": "79.17%",
  "totalRevenue": {
    "totalRevenue": 1234567.89,
    "avgOrderValue": 12997.55
  },
  "paymentMethodBreakdown": [
    {
      "_id": "Paystack",
      "count": 80,
      "totalAmount": 1000000
    },
    {
      "_id": "Card",
      "count": 15,
      "totalAmount": 234567.89
    }
  ]
}
```

### Update Order Status
**PUT** `/payments/:orderId/status`

Update order or payment status (admin override).

**Requires:** Super admin privileges

**Parameters:**
- `orderId` (required): Order ID

**Body:**
```json
{
  "status": "Completed",
  "paymentStatus": "Successful",
  "reason": "Manual reconciliation"
}
```

**Response:**
```json
{
  "message": "Order status updated",
  "order": { ... }
}
```

---

## Transaction Management

### List All Transactions
**GET** `/transactions`

List all transactions with filtering.

**Query Parameters:**
- `status` (optional): Pending, Completed, Failed
- `userId` (optional): Filter by user ID
- `type` (optional): Credit, Debit, Referral, Conversion, Purchase, Refund
- `startDate` (optional): ISO format date
- `endDate` (optional): ISO format date
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20, max: 100): Items per page

**Response:**
```json
{
  "transactions": [...],
  "pagination": { ... }
}
```

---

## Error Handling

### Error Response Format
```json
{
  "error": true,
  "message": "Error description",
  "statusCode": 400
}
```

### Common Error Codes
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Rate Limiting
- **Limit:** 1000 requests per minute per admin user
- **Exceeded Response:** HTTP 429 with message "Too many requests. Please try again later."

## Audit Logging
All admin actions are logged for security and compliance:
- Action type (VIEW, CREATE, UPDATE, DELETE)
- Admin user ID and email
- Timestamp
- IP address
- Request parameters
- Response status

## Best Practices

1. **Always use filters for large datasets** to reduce query load
2. **Use soft delete** for campaigns to preserve data integrity
3. **Check payment statistics regularly** for reconciliation
4. **Review audit logs** for security compliance
5. **Use appropriate pagination** with limit parameter
6. **Include reasons** when changing statuses for record-keeping

---

## Examples

### Example: Get all active campaigns
```bash
curl -X GET "http://localhost:3000/api/v1/admin/campaigns?status=Active&limit=50" \
  -H "Authorization: Bearer <jwt-token>"
```

### Example: Change campaign status
```bash
curl -X PUT "http://localhost:3000/api/v1/admin/campaigns/64a1b2c3d4e5f6g7h8i9j0k1/status" \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "newStatus": "Paused",
    "reason": "Customer requested pause for Q1"
  }'
```

### Example: Get successful payments for date range
```bash
curl -X GET "http://localhost:3000/api/v1/admin/payments/successful?startDate=2025-12-01&endDate=2025-12-31&limit=100" \
  -H "Authorization: Bearer <jwt-token>"
```

### Example: Update order status
```bash
curl -X PUT "http://localhost:3000/api/v1/admin/payments/order-123/status" \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Completed",
    "paymentStatus": "Successful",
    "reason": "Manual payment verification"
  }'
```
