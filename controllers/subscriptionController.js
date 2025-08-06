import { checkSubscriptionStatus, getSubscriptionDetails } from '../utils/subscriptionUtils.js';
import User from '../models/User.js';

export const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const status = await checkSubscriptionStatus(userId);
    
    if (status.isValid) {
      const planDetails = getSubscriptionDetails(status.subscription);
      res.json({
        success: true,
        subscription: status.subscription,
        expiresAt: status.expiresAt,
        planDetails: planDetails,
        isActive: true
      });
    } else {
      const planDetails = getSubscriptionDetails(status.subscription);
      res.json({
        success: false,
        subscription: status.subscription,
        message: status.message,
        planDetails: planDetails,
        isActive: false
      });
    }
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting subscription status' 
    });
  }
};

export const getAvailablePlans = async (req, res) => {
  try {
    const plans = {
      weekly: getSubscriptionDetails('weekly'),
      monthly: getSubscriptionDetails('monthly')
    };

    res.json({
      success: true,
      plans: plans
    });
  } catch (error) {
    console.error('Error getting available plans:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting available plans' 
    });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No active subscription found' 
      });
    }

    // Update user subscription to trial
    user.subscription = 'trial';
    user.subscriptionExpires = null;
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: 'trial'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error cancelling subscription' 
    });
  }
}; 