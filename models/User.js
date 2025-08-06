// models/User.js
import mongoose from "mongoose";

const linkSchema = new mongoose.Schema({
  platform: { type: String, required: true },
  url: { type: String, required: true },
  enabled: { type: Boolean, default: true },
});

const analyticsSchema = new mongoose.Schema({
  views: [{
    ip: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now }
  }],
  clicks: [{
    platform: String,
    timestamp: { type: Date, default: Date.now }
  }],
  qrScans: [{
    ip: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now },
    type: { type: String, default: 'qr_scan' }
  }]
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, unique: true },
  displayName: { type: String, default: "" },
  bio: { type: String, default: "" },
  profileImage: { type: String},
  role: { type: String, enum: ["user", "admin"], default: "user" },
  links: [linkSchema],
  analytics: { type: analyticsSchema, default: () => ({ views: [], clicks: [], qrScans: [] }) },
  subscription: {
    type: String,
    default: "trial",
    enum: ["trial", "weekly", "monthly", "yearly", "lifetime", "business"],
  },
  subscriptionExpires: Date,
  trialExpires: Date,
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  isActive: { type: Boolean, default: true },
  deviceId: String,
  qrPageSettings: {
    backgroundColor: { type: String, default: "#ffffff" },
    buttonStyle: { type: String, default: "rounded" },
    font: { type: String, default: "Inter" },
    layout: { type: String, default: "default" },
    theme: { type: String, default: "light" },
    // QR Code Customization
    qrShape: { type: String, enum: ["square", "rounded", "circle"], default: "square" },
    qrColor: { type: String, default: "#000000" },
  },
  otp: {
    type: Number,
  },
  
isEmail_verification: {
    type: Boolean,
    default: false,
  },
  isForgetPurpose: {
    type: String
  },
});

// Feature access logic based on subscription type
userSchema.methods.getFeatureAccess = function () {
  switch (this.subscription) {
    case "weekly":
      return {
        maxLinks: 3,
        canCustomizeQR: false,
        canSeeAnalytics: false,
      };
    case "monthly":
      return {
        maxLinks: Infinity,
        canCustomizeQR: true,
        canSeeAnalytics: true,
      };
    case "yearly":
      return {
        maxLinks: Infinity,
        canCustomizeQR: true,
        canSeeAnalytics: true,
        referralRewards: true,
      };
    case "lifetime":
      return {
        maxLinks: Infinity,
        canCustomizeQR: true,
        canSeeAnalytics: true,
        everything: true,
      };
    case "business":
      return {
        maxLinks: Infinity,
        canCustomizeQR: true,
        canSeeAnalytics: true,
        brandingRemoval: true,
        adminPanel: true,
      };
    case "trial":
    default:
      return {
        maxLinks: 2,
        canCustomizeQR: false,
        canSeeAnalytics: true,
      };
  }
};

const User = mongoose.model("User", userSchema);
export default User;