const deviceLock = (req, res, next) => {
  const { deviceId } = req.body;
  if (!deviceId) return res.status(400).json({ message: 'Device ID required' });
  next();
};

export default deviceLock;