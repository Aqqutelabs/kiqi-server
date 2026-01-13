# Admin Routes Quick Reference

## Quick Start

### 1. Authentication
All requests require JWT token in header:
```
Authorization: Bearer <your-jwt-token>
```

### 2. Base URL
```
http://localhost:3000/api/v1/admin
```

### 3. Admin Role Requirement
User must have `role: 'admin'` or `isAdmin: true` in their profile

### 4. Super Admin Requirement (for sensitive operations)
User must have `role: 'superuser'` or `isSuperAdmin: true`

---

## Most Commonly Used Endpoints

### System Overview
```bash
GET /overview
```
Returns total users, campaigns, press releases, orders, and stats.

### List Active Campaigns
```bash
GET /campaigns?status=Active&limit=50
```

### Get Campaign Details
```bash
GET /campaigns/{campaignId}
```

### Change Campaign Status
```bash
PUT /campaigns/{campaignId}/status
Body: {
  "newStatus": "Paused",
  "reason": "Customer request"
}
```

### List All Payments
```bash
GET /payments
```

### Get Successful Payments (Revenue)
```bash
GET /payments/successful?startDate=2025-12-01&endDate=2025-12-31
```

### Get Payment Stats
```bash
GET /payments/stats
```
Returns: total orders, success rate, revenue, payment methods breakdown

### Update Order Status
```bash
PUT /payments/{orderId}/status
Body: {
  "status": "Completed",
  "paymentStatus": "Successful",
  "reason": "Manual verification"
}
```

### List All Press Releases
```bash
GET /press-releases
```

### Change Press Release Status
```bash
PUT /press-releases/{pressReleaseId}/status
Body: {
  "newStatus": "Published"
}
```

---

## Common Query Parameters

### Pagination
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Items per page

### Filtering
- `status` - Filter by status
- `userId` - Filter by specific user
- `searchTerm` - Text search
- `startDate` - ISO format (2025-12-01)
- `endDate` - ISO format (2025-12-31)

### Example:
```bash
GET /campaigns?status=Active&userId=123&page=2&limit=50
```

---

## Allowed Status Values

### Campaigns
- Draft
- Scheduled
- Active
- Completed
- Failed
- Paused

### Press Releases
- Draft
- Published
- Archived
- Rejected

### Orders
- Pending
- Completed
- Failed

### Payments
- Pending
- Successful
- Failed

---

## Response Format

### Success Response
```json
{
  "error": false,
  "message": "Success message",
  "data": { /* response data */ },
  "statusCode": 200
}
```

### Error Response
```json
{
  "error": true,
  "message": "Error description",
  "statusCode": 400
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 401 | Unauthorized (no token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found (resource doesn't exist) |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

---

## Rate Limiting

**Limit:** 1000 requests per minute per admin

**Response when exceeded:**
```json
{
  "error": true,
  "message": "Too many requests. Please try again later.",
  "statusCode": 429
}
```

---

## Audit Logging

All admin actions are logged with:
- Timestamp
- Admin ID and email
- Action type
- HTTP method and path
- Request body and parameters
- Response status
- IP address

Example log entry:
```
[ADMIN AUDIT] {
  "timestamp": "2025-12-16T12:00:00Z",
  "adminId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "adminEmail": "admin@example.com",
  "action": "CHANGE_CAMPAIGN_STATUS",
  "method": "PUT",
  "path": "/campaigns/64a1b2c3d4e5f6g7h8i9j0k1/status",
  "statusCode": 200
}
```

---

## Complete Endpoint List

### System (1)
- `GET /overview` - Dashboard

### Campaigns (5)
- `GET /campaigns` - List
- `GET /campaigns/:campaignId` - Details
- `GET /campaigns/stats/overview` - Stats
- `PUT /campaigns/:campaignId/status` - Change status
- `DELETE /campaigns/:campaignId` - Delete (super admin only)

### Press Releases (3)
- `GET /press-releases` - List
- `PUT /press-releases/:pressReleaseId/status` - Change status
- `DELETE /press-releases/:pressReleaseId` - Delete (super admin only)

### Payments (5)
- `GET /payments` - List
- `GET /payments/successful` - Successful only
- `GET /payments/stats` - Statistics
- `PUT /payments/:orderId/status` - Update status (super admin only)

### Transactions (1)
- `GET /transactions` - List

### Health (1)
- `GET /health` - API health check

---

## cURL Examples

### 1. Get System Overview
```bash
curl -X GET "http://localhost:3000/api/v1/admin/overview" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Get Active Campaigns
```bash
curl -X GET "http://localhost:3000/api/v1/admin/campaigns?status=Active&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Change Campaign Status
```bash
curl -X PUT "http://localhost:3000/api/v1/admin/campaigns/CAMPAIGN_ID/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newStatus": "Paused",
    "reason": "Customer requested pause"
  }'
```

### 4. Get Successful Payments
```bash
curl -X GET "http://localhost:3000/api/v1/admin/payments/successful?startDate=2025-12-01&limit=100" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Get Payment Statistics
```bash
curl -X GET "http://localhost:3000/api/v1/admin/payments/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Update Order Status
```bash
curl -X PUT "http://localhost:3000/api/v1/admin/payments/ORDER_ID/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Completed",
    "paymentStatus": "Successful",
    "reason": "Manual verification"
  }'
```

### 7. Delete Campaign (Super Admin)
```bash
curl -X DELETE "http://localhost:3000/api/v1/admin/campaigns/CAMPAIGN_ID" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "softDelete": true
  }'
```

---

## Tips & Tricks

1. **Use pagination for large datasets**
   ```bash
   GET /campaigns?page=1&limit=50
   ```

2. **Filter by date range for reports**
   ```bash
   GET /payments/successful?startDate=2025-12-01&endDate=2025-12-31
   ```

3. **Search campaigns**
   ```bash
   GET /campaigns?searchTerm=Black%20Friday
   ```

4. **Get revenue for specific user**
   ```bash
   GET /payments/successful?userId=USER_ID
   ```

5. **Check payment breakdown**
   ```bash
   GET /payments/stats
   ```

6. **Monitor system health**
   ```bash
   GET /health
   ```

---

## Security Best Practices

✅ Always use HTTPS in production
✅ Keep JWT tokens secure
✅ Rotate admin tokens regularly
✅ Monitor audit logs for suspicious activity
✅ Use strong passwords for admin accounts
✅ Limit super admin access to authorized personnel only
✅ Never commit JWT tokens to version control

---

## Troubleshooting

### 403 Forbidden Error
- Check if user has admin role
- Verify JWT token is valid and not expired

### 404 Not Found Error
- Verify campaign/order ID is correct
- Check if resource actually exists

### 429 Too Many Requests
- Wait 60 seconds before making new requests
- Reduce request frequency

### 500 Internal Server Error
- Check server logs for details
- Verify database connection
- Ensure all required fields are provided

---

## Support

For detailed documentation, see: `ADMIN_API_DOCUMENTATION.md`
For implementation details, see: `ADMIN_ROUTES_IMPLEMENTATION.md`
