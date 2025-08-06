// //server.js

// import express from "express";
// import dotenv from "dotenv";
// import jwt from "jsonwebtoken";
// import cors from "cors";
// import mongoose from "mongoose";

// import authRoutes from "./routes/authRoutes.js";
// import userRoutes from "./routes/userRoutes.js";
// import adminRoutes from "./routes/adminRoutes.js";
// import themeRoutes from "./routes/themeRoutes.js";
// import linkRoutes from './routes/linkRoutes.js';
// import analyticsRoutes from './routes/analyticsRoutes.js';
// import paymentRoutes from './routes/paymentRoutes.js';
// import subscriptionRoutes from './routes/subscriptionRoutes.js';

// dotenv.config();
// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ✅ Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api", themeRoutes); // matches /api/theme
// app.use("/api/links", linkRoutes);
// app.use("/api", analyticsRoutes);
// app.use("/api/payment", paymentRoutes);
// app.use("/api/subscriptions", subscriptionRoutes);

// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log("✅ MongoDB connected");
//     app.listen(5000, () => console.log("✅ Server running on port 5000"));
//   })
//   .catch((err) => console.log("❌ MongoDB connection error:", err));


//server.js
//server.js

import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import themeRoutes from "./routes/themeRoutes.js";
import linkRoutes from './routes/linkRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import { handleWebhook } from './controllers/paymentController.js';
import bodyParser from 'body-parser';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", themeRoutes); // matches /api/theme
app.use("/api/links", linkRoutes);
app.use("/api", analyticsRoutes);

// Register the webhook route directly BEFORE express.json()
app.post('/api/payment/webhook', bodyParser.raw({ type: 'application/json' }), handleWebhook);

// Now apply express.json() for all other routes
app.use(express.json());

// Register all other payment routes (and others)
app.use("/api/payment", paymentRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(5000, () => console.log("✅ Server running on port 5000"));
  })
  .catch((err) => console.log("❌ MongoDB connection error:", err));
