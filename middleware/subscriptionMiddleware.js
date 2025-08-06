import { checkSubscriptionStatus } from '../utils/subscriptionUtils.js';

export const requireSubscription = (requiredPlan = 'weekly') => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const status = await checkSubscriptionStatus(userId);

      if (!status.isValid) {
        return res.status(403).json({
          success: false,
          message: 'Active subscription required',
          subscription: status.subscription
        });
      }

      // Check if user has the required plan level
      const planHierarchy = {
        'trial': 0,
        'weekly': 1,
        'monthly': 2,
        'yearly': 3,
        'lifetime': 4,
        'business': 5
      };

      const userPlanLevel = planHierarchy[status.subscription] || 0;
      const requiredPlanLevel = planHierarchy[requiredPlan] || 0;

      if (userPlanLevel < requiredPlanLevel) {
        return res.status(403).json({
          success: false,
          message: `${requiredPlan} subscription or higher required`,
          currentPlan: status.subscription,
          requiredPlan: requiredPlan
        });
      }

      next();
    } catch (error) {
      console.error('Subscription middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking subscription status'
      });
    }
  };
};

export const checkFeatureAccess = (feature) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const status = await checkSubscriptionStatus(userId);

      if (!status.isValid) {
        return res.status(403).json({
          success: false,
          message: 'Active subscription required for this feature',
          feature: feature
        });
      }

      // Define feature access based on subscription
      const featureAccess = {
        'customize_qr': ['monthly', 'yearly', 'lifetime', 'business'],
        'advanced_analytics': ['monthly', 'yearly', 'lifetime', 'business'],
        'unlimited_links': ['monthly', 'yearly', 'lifetime', 'business'],
        'basic_analytics': ['trial', 'weekly', 'monthly', 'yearly', 'lifetime', 'business']
      };

      const allowedPlans = featureAccess[feature] || [];
      
      if (!allowedPlans.includes(status.subscription)) {
        return res.status(403).json({
          success: false,
          message: `This feature requires a higher subscription plan`,
          feature: feature,
          currentPlan: status.subscription,
          requiredPlans: allowedPlans
        });
      }

      next();
    } catch (error) {
      console.error('Feature access middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking feature access'
      });
    }
  };
}; 