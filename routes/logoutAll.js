router.post('/logoutAll', protect, async (req, res) => {
  const user = await User.findById(req.user.id);
  user.deviceId = null;
  await user.save();
  res.json({ message: 'Logged out all devices' });
});
