import QRLink from '../models/QRLink.js';

export const saveLinks = async (req, res) => {
  try {
    const { links, image } = req.body;
    const userId = req.user.id;

    const existing = await QRLink.findOne({ userId });
    if (existing) {
      existing.links = links;
      if (image) existing.image = image;
      await existing.save();
      return res.json(existing);
    }

    const qr = await QRLink.create({ userId, links, image });
    res.json(qr);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getLinks = async (req, res) => {
  try {
    const userId = req.params.userId;
    const qr = await QRLink.findOne({ userId });
    if (!qr) return res.status(404).json({ message: 'QR code not found' });
    res.json(qr);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};