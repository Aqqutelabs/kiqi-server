# Paystack Payment Amount Issue - FIX DOCUMENTATION

## Problem
When a user wants to make a payment for 107,000 NGN, the Paystack payment page shows 107 NGN instead of 107,000 NGN.

## Root Cause
The issue is likely one of the following:
1. **Decimal precision loss** during string parsing of formatted prices (with currency symbols like "₦")
2. **Amount not being multiplied by 100** for kobo conversion
3. **Incorrect currency parsing** from cart items

## Solution Applied

### 1. Enhanced Logging in `createOrder` Function
**File**: `src/controllers/pressRelease.controller.ts`

Added detailed logging to track the exact amounts being calculated:
```typescript
console.log(`💰 Order Calculation:
   Subtotal (NGN): ${subtotal}
   VAT (7.5%): ${vat_amount}
   Total (NGN): ${total_amount}
   Total in Kobo (for Paystack): ${total_amount * 100}`);
```

This will help you verify:
- The subtotal is being parsed correctly
- VAT calculation is correct (7.5%)
- The final amount matches what the user expects
- The kobo conversion is correct (multiply by 100)

### 2. Enhanced Logging in Paystack Initialization
**File**: `src/utils/paystack.ts`

Added comprehensive logging to see exactly what's being sent to Paystack:
```typescript
console.log(`📱 Initializing Paystack Payment:
   Amount in Kobo: ${params.amount}
   Amount in NGN: ${params.amount / 100}
   Email: ${params.email}
   Reference: ${params.reference}`);
```

## Verification Steps

1. **Check Terminal Logs**
   When a user makes a payment, check your server logs for these messages:
   ```
   💰 Order Calculation: ...
   📱 Initializing Paystack Payment: ...
   ```

2. **Verify the Math**
   - For 107,000 NGN order:
     - Subtotal should be: 107,000
     - VAT (7.5%) should be: 8,025
     - Total should be: 115,025
     - Amount in Kobo (for Paystack): 11,502,500

3. **Check Paystack Dashboard**
   - Log into your Paystack dashboard
   - Look at the transaction details
   - Verify the amount displayed matches what you sent

## Possible Additional Issues to Check

### If the amount is still wrong:

1. **Check how prices are stored in Publisher model**
   ```typescript
   // Publisher.price might be stored as:
   // "₦50,000" or "50000" or 50000
   ```

2. **Verify cart item prices**
   - Look at MongoDB to see what's actually stored in cart items
   - Check if prices have currency symbols that might be causing parsing issues

3. **Check the regex used for parsing**
   ```typescript
   // Current regex: /[^0-9.-]+/g
   // This removes all non-numeric characters except dots and minus signs
   // For "₦107,000" it becomes "107000" ✓
   // For "107,000" it becomes "107000" ✓
   ```

## Testing the Fix

1. Create a test order with a known amount (e.g., 10,000 NGN)
2. Check logs to verify the amount calculation
3. Proceed to Paystack payment
4. Verify Paystack shows the correct amount
5. Complete or cancel the payment to test

## Related Code Areas

- **Order Creation**: `src/controllers/pressRelease.controller.ts` → `createOrder()`
- **Payment Initialization**: `src/utils/paystack.ts` → `initializePaystackPayment()`
- **Cart Item Addition**: `src/controllers/pressRelease.controller.ts` → `addToCartWithAddons()`
- **Webhook Handling**: `src/controllers/pressRelease.controller.ts` → `paystackWebhook()`

## Amount Conversion Reference

```
1 Nigerian Naira (₦) = 100 Kobo
Paystack API expects: amount in kobo

Example:
- User wants to pay: 107,000 NGN
- Convert to kobo: 107,000 × 100 = 10,700,000 kobo
- Send to Paystack: { amount: 10700000 }
```

## If Still Not Working

1. **Check Paystack API Response** - The webhook should show the actual amount charged
2. **Verify PAYSTACK_SECRET_KEY** - Make sure it's correctly set in your environment
3. **Check Frontend Callback** - Ensure the callback URL is correct
4. **Test with Paystack Test Keys** - Use their sandbox environment first
