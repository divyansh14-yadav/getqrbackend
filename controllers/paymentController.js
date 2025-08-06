import Stripe from 'stripe';
import User from '../models/User.js';
import dotenv from "dotenv"

dotenv.config()

const stripe = new Stripe(process.env.STRIPE_SECRET);

const STRIPE_WEEKLY_PRICE_ID = process.env.STRIPE_WEEKLY_PRICE_ID;
const STRIPE_MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID;





export const createCheckoutSession = async (req, res) => {
  try {
    const { planType } = req.body; // 'weekly' or 'monthly'
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!planType || !['weekly', 'monthly'].includes(planType)) {
      return res.status(400).json({ message: 'Invalid plan type. Must be weekly or monthly.' });
    }

    // Get the appropriate price ID based on plan type
    const priceId = planType === 'weekly' 
      ? STRIPE_WEEKLY_PRICE_ID 
      : STRIPE_MONTHLY_PRICE_ID;

    if (!priceId) {
      return res.status(500).json({ message: 'Price ID not configured for this plan.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      
      success_url: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/cancel`,
      customer_email: user.email,
      // metadata: {
      //   userId: userId,
      //   planType: planType
      // },
      subscription_data: {
        metadata: {
          userId: userId,
          planType: planType
        }
      }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Payment session creation error:', err);
    res.status(500).json({ message: err.message });
  }
};

export const createPortalSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user.stripeCustomerId) {
      return res.status(400).json({ message: 'No subscription found for this user.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Portal session creation error:', err);
    res.status(500).json({ message: err.message });
  }
};

export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
    console.log('SIG:', sig);
  console.log('RAW BODY:', req.body);
  console.log('SECRET:', process.env.STRIPE_WEBHOOK_SECRET);
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
 
  }




  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }

};
const handleSubscriptionUpdate = async (subscription) => {
  const userId = subscription.metadata?.userId;
  const planType = subscription.metadata?.planType;

  const user = await User.findById(userId);

  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  user.subscription = planType;
  user.subscriptionExpires = currentPeriodEnd;
  user.stripeCustomerId = subscription.customer;
  user.stripeSubscriptionId = subscription.id;
  user.isActive = subscription.status === 'active';

  await user.save();
};

const handleSubscriptionCancellation = async (subscription) => {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const user = await User.findById(userId);
  if (!user) return;

  user.subscription = 'trial';
  user.subscriptionExpires = null;
  user.isActive = false;

  await user.save();
  console.log(`❌ Subscription cancelled for user ${userId}`);
};
const handlePaymentSucceeded = async (invoice) => {
  console.log("called")
  let lines = invoice.lines?.data;
  if (!lines) {
    const fullInvoice = await stripe.invoices.retrieve(invoice.id, { expand: ['lines'] });
    lines = fullInvoice.lines.data;
  }

  for (const line of lines) {
    console.log("LINE METADATA:", line.metadata);
    const { userId, planType } = line.metadata || {};
    console.log(userId,"userId")
    console.log(planType,"planType")
    if (userId && planType) {
      const user = await User.findById(userId);
      if (!user) {
        console.log("User not found for userId:", userId);
        continue;
      }
      // Calculate subscription expiration
      const currentPeriodEnd = new Date(line.period.end * 1000);
      user.subscription = planType;
      user.subscriptionExpires = currentPeriodEnd;
      user.stripeCustomerId = invoice.customer;
      user.stripeSubscriptionId = invoice.subscription;
      user.isActive = true;
      await user.save();
      console.log("User updated:", user);
    }
  }
};
const handlePaymentFailed = async (subscription) => {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const user = await User.findById(userId);
  if (!user) return;

  user.isActive = false;
  await user.save();
  console.log(`🚫 Payment failed: user ${userId} deactivated`);
};
