import mongoose from "mongoose";

const schema = new mongoose.Schema ({
    couponCode: {
        type: String,
        required: [true, "Please enter the Coupon Code"],
        unique: [true, "Coupon Code already exists"],
        uppercase: String(true), // Automatically converts to uppercase
        trim: String(true), // Removes leading and trailing whitespaces
    },
    amount: {
        type: Number,
        required: [true, "Please enter the Discount Amount"],
        min: [0, "Coupon Amount must be greater than or equal to zero"],
    },
    expiryDate: {
        type: Date,
        required: false,
    },
    isUsed: {
        type: Boolean,
        default: false,
    },
    usageCount: {
        type: Number,
        default: 0,
    },
    maxUsage: {
        type: Number,
        default: Infinity,
    },
});

export const Coupon = mongoose.model("Coupon", schema);