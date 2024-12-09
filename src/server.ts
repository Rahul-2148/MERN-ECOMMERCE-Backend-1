import express from "express";
import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import NodeCache from "node-cache";
import {config} from "dotenv";
import morgan from "morgan";
import Stripe from "stripe";
import cors from "cors";

// Importing Routes
import userRoute from "./routes/user.js";
import productRoute from "./routes/products.js";
import orderRoute from "./routes/order.js";
import paymentRoute from "./routes/payment.js";
import dashboardRoute from "./routes/stats.js";

config ({
  path: "./.env",
})
const port = process.env.PORT || 4000;
const mongoURL = process.env.MONGODB_URL_LOCAL || "";

// Stripe Payment Gateway
const stripeKey = process.env.STRIPE_KEY || "";

connectDB(mongoURL);

export const stripe = new Stripe(stripeKey);
export const myCache = new NodeCache();

const app = express();

// Middleware
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());
// app.use(cors({
//   origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"], methods: ["GET", "POST", "PUT", "DELETE"], credentials: true,
// }));

app.get("/", (_req, res) => {
  res.status(200).send("API working with /api/v1");
});

// Using Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/dashboard", dashboardRoute);

app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
