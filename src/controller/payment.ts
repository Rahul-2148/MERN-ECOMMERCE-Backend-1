import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import { stripe } from "../server.js";
import ErrorHandler from "../utils/utility-class.js";

// Create Stripe Payment Controller
export const createPaymentIntent = TryCatch(async (req, res, next) => {
  const { amount } = req.body; // const { amount, currency } = req.body; jb currency bhi choose krna ho

  if (!amount) return next(new ErrorHandler("Please enter amount", 400));

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Number(amount) * 100,
    currency: "inr",
    // description: "Payment for online purchase",
    // automatic_payment_methods: { enabled: true },
    // metadata: { integration_check: "accept_a_payment" },
  });

  return res.status(201).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
  });
});

// Create Coupon Controller
export const createCoupon = TryCatch(async (req, res, next) => {
  const { coupon, amount } = req.body;

  if (!coupon || !amount)
    return next(
      new ErrorHandler("Please enter both coupon code and amount", 400)
    );

  await Coupon.create({ couponCode: coupon, amount: amount });

  return res.status(201).json({
    success: true,
    message: `Coupon ${coupon.toUpperCase()} Created successfully`,
  });
});

// Discount Controller
export const applyDiscount = TryCatch(async (req, res, next) => {
  const { coupon } = req.query;

  const discount = await Coupon.findOne({ couponCode: coupon });

  if (!discount) return next(new ErrorHandler("Invalid Coupon Code", 404));

  return res.status(200).json({
    success: true,
    discount: discount.amount,
  });
});

//  All Coupons Controller
export const allCoupons = TryCatch(async (req, res, next) => {
  const coupons = await Coupon.find({});
  if (!coupons) return next(new ErrorHandler("No coupons found", 404));
  return res.status(200).json({
    success: true,
    coupons,
  });
});

// Delete Coupon Controller
export const deleteCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) return next(new ErrorHandler("No coupons found", 404));

  // await invalidateCache({ coupon: true});

  return res.status(200).json({
    success: true,
    message: `Coupon ${coupon.couponCode} deleted successfully`,
  });
});
