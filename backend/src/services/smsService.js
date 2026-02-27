/**
 * SMS Service
 * Handles SMS notifications for orders using Twilio
 * Sends SMS only after order is created & payment confirmed
 */

const twilio = require('twilio');
const Order = require('../models/Order');

// Initialize Twilio client
const getTwilioClient = () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
        console.warn('⚠️ Twilio credentials not configured. SMS will be logged only.');
        return null;
    }

    try {
        return twilio(accountSid, authToken);
    } catch (err) {
        console.error('Failed to initialize Twilio:', err.message);
        return null;
    }
};

/**
 * Send SMS to user after order creation
 * Called after: Razorpay webhook confirms payment + Order created in DB
 */
const sendUserConfirmationSMS = async (order) => {
    try {
        // Check if SMS already sent (prevents duplicates)
        if (order.smsSent) {
            console.log(`✓ SMS already sent for order ${order.orderNumber}`);
            return { success: true, already_sent: true };
        }

        const userPhone = order.user?.phone;
        if (!userPhone) {
            throw new Error('User phone number not available');
        }

        // Format phone number (ensure +91 prefix for India)
        const formattedPhone = userPhone.startsWith('+') ? userPhone : `+91${userPhone}`;

        // SMS message content
        const message = `Hi ${order.user?.name || 'Customer'} 👋
Your order has been placed successfully 🎉

Order ID: ${order.orderNumber}
Amount: ₹${order.totalAmount.toLocaleString('en-IN')}
Payment: ${order.paymentMethod} (Paid)

Thank you for shopping with TCS – The Co-ord Set Studio 💛`;

        // Try to send SMS
        const client = getTwilioClient();
        if (!client) {
            // Log only if Twilio not configured
            console.log(`📫 [SMS LOG - NOT SENT] To: ${formattedPhone}\n${message}`);
            // Still mark as attempted to avoid retry loops
            await Order.findByIdAndUpdate(order._id, {
                smsSent: true,
                lastSmsSendAttempt: new Date()
            });
            return { success: true, logged_only: true };
        }

        // Send via Twilio
        const result = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedPhone
        });

        // Update order - SMS sent successfully
        await Order.findByIdAndUpdate(order._id, {
            smsSent: true,
            lastSmsSendAttempt: new Date()
        });

        console.log(`✅ User SMS sent for order ${order.orderNumber} (SID: ${result.sid})`);

        return {
            success: true,
            messageId: result.sid,
            phone: formattedPhone
        };
    } catch (err) {
        console.error(`❌ Failed to send user SMS for order ${order.orderNumber}:`, err.message);

        // Update order with error (but don't fail the order)
        try {
            await Order.findByIdAndUpdate(order._id, {
                smsError: err.message,
                lastSmsSendAttempt: new Date()
            });
        } catch (dbErr) {
            console.error('Failed to log SMS error to database:', dbErr.message);
        }

        // Return error but don't throw (order is still valid)
        return {
            success: false,
            error: err.message,
            orderValid: true  // ← IMPORTANT: Order is valid even if SMS fails
        };
    }
};

/**
 * Send SMS to admin about new order
 * Called after: Razorpay webhook confirms payment + Order created in DB
 */
const sendAdminNewOrderSMS = async (order) => {
    try {
        // Check if SMS already sent (prevents duplicates)
        if (order.smsAdminSent) {
            console.log(`✓ Admin SMS already sent for order ${order.orderNumber}`);
            return { success: true, already_sent: true };
        }

        const adminPhone = process.env.ADMIN_PHONE;
        if (!adminPhone) {
            console.warn('⚠️ Admin phone not configured. Skipping admin SMS.');
            return { success: true, skipped: true };
        }

        // Format phone number
        const formattedPhone = adminPhone.startsWith('+') ? adminPhone : `+91${adminPhone}`;

        // SMS message for admin
        const message = `New Order Received 📦

Order ID: ${order.orderNumber}
Customer: ${order.user?.name || 'Unknown'}
Phone: ${order.user?.phone || 'N/A'}
Amount: ₹${order.totalAmount.toLocaleString('en-IN')}

Please check Admin Dashboard for address & details.`;

        // Try to send SMS
        const client = getTwilioClient();
        if (!client) {
            // Log only if Twilio not configured
            console.log(`📫 [ADMIN SMS LOG - NOT SENT] To: ${formattedPhone}\n${message}`);
            // Still mark as attempted
            await Order.findByIdAndUpdate(order._id, {
                smsAdminSent: true
            });
            return { success: true, logged_only: true };
        }

        // Send via Twilio
        const result = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedPhone
        });

        // Update order - Admin SMS sent successfully
        await Order.findByIdAndUpdate(order._id, {
            smsAdminSent: true
        });

        console.log(`✅ Admin SMS sent for order ${order.orderNumber} (SID: ${result.sid})`);

        return {
            success: true,
            messageId: result.sid,
            phone: formattedPhone
        };
    } catch (err) {
        console.error(`❌ Failed to send admin SMS for order ${order.orderNumber}:`, err.message);

        // Don't fail the order - just log the error
        // Admin SMS is nice-to-have, not critical
        return {
            success: false,
            error: err.message,
            orderValid: true  // ← IMPORTANT: Order is valid even if SMS fails
        };
    }
};

/**
 * Send both user and admin SMS
 * Call this after order creation
 */
const sendOrderNotificationSMS = async (order) => {
    console.log(`📱 Sending SMS notifications for order ${order.orderNumber}...`);

    const userSMS = await sendUserConfirmationSMS(order);
    const adminSMS = await sendAdminNewOrderSMS(order);

    // Log results
    console.log('SMS Results:', {
        order: order.orderNumber,
        user: userSMS.success ? '✅ Sent' : `❌ Failed: ${userSMS.error}`,
        admin: adminSMS.success ? '✅ Sent' : `❌ Failed: ${adminSMS.error}`
    });

    return {
        user: userSMS,
        admin: adminSMS,
        orderValid: true  // Order is always valid regardless of SMS
    };
};

/**
 * Retry SMS for a specific order
 * Useful for manual retries if SMS failed initially
 */
const retryOrderSMS = async (orderId, resendUser = true, resendAdmin = true) => {
    try {
        const order = await Order.findById(orderId).populate('user', 'name phone email');
        if (!order) {
            throw new Error('Order not found');
        }

        const results = {};

        if (resendUser && !order.smsSent) {
            results.user = await sendUserConfirmationSMS(order);
        }

        if (resendAdmin && !order.smsAdminSent) {
            results.admin = await sendAdminNewOrderSMS(order);
        }

        return results;
    } catch (err) {
        console.error('Failed to retry SMS:', err.message);
        throw err;
    }
};

module.exports = {
    sendUserConfirmationSMS,
    sendAdminNewOrderSMS,
    sendOrderNotificationSMS,
    retryOrderSMS
};
