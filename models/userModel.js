import mongoose from "mongoose";

// Sub-schemas
const linkSchema = new mongoose.Schema({
  platform: { type: String, required: true },
  url: { type: String, required: true },
});

const viewSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    ip: String,
    userAgent: String,
  },
  { _id: false }
);

const clickSchema = new mongoose.Schema(
  {
    platform: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Main schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  displayName: { type: String, default: "" },
  bio: { type: String, default: "" },
  profileImage: { type: String, default: "/profile-placeholder.png" },
  introText: { type: String, default: '' },
  headerImage: { type: String, default: '' },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  links: [linkSchema],
  subscription: {
    type: String,
    default: "trial",
    enum: ["trial", "weekly", "monthly", "lifetime"],
  },
  trialExpires: Date,
  deviceId: String,
  analytics: {
    views: [viewSchema],
    clicks: [clickSchema],
  },
});

userSchema.methods.getFeatureAccess = function () {
  switch (this.subscription) {
    case "weekly":
      return { maxLinks: 3, canCustomizeQR: false, analytics: true };
    case "monthly":
      return { maxLinks: 10, canCustomizeQR: true, analytics: true };
    case "lifetime":
      return { maxLinks: 20, canCustomizeQR: true, analytics: true };
    default:
      return { maxLinks: 2, canCustomizeQR: false, analytics: false };
  }
};

const User = mongoose.model("User", userSchema);
export default User;