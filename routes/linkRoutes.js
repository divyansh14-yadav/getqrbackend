import express from "express";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Function to handle subscription downgrade - disable excess links
const handleSubscriptionDowngrade = async (user) => {
  const featureAccess = user.getFeatureAccess();
  const maxLinks = featureAccess.maxLinks;
  const enabledLinks = user.links.filter(link => link.enabled);
  
  if (enabledLinks.length <= maxLinks) {
    return false; // No downgrade needed
  }
  
  // Get the excess count
  const excessCount = enabledLinks.length - maxLinks;
  
  // Find the last N enabled links and disable them
  const linksToDisable = enabledLinks.slice(-excessCount);
  
  // Disable the excess links
  linksToDisable.forEach(link => {
    link.enabled = false;
  });
  
  await user.save();
  console.log(`✅ Subscription downgrade: Disabled ${excessCount} excess links for user ${user._id}`);
  return true;
};

// GET link limits and usage info
router.get("/limits", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check for subscription downgrade and disable excess links
    const downgradeApplied = await handleSubscriptionDowngrade(user);

    const featureAccess = user.getFeatureAccess();
    const currentLinksCount = user.links.length;
    const enabledLinksCount = user.links.filter(link => link.enabled).length;

    res.json({
      subscription: user.subscription,
      currentLinks: currentLinksCount,
      enabledLinks: enabledLinksCount,
      maxLinks: featureAccess.maxLinks,
      remainingLinks: featureAccess.maxLinks - currentLinksCount,
      canCreateMore: currentLinksCount < featureAccess.maxLinks,
      featureAccess: featureAccess,
      downgradeApplied: downgradeApplied
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch link limits", error: err.message });
  }
});

// GET all links for current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Check for subscription downgrade and disable excess links
    const downgradeApplied = await handleSubscriptionDowngrade(user);
    
    res.json({
      links: user.links,
      downgradeApplied: downgradeApplied
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch links", error: err.message });
  }
});

// POST new link
router.post("/", authMiddleware, async (req, res) => {
  const { platform, url } = req.body;
  if (!platform || !url) return res.status(400).json({ message: "Platform and URL required" });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check subscription limits
    const featureAccess = user.getFeatureAccess();
    const currentLinksCount = user.links.length;
    
    if (currentLinksCount >= featureAccess.maxLinks) {
      return res.status(403).json({ 
        message: `You can only create ${featureAccess.maxLinks} links with your current subscription. Upgrade to create more links.`,
        currentLinks: currentLinksCount,
        maxLinks: featureAccess.maxLinks,
        subscription: user.subscription
      });
    }

    user.links.push({ platform, url, enabled: true });
    await user.save();
    
    res.status(201).json({
      message: "Link created successfully",
      links: user.links,
      remainingLinks: featureAccess.maxLinks - (currentLinksCount + 1)
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to add link", error: err.message });
  }
});

// PUT update link by index
router.put("/:index", authMiddleware, async (req, res) => {
  const { platform, url } = req.body;
  const index = parseInt(req.params.index);

  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.links[index]) return res.status(404).json({ message: "Link not found" });

    user.links[index] = { platform, url, enabled: user.links[index].enabled };
    await user.save();
    res.json(user.links);
  } catch (err) {
    res.status(500).json({ message: "Failed to update link", error: err.message });
  }
});

// PATCH enable/disable link by index
router.patch("/:index/toggle", authMiddleware, async (req, res) => {
  const index = parseInt(req.params.index);

  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.links[index]) {
      return res.status(404).json({ message: "Link not found" });
    }

    const featureAccess = user.getFeatureAccess();
    const currentEnabledCount = user.links.filter(link => link.enabled).length;
    
    // If trying to enable a link, check subscription limit
    if (!user.links[index].enabled && currentEnabledCount >= featureAccess.maxLinks) {
      return res.status(403).json({ 
        message: `You can only enable ${featureAccess.maxLinks} links with your current subscription. Upgrade to enable more links.`,
        currentEnabled: currentEnabledCount,
        maxLinks: featureAccess.maxLinks,
        subscription: user.subscription
      });
    }

    // Toggle the enabled status
    user.links[index].enabled = !user.links[index].enabled;
    await user.save();
    
    res.json({ 
      message: `Link ${user.links[index].enabled ? 'enabled' : 'disabled'} successfully`,
      link: user.links[index],
      allLinks: user.links,
      enabledCount: user.links.filter(link => link.enabled).length,
      maxLinks: featureAccess.maxLinks
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle link", error: err.message });
  }
});

// PATCH enable specific link by index
router.patch("/:index/enable", authMiddleware, async (req, res) => {
  const index = parseInt(req.params.index);

  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.links[index]) {
      return res.status(404).json({ message: "Link not found" });
    }

    const featureAccess = user.getFeatureAccess();
    const currentEnabledCount = user.links.filter(link => link.enabled).length;
    
    // Check subscription limit before enabling
    if (currentEnabledCount >= featureAccess.maxLinks) {
      return res.status(403).json({ 
        message: `You can only enable ${featureAccess.maxLinks} links with your current subscription. Upgrade to enable more links.`,
        currentEnabled: currentEnabledCount,
        maxLinks: featureAccess.maxLinks,
        subscription: user.subscription
      });
    }

    user.links[index].enabled = true;
    await user.save();
    
    res.json({ 
      message: "Link enabled successfully",
      link: user.links[index],
      allLinks: user.links,
      enabledCount: user.links.filter(link => link.enabled).length,
      maxLinks: featureAccess.maxLinks
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to enable link", error: err.message });
  }
});

// PATCH disable specific link by index
router.patch("/:index/disable", authMiddleware, async (req, res) => {
  const index = parseInt(req.params.index);

  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.links[index]) {
      return res.status(404).json({ message: "Link not found" });
    }

    user.links[index].enabled = false;
    await user.save();
    
    res.json({ 
      message: "Link disabled successfully",
      link: user.links[index],
      allLinks: user.links
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to disable link", error: err.message });
  }
});

// GET enabled links only
router.get("/enabled", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("links");
    if (!user) return res.status(404).json({ message: "User not found" });
    
    const enabledLinks = user.links.filter(link => link.enabled);
    res.json(enabledLinks);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch enabled links", error: err.message });
  }
});

// DELETE link by index
router.delete("/:index", authMiddleware, async (req, res) => {
  const index = parseInt(req.params.index);
  try {
    const user = await User.findById(req.user.id);
    if (!user || index < 0 || index >= user.links.length) {
      return res.status(404).json({ message: "Link not found" });
    }
    user.links.splice(index, 1);
    await user.save();
    res.json(user.links);
  } catch (err) {
    res.status(500).json({ message: "Failed to delete link", error: err.message });
  }
});

export default router