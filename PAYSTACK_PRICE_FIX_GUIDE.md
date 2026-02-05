# Paystack Price Calculation Issue - Debugging Guide

## Problem Summary
- **What user sees**: ₦107,500 on checkout
- **What Paystack receives**: NGN 107.50 (showing as 107 kobo instead of 10,750,000 kobo)
- **Root Cause**: The subtotal is being calculated as 100 instead of 100,000

## Logs Analysis
From your logs:
```
Subtotal (NGN): 100
VAT (7.5%): 7.5
Total (NGN): 107.5
Total in Kobo (for Paystack): 10750  ← Should be 10,750,000 for 107,500 NGN
```

**The issue**: The subtotal calculation is getting `100` instead of the expected `100,000` price.

## Why This Happens

The problem is in how prices are stored in the cart. When a user adds a publisher to cart using `addToCart()`, the price might be:
1. Stored as a string: `"₦100,000"`
2. Stored with decimals: `"100.000"` (European format)
3. Stored as just the number: `"100"`
4. OR the price in the database is actually storing `100` instead of `100000`

## New Debugging Added

I've added comprehensive logging to help identify exactly where the price loss happens:

```
🛒 Adding to cart - Publisher: Name, Price String: "₦100,000", Numeric Price: 100000

📦 Cart Item [Publisher Name]: basePrice = 100000, qty = 1, total = 100000

💳 Subtotal Calculation Complete: 100000

💰 FINAL ORDER CALCULATION:
   ├─ Subtotal (NGN): ₦100,000.00
   ├─ VAT (7.5%): ₦7,500.00
   ├─ Total (NGN): ₦107,500.00
   └─ Amount in Kobo (for Paystack): 10750000
```

## How to Fix This

### Step 1: Check Your Publisher Prices
Look at your database and verify how publisher prices are stored:

```javascript
// In MongoDB, run:
db.publishers.findOne({}, { name: 1, price: 1 })
```

**Expected format**:
- `"₦100,000"` ✅ (string with currency symbol and comma)
- `"100000"` ✅ (just the number as string)
- `100000` ✅ (numeric value)

**Wrong formats**:
- `"100"` ❌ (missing zeros)
- `"100,000 NGN"` ❌ (different format)
- `100` ❌ (plain number without string)

### Step 2: Test with Fresh Logs
1. **Clear your cart**
2. **Add a publisher again** to cart
3. **Check server logs for the 🛒 message**
   - Look for: `Adding to cart - Publisher: XXX, Price String: "₦100,000", Numeric Price: 100000`
4. **Proceed to checkout**
5. **Check server logs for detailed cart item breakdown**
   - Look for: `📦 Cart Item [XXX]: basePrice = 100000, qty = 1, total = 100000`
6. **Check the final calculation**
   - Look for: `💰 FINAL ORDER CALCULATION...`

### Step 3: Identify the Problem

Based on the logs, the issue could be:

**Scenario A: Price is stored as "100" in database**
```
🛒 Adding to cart - Price String: "₦100", Numeric Price: 100
```
→ **Fix**: Update your publisher prices in the database

**Scenario B: Price string has wrong format**
```
🛒 Adding to cart - Price String: "100,000.00", Numeric Price: 100000
```
→ **Fix**: This is actually OK, the parsing handles it

**Scenario C: basePrice is being lost during cart storage**
```
🛒 Adding to cart - Numeric Price: 100000
📦 Cart Item: basePrice = undefined, using parsed price instead
```
→ **Fix**: The new code handles this, but ensure MongoDB stores the basePrice field

## Quick Test

To manually test the price parsing:

```javascript
// Test the regex
const price1 = "₦100,000";
const price2 = "100000";
const price3 = "₦100.000"; // European format

console.log(parseFloat(price1.replace(/[^0-9.-]+/g, ''))); // Should be 100000
console.log(parseFloat(price2.replace(/[^0-9.-]+/g, ''))); // Should be 100000
console.log(parseFloat(price3.replace(/[^0-9.-]+/g, ''))); // Should be 100.000 (or 100000 depending on format)
```

## The Fix Applied

I've made these changes:

1. **In `addToCart()`**: Now extracts and stores `basePrice` as a numeric value
   ```typescript
   const numericPrice = parseFloat(String(publisher.price).replace(/[^0-9.-]+/g, '')) || 0;
   cartItem.basePrice = numericPrice;
   ```

2. **In `createOrder()`**: Now prioritizes numeric values over string parsing
   ```typescript
   // Priority 1: Use precomputed subtotal (from addToCartWithAddons)
   // Priority 2: Use basePrice (numeric value)
   // Priority 3: Parse price string
   ```

3. **Better logging**: Shows exactly what's happening at each step

4. **Integer kobo conversion**: Ensures Paystack gets an integer value
   ```typescript
   const amountInKobo = Math.round(total_amount * 100);
   ```

## Next Steps

1. **Deploy the changes**
2. **Test with a fresh cart**
3. **Check the console logs**
4. **If still wrong, share the logs showing**:
   - The 🛒 "Adding to cart" message
   - The 📦 "Cart Item" messages
   - The 💰 "FINAL ORDER CALCULATION" message

## Additional Notes

- The issue is **NOT** with the Paystack integration itself
- The issue is **NOT** with the kobo conversion (× 100)
- The issue **IS** with how the price value is being stored or retrieved from the cart
- The new logging will pinpoint exactly where the value is being lost

## If Still Issues

If the problem persists after deploying these changes:

1. Check if your cart is using the new `addToCartWithAddons` flow (recommended)
2. Verify publishers have prices like "₦100,000" in database, not "₦100"
3. Check if there's a middleware or interceptor modifying prices
4. Ensure MongoDB is correctly storing and retrieving the basePrice field

