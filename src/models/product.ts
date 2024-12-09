import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter a product name"],
    },
    photo: {
        type: String,
        required: [true, "Please upload a product photo"],
    },
    price: {
        type: Number,
        required: [true, "Please enter a product price"],
    },
    stock: {
        type: Number,
        required: [true, "Please enter a product stock"],
    },
    category: {
        type: String,
        required: [true, "Please select a product category"],
        trim: true,
    },
    // ShippingCost: {
    //   type: Number,
    //   default: 0,
    // },
    // description: {
    //     type: String,
    //     required: [true, "Please enter a product description"],
    // },
  },
  {
    timestamps: true,
  }
);

export const Product = mongoose.model("Product", schema);
