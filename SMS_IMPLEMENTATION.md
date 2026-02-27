# SMS Notifications Implementation Guide

## Overview

This document outlines the SMS notification system for TCS (The Co-ord Set) e-commerce platform. SMS notifications are sent automatically after successful Razorpay payment confirmation and order creation.

---

## Architecture

### Workflow
```
1. User completes payment on frontend
2. Razorpay webhook (payment.captured) → Backend
3. Order created from cart in MongoDB
4. Invoice (PDF) generated
5. SMS service triggered (async, non-blocking)
   ├── User confirmation SMS sent
   ├── Admin new order alert SMS sent
6. Order remains valid even if SMS fails
7. Cart cleared after order confirmation
```

### SMS Flow Guarantee
- **When**: ONLY after Razorpay confirms payment.captured event
- **Timing**: AFTER order created in database + BEFORE webhook response sent
- **Failure Mode**: SMS errors logged, order stays valid (graceful degradation)
- **Duplication Prevention**: Database flags (smsSent, smsAdminSent) enable idempotency

---

## Setup Instructions

### Step 1: Get Twilio Credentials

1. Create account at [twilio.com](https://www.twilio.com)
2. Go to **Console Dashboard**
3. Copy:
   - **Account SID** (from top-left)
   - **Auth Token** (revealed by clicking eye icon)
   - **Phone Number** (get a Twilio trial number)

### Step 2: Configure Environment Variables

Create/update `.env` file in backend root:

```env
# ========== SMS NOTIFICATIONS (Twilio) ==========
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
ADMIN_PHONE=+919876543210
```

**Important Notes:**
- TWILIO_PHONE_NUMBER: Must be verified Twilio number (e.g., +1 for US, or your trial number)
- ADMIN_PHONE: Recipient for admin alerts (use +91 prefix for India, +1 for US)
- Both phone numbers must include country code with `+` prefix

### Step 3: Install Dependencies

Twilio package already added to `package.json`. Ensure installed:

```bash
cd backend
npm install
```

---

## Message Formats

### User Confirmation SMS

**When Sent:** After order creation, to customer's phone number (from order)

**Format:**
```
Hi [Customer Name] 👋
Your order has been placed successfully 🎉

Order ID: [ORDER_ID]
Amount: ₹[AMOUNT]
Payment: [PAYMENT_METHOD] (Paid)

Thank you for shopping with TCS - The Co-ord Set! 🛍️
```

**Example:**
```
Hi Priya 👋
Your order has been placed successfully 🎉

Order ID: ORD-1234567890
Amount: ₹2,499.00
Payment: Razorpay (Paid)

Thank you for shopping with TCS - The Co-ord Set! 🛍️
```

### Admin New Order Alert SMS

**When Sent:** After order creation, to admin phone (ADMIN_PHONE env variable)

**Format:**
```
New Order Received 📦

Order ID: [ORDER_ID]
Customer: [CUSTOMER_NAME]
Phone: [CUSTOMER_PHONE]
Amount: ₹[AMOUNT]

Check Admin Dashboard for full details!
```

**Example:**
```
New Order Received 📦

Order ID: ORD-1234567890
Customer: Priya Singh
Phone: +919876543210
Amount: ₹2,499.00

Check Admin Dashboard for full details!
```

---

## Implementation Details

### Modified Files

#### 1. **backend/src/models/Order.js**
Added SMS tracking fields:
```javascript
smsSent: { type: Boolean, default: false }           // User SMS sent flag
smsAdminSent: { type: Boolean, default: false }      // Admin SMS sent flag
smsError: { type: String }                           // Error message if SMS failed
lastSmsSendAttempt: { type: Date }                   // Timestamp of last retry attempt
```

#### 2. **backend/src/services/smsService.js** (NEW)
Centralized SMS logic with 4 exported functions:

**`sendOrderNotificationSMS(order)`**
- Main function called from payment webhook
- Orchestrates both user and admin SMS
- Returns: `{ userSmsSent, adminSmsSent, errors: [] }`
- Error handling: Catches and logs, doesn't throw

**`sendUserConfirmationSMS(order)`**
- Checks `order.smsSent` flag → skips if already sent (idempotency)
- Formats customer phone with +91 prefix if needed
- Sends formatted message
- Updates database: `smsSent = true, lastSmsSendAttempt = now`
- On error: Updates `smsError` field

**`sendAdminNewOrderSMS(order)`**
- Similar to user SMS but for admin
- Uses ADMIN_PHONE from env instead of order.billingDetails.phone
- Checks `order.smsAdminSent` flag for idempotency
- Updates `smsAdminSent = true` on success
- On error: Appends to `smsError`

**`retryOrderSMS(orderId)`**
- Manual retry mechanism for failed SMS (optional)
- Finds order by ID, resets flags, retries
- Useful for admin troubleshooting
- Not exposed as route (can add if needed)

**`getTwilioClient()`**
- Initializes Twilio SDK
- Feature flag: If TWILIO_*_* env vars missing → logs SMS instead of sending (development mode)
- Prevents errors if Twilio credentials not yet configured

#### 3. **backend/src/routes/payment.js**
Integrated SMS into webhook:

```javascript
// Added at top (line 9)
const { sendOrderNotificationSMS } = require('../services/smsService');

// In createOrderFromCart webhook handler (after invoice generation)
try {
  await sendOrderNotificationSMS(order);
} catch (smsErr) {
  console.error('SMS notification error (order still valid):', smsErr.message);
}
```

**Key Point:** SMS wrapped in try-catch at webhook level. Even if SMS fails:
- Order is already created & saved
- Invoice is already generated
- Response is NOT delayed
- Error is logged for debugging

#### 4. **.env.example**
Added SMS configuration template for developers

---

## Console Logging

All SMS operations log with status indicators for debugging:

```javascript
// Success
✅ User SMS sent to +919876543210

// Feature flag (no credentials)
📫 SMS logged (Twilio not configured): User confirmation SMS

// Error
❌ SMS sending failed: Invalid phone number format
```

---

## Testing Guide

### Test Scenario: Complete Order with SMS

**Prerequisites:**
1. Configure `.env` with real Twilio credentials
2. Backend running: `npm start`
3. Frontend running: `npm run dev`

**Steps:**
1. Add product to cart
2. Go to Checkout
3. Complete address form
4. Click "Proceed to Payment"
5. **Razorpay popup** → Pay ₹1 (test amount)
6. **Expected outcomes:**
   - ✅ Order created in MongoDB with status "PLACED"
   - ✅ "Order Placed Successfully" page shown
   - ✅ User SMS received on order phone
   - ✅ Admin SMS received on ADMIN_PHONE
   - ✅ Check logs: `✅ User SMS sent to +91...` and `✅ Admin SMS sent to +91...`

### Test Scenario: Check Idempotency

**Steps:**
1. Manually trigger webhook retry (if implemented)
2. Original SMS already sent, flags set to true
3. Second attempt checks `order.smsSent` → skips user SMS
4. Check logs: `User SMS already sent for order...` (no duplicate)

### Test Scenario: SMS Without Twilio Credentials

**Conditions:**
- `.env` missing TWILIO_ACCOUNT_SID/TOKEN
- SMS logs instead of sending

**Expected:**
- Order created successfully
- Log shows: `📫 SMS logged (Twilio not configured): ...`
- No errors thrown
- Perfect for development/CI pipelines

### Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| SMS not sent | Twilio credentials missing | Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN to .env |
| "Invalid phone format" | Phone doesn't include country code | Use format: +919876543210 (not 9876543210) |
| Admin SMS only, no user SMS | Phone in order is null/invalid | Check billingDetails.phone is populated |
| Duplicate SMS received | Webhook called multiple times | Check `order.smsSent` flag in database |
| SMS fails but order placed | Expected (graceful degradation) | Check `order.smsError` field for details |

---

## Database Fields Reference

### Order Schema SMS Fields

```javascript
{
  // ... existing fields ...
  
  // SMS Tracking (New)
  smsSent: false,                    // User SMS sent successfully
  smsAdminSent: false,               // Admin SMS sent successfully
  smsError: null,                    // Error message if SMS failed
  lastSmsSendAttempt: null,          // Timestamp of last attempt (for retry logic)
  
  // ... rest of order fields ...
}
```

**Query Examples:**
```javascript
// Find orders with failed SMS
db.orders.find({ smsError: { $exists: true, $ne: null } })

// Find orders with user SMS sent
db.orders.find({ smsSent: true })

// Find orders needing SMS retry
db.orders.find({ 
  $and: [
    { smsError: { $exists: true, $ne: null } },
    { smsSent: false }
  ]
})
```

---

## Optional Enhancements

### 1. SMS Retry Endpoint (Admin Dashboard)

**Route:** `POST /api/orders/:id/retry-sms`

```javascript
// Add to backend/src/routes/orders.js
router.post('/:id/retry-sms', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    // Reset flags for retry
    order.smsSent = false;
    order.smsAdminSent = false;
    await order.save();
    
    // Retry SMS
    const { sendOrderNotificationSMS } = require('../services/smsService');
    await sendOrderNotificationSMS(order);
    
    res.json({ success: true, message: 'SMS retry initiated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### 2. SMS Template Customization

Edit message formats in `backend/src/services/smsService.js`:
- Update emoji icons
- Change tone (formal/casual)
- Add custom business info
- Include tracking links

### 3. Conditional SMS Sending

Add business logic filters:
```javascript
// Only send SMS if amount > threshold
if (order.totalAmount > 500) {
  await sendOrderNotificationSMS(order);
}

// Only send during business hours
const hour = new Date().getHours();
if (hour >= 9 && hour < 22) {  // 9 AM - 10 PM
  await sendOrderNotificationSMS(order);
}
```

---

## Monitoring & Debugging

### View SMS Logs

**In Terminal:**
```bash
# Run backend with verbose logging
npm start

# Search logs for SMS
# Look for: ✅, ❌, 📫 markers
```

**In MongoDB:**
```javascript
// Check failed SMS
db.orders.find({ smsError: { $exists: true } }).pretty()

// Check SMS stats
db.orders.aggregate([
  {
    $group: {
      _id: null,
      totalOrders: { $sum: 1 },
      smsSucceeded: { $sum: { $cond: ["$smsSent", 1, 0] } },
      smsFailed: { $sum: { $cond: ["$smsError", 1, 0] } }
    }
  }
])
```

### Twilio Console Monitoring

1. Go to [twilio.com/console](https://www.twilio.com/console)
2. **Logs** section shows all sent/failed SMS
3. **Phone Numbers** section tracks your Twilio number quota
4. **Billing** shows SMS cost per message (~₹0.50-₹1.50 per SMS in India)

---

## FAQ

**Q: Why SMS sometimes shows "logged" instead of sent?**
A: Feature flag for development. If Twilio credentials missing, logs instead of failing. Perfect for testing without SMS cost.

**Q: What happens if SMS fails mid-payment?**
A: Order is already created & valid. SMS failure is logged but doesn't affect order status.

**Q: How to test SMS without paying real money?**
A: Use Razorpay test mode:
1. Frontend uses test keys (check env)
2. Use test card: 4111111111111111
3. SMS still goes out if configured (Twilio charges apply)

**Q: Can I send SMS to different number per order?**
A: Yes! SMS uses `order.billingDetails.phone`. User SMS goes there, admin SMS to ADMIN_PHONE. To customize, update smsService.js logic.

**Q: How to add SMS for abandoned carts?**
A: Use cron job or background task:
```javascript
// In separate scheduled task
const orderedProducts = await Order.find({ status: 'PLACED' });
const cartProducts = await Cart.find({ userId: {...} });
// Compare & send abandoned cart SMS
```

---

## Cost Estimation

**Twilio SMS Pricing (India):**
- Inbound SMS: Free
- Outbound SMS: ~₹0.50 - ₹1.50 per message
- Two SMS per order = ~₹1-₹3 per order (user + admin)

**With 100 orders/month:** ~₹100-₹300/month

---

## Support & Troubleshooting

For issues:
1. Check `.env` has all TWILIO_* variables
2. Check ADMIN_PHONE format: +91XXXXXXXXXX
3. Check MongoDB order.smsError field for detailed error
4. Check Twilio console logs for API errors
5. Re-read "Test Scenario" section for step-by-step verification

---

**Updated:** February 2025
**Status:** Complete & Production Ready
**Next Phase:** Optional SMS analytics & delivery reports
