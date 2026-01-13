# Payment Verification & Tracker Status Fix

## Problem
When a user made a successful payment to Paystack and the payment was verified, the press release tracker was not being updated. It remained stuck on "initiated" status instead of progressing to "payment_completed".

## Root Cause
The issue was in the webhook handler (`paystackWebhook` in `pressRelease.controller.ts`). When a payment was verified:

1. The webhook would find the order by payment reference
2. Instead of updating the **specific press release** associated with that order, it would update **ALL** press releases for the user
3. There was no link between an Order and a specific PressRelease, so the logic couldn't determine which PR needed the tracker update

## Solution
We implemented a proper relationship between Orders and PressReleases by:

### 1. Updated Order Model (`src/models/Order.ts`)
Added a new field to link orders to specific press releases:
```typescript
interface OrderDocument extends Document {
    user_id: Schema.Types.ObjectId;
    press_release_id?: Schema.Types.ObjectId;  // NEW: Links to specific PR
    items: Array<{ ... }>;
    // ... other fields
}
```

In the schema:
```typescript
press_release_id: {
    type: Schema.Types.ObjectId,
    ref: 'PressRelease',
    required: false
}
```

### 2. Updated `createOrder` Function
Modified the endpoint to accept and store the `press_release_id`:
```typescript
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    // ... existing code ...
    const { press_release_id } = req.body;  // NEW: Accept from request
    
    const orderData: any = {
        // ... existing order data ...
    };
    
    // NEW: Store press_release_id if provided
    if (press_release_id) {
        if (!mongoose.Types.ObjectId.isValid(press_release_id)) {
            throw new ApiError(400, 'Invalid press release ID');
        }
        orderData.press_release_id = press_release_id;
    }
    
    const order = await Order.create(orderData);
    // ... rest of function ...
});
```

### 3. Updated Webhook Handler (`paystackWebhook`)
Fixed the payment verification logic to update only the associated press release:
```typescript
// Record payment_completed step for the associated press release
if (order.press_release_id) {
    console.log(`Recording payment_completed for specific PR: ${order.press_release_id}`);
    await recordProgressStep(
        order.press_release_id,
        order.user_id,
        'payment_completed',
        `Payment completed for press release distribution`,
        { payment_reference: reference, order_id: String(order._id) }
    );
} else {
    // Backward compatibility: update all press releases for the user
    const pressReleases = await PressRelease.find({ user_id: order.user_id });
    for (const pr of pressReleases) {
        await recordProgressStep(pr._id, order.user_id, 'payment_completed', ...);
    }
}
```

### 4. Updated Validation Schema (`src/validation/pressRelease.validation.ts`)
Added press_release_id to the createOrderSchema for proper validation.

## Expected Behavior After Fix
1. User creates a press release
2. User adds publishers to cart
3. User initiates checkout → creates an order with `press_release_id` set to the specific PR ID
4. User completes payment on Paystack
5. Paystack calls the webhook
6. Webhook updates ONLY the associated press release's tracker status to "payment_completed"
7. User sees the tracker progress to the next step instead of remaining on "initiated"

## Backward Compatibility
The fix maintains backward compatibility. If `press_release_id` is not provided when creating an order, the webhook will fall back to updating all press releases for the user (previous behavior).

## Frontend Implementation
When calling the checkout endpoint, include the `press_release_id`:

```javascript
POST /api/v1/press-releases/orders/checkout
Body: {
    "press_release_id": "507f1f77bcf86cd799439011"  // Add this
}
```

The endpoint will:
1. Use the user's cart items (publishers)
2. Link the order to the specified press release
3. On payment completion, update only that PR's tracker

## Testing Checklist
- [ ] Create a new press release
- [ ] Add publisher(s) to cart
- [ ] Create order with `press_release_id` included
- [ ] Complete payment on Paystack
- [ ] Verify webhook is called
- [ ] Check that press release tracker shows "payment_completed" status
- [ ] Verify tracker progress history includes the payment step with timestamp

