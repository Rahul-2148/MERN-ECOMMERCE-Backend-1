import express, { RequestHandler } from "express";
import {
  allCoupons,
  applyDiscount,
  createCoupon,
  createPaymentIntent,
  deleteCoupon,
} from "../controller/payment.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

// Stripe Payment Gateway Route - /api/v1/payment/create
app.post("/create", createPaymentIntent as RequestHandler);

// Discount Route - /api/v1/payment/discount
app.get("/discount", applyDiscount as RequestHandler);

// Coupon Code Create by admin - Route - /api/v1/payment/coupon/new
app.post(
  "/coupon/new",
  adminOnly as RequestHandler,
  createCoupon as RequestHandler
);

// All Coupons - Route - /api/v1/payment/coupon/all
app.get(
  "/coupon/all",
  adminOnly as RequestHandler,
  allCoupons as RequestHandler
);

// Delete Coupons - Route - /api/v1/payment/coupon/:id
app.delete(
  "/coupon/:id",
  adminOnly as RequestHandler,
  deleteCoupon as RequestHandler
);

export default app;
