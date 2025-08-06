export default function checkFeatureAccess(feature) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const access = user.getFeatureAccess();

    if (feature === "customQR" && !access.canCustomizeQR) {
      return res.status(403).json({ message: "Upgrade your plan to customize QR codes." });
    }

    if (feature === "analytics" && !access.canSeeAnalytics) {
      return res.status(403).json({ message: "Upgrade your plan to view analytics." });
    }

    next();
  };
}
