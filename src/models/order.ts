import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    shippingInfo: {
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      pinCode: {
        type: Number,
        required: true,
        validate: {
          validator: (value: number) => {
            const strValue = value.toString();
            return strValue.length === 6 && value > 0; // Check if it's 6 digits and positive
          },
          message: "PinCode must be a 6-digit number.",
        },
      },
      phoneNo: {
        type: Number,
        required: true,
        validate: {
          validator: (value: number) => {
            const strValue = value.toString();
            return strValue.length === 10 && value > 0; // Check if it's 10 digits and positive
          },
          message: "Phone Number must be a 10-digit number.",
        },
      },
    },
    user: {
      type: String,
      ref: "User",
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    shippingCharges: {
      type: Number,
      required: true,
      // default: 0,
    },
    // isShippingFree: {
    //   type: Boolean,
    //   // default: false,
    // },
    // amount: {
    //   type: Number,
    // },
    discount: {
      type: Number,
      required: true,
      // default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Processing", "Shipped", "Delivered"],
      // enum: ["Processing", "Shipped", "Delivered", "Pending", "Cancelled", "Placed"],
      default: "Processing",
    },
    orderItems: [
      {
        name: String,
        photo: String,
        price: Number,
        quantity: Number,
        productId: {
          type: mongoose.Types.ObjectId,
          ref: "Product",
        }
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model("Order", schema);
