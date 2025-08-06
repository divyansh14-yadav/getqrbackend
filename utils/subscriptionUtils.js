import User from '../models/User.js';

export const checkSubscriptionStatus = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { isValid: false, message: 'User not found' };
    }

    // Check if subscription has expired
    if (user.subscriptionExpires && new Date() > user.subscriptionExpires) {
      // Update user to trial if subscription expired
      user.subscription = 'trial';
      user.subscriptionExpires = null;
      user.isActive = false;
      await user.save();
      
      return { 
        isValid: false, 
        message: 'Subscription has expired',
        subscription: 'trial'
      };
    }

    // Check if user is active
    if (!user.isActive) {
      return { 
        isValid: false, 
        message: 'Subscription is inactive',
        subscription: user.subscription
      };
    }

    return { 
      isValid: true, 
      subscription: user.subscription,
      expiresAt: user.subscriptionExpires
    };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return { isValid: false, message: 'Error checking subscription status' };
  }
};

export const getSubscriptionDetails = (subscriptionType) => {
  const plans = {
    trial: {
      name: 'Free Trial',
      maxLinks: 2,
      canCustomizeQR: false,
      canSeeAnalytics: true,
      price: 0,
      duration: '7 days'
    },
    weekly: {
      name: 'Weekly Plan',
      maxLinks: 3,
      canCustomizeQR: false,
      canSeeAnalytics: false,
      price: 99, // ₹99 per week
      duration: '7 days'
    },
    monthly: {
      name: 'Monthly Plan',
      maxLinks: Infinity,
      canCustomizeQR: true,
      canSeeAnalytics: true,
      price: 299, // ₹299 per month
      duration: '30 days'
    }
  };

  return plans[subscriptionType] || plans.trial;
};

export const calculateExpirationDate = (planType) => {
  const now = new Date();
  
  switch (planType) {
    case 'weekly':
      return new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
    case 'monthly':
      return new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
    default:
      return new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days for trial
  }
}; 