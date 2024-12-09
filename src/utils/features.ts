import mongoose from "mongoose";
import { Coupon } from "../models/coupon.js";
import { Product } from "../models/product.js";
import { myCache } from "../server.js";
import { invalidateCacheProps, OrderItemType } from "../types/types.js";

// Connect to MongoDB
export const connectDB = (url: string) => {
  mongoose
    .connect(url, {
      dbName: "Ecommerce_24",
    })
    .then((c) => console.log(`DB Connected to ${c.connection.host}`))
    .catch((e) => console.log(e));
};

// This is for revalidate data in caching
export const invalidateCache = ({
  product,
  order,
  admin,
  userId,
  orderId,
  productId,
}: // coupon,
// couponId,
invalidateCacheProps) => {
  if (product) {
    const productKeys: string[] = [
      "latest-products",
      "categories",
      "all-products",
    ];

    if (typeof productId === "string") productKeys.push(`product-${productId}`);

    if (typeof productId === "object")
      productId.forEach((i) => productKeys.push(`product-${i}`));

    myCache.del(productKeys);
  }
  if (order) {
    const orderKeys: string[] = [
      "all-orders",
      `my-orders-${userId}`,
      `order-${orderId}`,
    ];
    myCache.del(orderKeys);
  }
  if (admin) {
    myCache.del([
      "admin-stats",
      "admin-pie-charts",
      "admin-bar-charts",
      "admin-line-charts",
    ]);
  }
  // if ( coupon) {
  //   const paymentKeys: string[] = [
  //     "all-coupons",
  //   ];
  //   myCache.del(paymentKeys);
  // }
};

// This is for Reduce Stock after Order Placed
export const reduceStock = async (orderItems: OrderItemType[]) => {
  for (let i = 0; i < orderItems.length; i++) {
    const order = orderItems[i];
    const product = await Product.findById(order.productId);
    if (!product)
      throw new Error(`Product with id ${order.productId} not found`);
    product.stock = product.stock - order.quantity;
    await product.save();
  }
};

// This is for Calculate absolute pecentage of last month and this month
export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) return thisMonth * 100;
  const percent = (thisMonth / lastMonth) * 100;
  return Number(percent.toFixed(0));
};

// This is Inventories of percent count of all categories
export const getInventories = async ({
  categories,
  productsCount,
}: {
  categories: string[];
  productsCount: number;
}) => {
  const categoriesCountPromise = categories.map((category) =>
    Product.countDocuments({ category })
  );

  const categoriesCount = await Promise.all(categoriesCountPromise);

  const categoryCount: Record<string, number>[] = [];

  categories.forEach((category, i) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / productsCount) * 100),
    });
  });

  return categoryCount;
};

// type of docArr Document - date createdAt
interface MyDocument extends mongoose.Document {
  createdAt: Date;
  discount?: number;
  total?: number;
}
// type of lenth and docArr
type FuncProps = {
  length: number;
  docArr: MyDocument[];
  today: Date;
  property?: "discount" | "total";
};

//  ChartData used in our stats bar chart
export const getChartData = ({
  length,
  docArr,
  today,
  property,
}: FuncProps) => {
  const data: number[] = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationDate = i.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
    // const monthDiff = today.getFullYear() * 12 + today.getMonth() - (creationDate.getFullYear() * 12 + creationDate.getMonth());

    if (monthDiff < length) {
      if (property) {
        data[length - monthDiff - 1] += i[property]!;
      } else {
        data[length - monthDiff - 1] += 1;
      }
    }
  });

  return data;
};
