import User from '../models/User.js';

export const trackScan = async (req, res) => {
  // try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get client IP (handles proxy scenarios)
    const clientIP = req.headers['x-forwarded-for'] || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress || 
                    req.ip || 
                    'unknown';

    // Add scan data to analytics
    const scanData = {
      ip: clientIP,
      userAgent: req.get('User-Agent') || 'unknown',
      timestamp: new Date(),
      type: 'qr_scan' // Mark as QR scan
    };

    // Initialize analytics if it doesn't exist
    if (!user.analytics) {
      user.analytics = { views: [], clicks: [], qrScans: [] };
    }
    
    // Ensure qrScans array exists
    if (!user.analytics.qrScans) {
      user.analytics.qrScans = [];
    }

    // Add to both views and qrScans
    user.analytics.views.push(scanData);
    user.analytics.qrScans.push(scanData);
    
    await user.save();
    
    res.status(200).json({ 
      message: 'QR scan logged successfully',
      scanId: scanData._id,
      viewsCount: user.analytics.views.length,
      qrScansCount: user.analytics.qrScans.length
    });
  // } catch (err) {
  //   console.error('❌ Track scan error:', err);
  //   res.status(500).json({ message: 'Failed to log scan', error: err.message });
  // }
};

export const trackClick = async (req, res) => {
  const { platform } = req.body;
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Initialize analytics if it doesn't exist
    if (!user.analytics) {
      user.analytics = { views: [], clicks: [], qrScans: [] };
    }
    
    // Ensure qrScans array exists
    if (!user.analytics.qrScans) {
      user.analytics.qrScans = [];
    }

    user.analytics.clicks.push({ platform });
    await user.save();
    res.status(200).json({ message: 'Click logged' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAnalytics = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { views, clicks } = user.analytics || { views: [], clicks: [] };
  
  // Handle case where qrScans might not exist for existing users
  const qrScans = user.analytics?.qrScans || [];
  

  const groupedViews = views.reduce((acc, entry) => {
    const day = new Date(entry.timestamp).toISOString().split('T')[0];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  const platformClicks = clicks.reduce((acc, entry) => {
    acc[entry.platform] = (acc[entry.platform] || 0) + 1;
    return acc;
  }, {});

  // Group QR scans by date
  const groupedQrScans = qrScans.reduce((acc, entry) => {
    const day = new Date(entry.timestamp).toISOString().split('T')[0];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  const response = {
    totalViews: views.length,
    totalClicks: clicks.length,
    totalQrScans: qrScans.length,
    dailyViews: groupedViews,
    dailyQrScans: groupedQrScans,
    platformClicks,
  };
  
  console.log(`📊 Response:`, response);
  res.json(response);
};

