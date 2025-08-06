import mongoose from 'mongoose';

const qrLinkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  links: {
    type: Array,
    default: []
  },
  image: {
    type: String,
    default: ''
  }
}, { timestamps: true });

const QRLink = mongoose.model('QRLink', qrLinkSchema);
export default QRLink;
