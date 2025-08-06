// models/themeModel.js
import mongoose from "mongoose";

const themeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  primaryColor: {
    type: String,
    default: "#000000",
  },
  backgroundStyle: {
    type: String,
    default: "light",
  },
  fontStyle: {
    type: String,
    default: "default",
  },
});

const Theme = mongoose.model("Theme", themeSchema);

export default Theme;
