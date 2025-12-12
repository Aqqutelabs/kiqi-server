# Paystack Webhook Setup Guide

## Overview

The checkout flow now uses Paystack webhooks to automatically clear the cart when payment is completed. This is the most secure and reliable approach.

## Payment Flow

```
1. User adds items to cart
   ↓
2. User clicks "Checkout" 
   → Backend creates Order (status: Pending)
   → Paystack payment link generated
   → Cart stays intact
   ↓
3. User completes payment on Paystack modal
   ↓
4. Paystack calls your webhook server
   → Webhook verifies payment
   → Order status updated to "Completed"
   → Cart automatically cleared
   ↓
5. Frontend shows success message
```

## Backend Configuration

### 1. Environment Variables

Add to your `.env` file:

```env
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxx  # Get from Paystack dashboard
FRONTEND_URL=https://yourdomain.com           # Your frontend domain
```

### 2. Webhook Endpoint

**URL:** `POST /api/v1/press-releases/webhooks/paystack`

**Features:**
- ✅ Automatically verifies Paystack signature
- ✅ Prevents duplicate processing (idempotency)
- ✅ Handles missing orders gracefully
- ✅ Logs all webhook events
- ✅ No authentication required (signature-based security)

### 3. Paystack Dashboard Setup

1. Go to https://dashboard.paystack.com
2. Login to your account
3. Navigate to **Settings → API Keys & Webhooks**
4. Find **Webhooks** section
5. Add a new webhook:
   - **URL:** `https://yourdomain.com/api/v1/press-releases/webhooks/paystack`
   - **Events to listen for:** Select `charge.success`
6. Save

### 4. What Happens in the Webhook

When Paystack calls your webhook with a successful charge:

1. **Signature Verification**
   - Validates the request came from Paystack
   - Uses `PAYSTACK_SECRET_KEY` to verify

2. **Event Processing**
   - Only processes `charge.success` events
   - Ignores other event types

3. **Order Update**
   - Finds order by reference number
   - Updates status from "Pending" → "Completed"
   - Sets `payment_status` to "Successful"

4. **Cart Clearing**
   - Finds user's cart
   - Clears all items
   - User can now add new items for next purchase

5. **Logging**
   - Logs all successful processes
   - Logs errors for debugging

## Testing the Webhook

### Local Testing (Development)

For local testing, you need to expose your local server to the internet:

**Option 1: Using ngrok (Recommended)**

```bash
# Install ngrok
npm install -g ngrok

# Start your server
npm start

# In another terminal, expose it
ngrok http 8000
```

This gives you a URL like: `https://abc123.ngrok.io`

Then use: `https://abc123.ngrok.io/api/v1/press-releases/webhooks/paystack`

**Option 2: Using Paystack Test Mode**

1. In Paystack dashboard, switch to **Test Mode** (top right)
2. Use test secret key: `sk_test_...`
3. Test payment cards available: https://paystack.com/docs/payments/test-cards

### Webhook Testing Checklist

- [ ] Set correct `PAYSTACK_SECRET_KEY` in `.env`
- [ ] Webhook URL is accessible and public
- [ ] Webhook configured in Paystack dashboard
- [ ] Test with Paystack test card: `4084084084084081` (exp: any future date)
- [ ] Check server logs for "Payment verified via webhook"
- [ ] Verify order status changed to "Completed"
- [ ] Confirm cart was cleared

### Manual Webhook Testing (curl)

```bash
# Generate a test webhook payload
curl -X POST http://localhost:8000/api/v1/press-releases/webhooks/paystack \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: SIGNATURE_HERE" \
  -d '{
    "event": "charge.success",
    "data": {
      "reference": "ORDER-1702134589-456789",
      "status": "success"
    }
  }'
```

## Webhook Events Reference

### Paystack Sends:

```json
{
  "event": "charge.success",
  "data": {
    "id": 123456,
    "reference": "ORDER-1702134589-456789",
    "amount": 5375000,
    "status": "success",
    "customer": {
      "id": 789,
      "email": "user@example.com"
    },
    "metadata": {}
  }
}
```

### Your Server Returns:

```json
{
  "statusCode": 200,
  "data": {
    "message": "Webhook processed successfully",
    "reference": "ORDER-1702134589-456789",
    "order_id": "507f1f77bcf86cd799439011"
  },
  "success": true
}
```

## Error Handling

### What happens if:

**Order not found?**
- Webhook returns 200 OK (acknowledges receipt)
- Paystack stops retrying
- Check logs for why order wasn't created

**Invalid signature?**
- Webhook returns 401 Unauthorized
- Event is NOT processed
- Check your `PAYSTACK_SECRET_KEY`

**Duplicate webhook?**
- If order already "Completed", webhook skips it
- Prevents double-clearing cart
- Returns success response

**Cart already cleared?**
- Cart.findOneAndUpdate uses upsert, safe operation
- If cart doesn't exist, creates empty one
- No errors thrown

## Monitoring & Debugging

### Check Logs

```bash
# Watch real-time logs
tail -f logs/app.log | grep -i paystack

# Search for errors
grep "Webhook processing error" logs/app.log
```

### Expected Log Messages

```
✅ Payment verified via webhook for order: ORDER-1702134589-456789
   User: 507f1f77bcf86cd799439011, Cart cleared, Items: 2
```

### Verify in Database

```javascript
// Check order status
db.orders.findOne({ reference: "ORDER-1702134589-456789" })
// Should show: { status: "Completed", payment_status: "Successful" }

// Check cart is cleared
db.carts.findOne({ user_id: ObjectId("...") })
// Should show: { items: [] }
```

## Security Notes

⚠️ **Important:** The webhook endpoint is PUBLIC but secured by:

1. **Paystack Signature Verification** - Only valid Paystack requests are processed
2. **Reference Validation** - Order must exist with matching reference
3. **Idempotency** - Duplicate webhooks won't cause issues

**Do NOT:**
- ❌ Share your `PAYSTACK_SECRET_KEY`
- ❌ Expose it in client-side code
- ❌ Commit it to git (use `.env` only)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid Paystack signature" | Check `PAYSTACK_SECRET_KEY` matches your Paystack account |
| "Order not found" | Verify order was created before webhook call |
| Webhook not being called | Check webhook URL in Paystack dashboard is correct |
| Cart not clearing | Check user_id matches between order and cart |
| Duplicate webhook calls | Normal - your code handles idempotency |

## Frontend Integration

After user completes payment, you can:

### Option A: Wait for webhook (Automatic)
- User sees "Processing payment..."
- Webhook handles clearing cart
- Frontend polls order status

### Option B: Use callback verification (Manual)
- User redirected to callback URL with reference
- Frontend calls verify endpoint:
```javascript
GET /api/v1/press-releases/orders/verify-payment?reference=ORDER-XXX
Authorization: Bearer {jwt_token}
```

### Combined Approach (Recommended)
1. Open Paystack payment link
2. Paystack redirects to callback URL
3. Frontend immediately calls verify endpoint
4. Webhook also handles it in background (as backup)

## Production Checklist

- [ ] Using production Paystack keys (sk_live_...)
- [ ] Webhook URL is HTTPS
- [ ] Webhook URL is publicly accessible
- [ ] Server can make outbound HTTPS requests
- [ ] `FRONTEND_URL` is set correctly
- [ ] Error logging configured
- [ ] Database backups enabled
- [ ] Monitor webhook failures
- [ ] Test full flow end-to-end

## Support

For issues:
1. Check Paystack webhook logs: https://dashboard.paystack.com → Webhooks
2. Check your server logs for webhook processing errors
3. Verify signature with: `echo -n $BODY | openssl dgst -sha512 -hmac $SECRET_KEY`
4. Contact Paystack support: support@paystack.com
