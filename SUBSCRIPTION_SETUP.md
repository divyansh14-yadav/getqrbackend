# Subscription System Setup Guide

## Overview
This implementation provides weekly and monthly subscription plans with Stripe integration for payment processing.

## Features
- ✅ Weekly Plan (₹99/week)
- ✅ Monthly Plan (₹299/month)
- ✅ Automatic subscription management
- ✅ Webhook handling for payment events
- ✅ Subscription status checking
- ✅ Feature access control
- ✅ Billing portal integration

## Environment Variables Required

Add these to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Client URL
CLIENT_URL=http://localhost:3000
```

## Stripe Setup Instructions

### 1. Automatic Product and Price Creation

The system automatically creates products and prices in Stripe when needed. No manual setup required!

**Weekly Plan:**
- Amount: ₹99 (9900 in paise)
- Billing period: Weekly
- Currency: INR

**Monthly Plan:**
- Amount: ₹299 (29900 in paise)
- Billing period: Monthly
- Currency: INR

The system will:
1. Check if products exist with the correct names
2. Create products if they don't exist
3. Check if prices exist with the correct configuration
4. Create prices if they don't exist
5. Use the existing products/prices if they already exist

### 2. Set up Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/payments/webhook`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret (starts with `whsec_`)

## API Endpoints

### Payment Endpoints

#### Create Checkout Session
```http
POST /api/payments/create-checkout-session
Authorization: Bearer <token>
Content-Type: application/json

{
  "planType": "weekly" // or "monthly"
}
```

#### Create Portal Session
```http
POST /api/payments/create-portal-session
Authorization: Bearer <token>
```

#### Webhook (Stripe)
```http
POST /api/payments/webhook
Content-Type: application/json
```

### Subscription Endpoints

#### Get Subscription Status
```http
GET /api/subscriptions/status
Authorization: Bearer <token>
```

#### Get Available Plans
```http
GET /api/subscriptions/plans
```

#### Cancel Subscription
```http
POST /api/subscriptions/cancel
Authorization: Bearer <token>
```

## Subscription Plans

### Trial Plan (Free)
- Max Links: 2
- QR Customization: ❌
- Analytics: ✅ Basic
- Duration: 7 days

### Weekly Plan (₹99/week)
- Max Links: 3
- QR Customization: ❌
- Analytics: ❌
- Duration: 7 days

### Monthly Plan (₹299/month)
- Max Links: Unlimited
- QR Customization: ✅
- Analytics: ✅ Advanced
- Duration: 30 days

## Usage Examples

### Frontend Integration

#### 1. Create Checkout Session
```javascript
const createCheckout = async (planType) => {
  try {
    const response = await fetch('/api/payments/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ planType })
    });
    
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    }
  } catch (error) {
    console.error('Error creating checkout:', error);
  }
};
```

#### 2. Check Subscription Status
```javascript
const checkSubscription = async () => {
  try {
    const response = await fetch('/api/subscriptions/status', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log('Subscription:', data);
  } catch (error) {
    console.error('Error checking subscription:', error);
  }
};
```

#### 3. Get Available Plans
```javascript
const getPlans = async () => {
  try {
    const response = await fetch('/api/subscriptions/plans');
    const data = await response.json();
    console.log('Available plans:', data.plans);
  } catch (error) {
    console.error('Error getting plans:', error);
  }
};
```

## Middleware Usage

### Protect Routes by Subscription Level
```javascript
import { requireSubscription } from '../middleware/subscriptionMiddleware.js';

// Require weekly subscription or higher
router.get('/premium-feature', requireSubscription('weekly'), (req, res) => {
  // Route logic
});

// Require monthly subscription or higher
router.get('/advanced-feature', requireSubscription('monthly'), (req, res) => {
  // Route logic
});
```

### Check Specific Feature Access
```javascript
import { checkFeatureAccess } from '../middleware/subscriptionMiddleware.js';

// Check QR customization access
router.post('/customize-qr', checkFeatureAccess('customize_qr'), (req, res) => {
  // Route logic
});

// Check unlimited links access
router.post('/add-link', checkFeatureAccess('unlimited_links'), (req, res) => {
  // Route logic
});
```

## Database Schema Updates

The User model has been updated with these new fields:

```javascript
{
  subscription: String, // "trial", "weekly", "monthly", etc.
  subscriptionExpires: Date,
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  isActive: Boolean
}
```

## Testing

### Test Webhook Locally
1. Install Stripe CLI
2. Run: `stripe listen --forward-to localhost:5000/api/payments/webhook`
3. Copy the webhook secret to your `.env` file

### Test Payment Flow
1. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
2. Use any future expiry date
3. Use any 3-digit CVC

## Error Handling

The system handles these scenarios:
- ✅ Expired subscriptions
- ✅ Failed payments
- ✅ Cancelled subscriptions
- ✅ Invalid plan types
- ✅ Missing Stripe configuration

## Security Notes

1. Always verify webhook signatures
2. Use HTTPS in production
3. Keep Stripe keys secure
4. Validate user permissions before processing payments
5. Log all payment events for audit

## Support

For issues or questions:
1. Check Stripe Dashboard for payment status
2. Verify webhook configuration
3. Check server logs for errors
4. Ensure all environment variables are set correctly 