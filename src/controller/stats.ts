import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { myCache } from "../server.js";
import {
  calculatePercentage,
  getChartData,
  getInventories,
} from "../utils/features.js";

// Dashboard Stats Controller
export const getDashboardStats = TryCatch(async (req, res, next) => {
  let stats;

  const key = "admin-stats";

  if (myCache.has(key)) stats = JSON.parse(myCache.get(key) as string);
  else {
    const today = new Date();
    const sixMonthAgo = new Date();
    sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);

    const thisMonth = {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: today,
    };

    const lastMonth = {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: new Date(today.getFullYear(), today.getMonth(), 0),
    };

    // Product promise
    const thisMonthProductsPromise = Product.find({
      createdAt: {
        $gte: thisMonth.start,
        $lt: thisMonth.end,
      },
    });

    const lastMonthProductsPromise = Product.find({
      createdAt: {
        $gte: lastMonth.start,
        $lt: lastMonth.end,
      },
    });

    // User promise
    const thisMonthUsersPromise = User.find({
      createdAt: {
        $gte: thisMonth.start,
        $lt: thisMonth.end,
      },
    });

    const lastMonthUsersPromise = User.find({
      createdAt: {
        $gte: lastMonth.start,
        $lt: lastMonth.end,
      },
    });

    // Order promise
    const thisMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: thisMonth.start,
        $lt: thisMonth.end,
      },
    });

    const lastMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: lastMonth.start,
        $lt: lastMonth.end,
      },
    });

    // for Revenue and Transaction of last six months chart
    const lastSixMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: sixMonthAgo,
        $lt: today,
      },
    });

    // Top 4 latest Transactions in Dashboard
    const latestTransactionsPromise = Order.find({})
      .select(["orderItems", "discount", "total", "status"])
      .sort({ createdAt: -1 })
      .limit(4);

    const [
      thisMonthProducts,
      lastMonthProducts,
      thisMonthUsers,
      lastMonthUsers,
      thisMonthOrders,
      lastMonthOrders,
      productsCount,
      usersCount,
      allOrders,
      lastSixMonthOrders,
      categories,
      femaleUsersCount,
      latestTransactions,
    ] = await Promise.all([
      thisMonthProductsPromise,
      lastMonthProductsPromise,
      thisMonthUsersPromise,
      lastMonthUsersPromise,
      thisMonthOrdersPromise,
      lastMonthOrdersPromise,
      Product.countDocuments(),
      User.countDocuments(),
      Order.find({}).select("total"),
      lastSixMonthOrdersPromise,
      Product.distinct("category"),
      User.countDocuments({ gender: "female" }),
      latestTransactionsPromise,
    ]);

    const thisMonthRevenue = thisMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const lastMonthRevenue = lastMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const changePercent = {
      revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
      product: calculatePercentage(
        thisMonthProducts.length,
        lastMonthProducts.length
      ),
      user: calculatePercentage(thisMonthUsers.length, lastMonthUsers.length),
      order: calculatePercentage(
        thisMonthOrders.length,
        lastMonthOrders.length
      ),
    };

    const revenue = allOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const counts = {
      revenue,
      product: productsCount,
      user: usersCount,
      order: allOrders.length,
    };

    // for Revenue and Transaction of last six months chart ka hi continue
    const orderMonthCounts = new Array(6).fill(0);
    const orderMonthlyRevenue = new Array(6).fill(0);

    lastSixMonthOrders.forEach((order) => {
      const creationDate = order.createdAt;
      const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

      if (monthDiff < 6) {
        orderMonthCounts[6 - monthDiff - 1] += 1;
        orderMonthlyRevenue[6 - monthDiff - 1] += order.total;
      }
    });

    // Inventories of Categories coming from ./utils/features file in Dashboard
    const categoryCount = await getInventories({
      categories,
      productsCount,
    });

    // for genders male and female users in dashboard
    const userRatio = {
      male: usersCount - femaleUsersCount,
      female: femaleUsersCount,
    };

    const modifiedLatestTransaction = latestTransactions.map((i) => ({
      _id: i._id,
      discount: i.discount,
      amount: i.total,
      quantity: i.orderItems.length,
      status: i.status,
    }));

    stats = {
      categoryCount,
      changePercent,
      counts,
      chart: {
        order: orderMonthCounts,
        revenue: orderMonthlyRevenue,
      },
      userRatio,
      latestTransactions: modifiedLatestTransaction,
    };

    myCache.set(key, JSON.stringify(stats));
  }

  return res.status(200).json({
    success: true,
    stats,
  });
});

// Dashboard Pie & Doughnut Chart - Order Fulfillment Controller
export const getPieCharts = TryCatch(async (req, res, next) => {
  let charts;

  const key = "admin-pie-charts";

  if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
  else {
    const allOrderPromise = Order.find({}).select([
      "total",
      "discount",
      "subtotal",
      "tax",
      "shippingCharges",
    ]);

    const [
      processingOrder,
      shippedOrder,
      deliveredOrder,
      categories,
      productsCount,
      outOfStock,
      allOrders,
      allUsers,
      adminUsers,
      customerUsers,
    ] = await Promise.all([
      Order.countDocuments({ status: "Processing" }),
      Order.countDocuments({ status: "Shipped" }),
      Order.countDocuments({ status: "Delivered" }),
      Product.distinct("category"),
      Product.countDocuments(),
      Product.countDocuments({ stock: 0 }),
      allOrderPromise,
      User.find({}).select(["dob"]),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
    ]);

    const orderFulfillment = {
      processing: processingOrder,
      shipped: shippedOrder,
      delivered: deliveredOrder,
    };

    // Product Categories Ratio
    const productCategories = await getInventories({
      categories,
      productsCount,
    });

    // Stock Availability
    const stockAvailability = {
      inStock: productsCount - outOfStock,
      outOfStock,
    };

    // Revenue Distribution Ratio in Dashboard page
    const grossIncome = allOrders.reduce(
      (prev, order) => prev + (order.total || 0),
      0
    );

    // Total Discount
    const discount = allOrders.reduce(
      (prev, order) => prev + (order.discount || 0),
      0
    );

    // Production Cost
    const productionCost = allOrders.reduce(
      (prev, order) => prev + (order.shippingCharges || 0),
      0
    );

    // Production Cost
    // const productionCost = allOrders.reduce((prev, order) => {
    //   const shippingCost = order.total > 500 ? 0 : order.shippingCharges || 0;
    //   return prev + shippingCost;
    // }, 0);

    // Burnt
    const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0);

    // Marketing Cost
    // const marketingCost = grossIncome - discount - productionCost - burnt;
    const marketingCost = Math.round(grossIncome * (30 / 100));

    // Net Margin
    const netMargin =
      grossIncome - discount - productionCost - burnt - marketingCost;

    const revenueDistribution = {
      netMargin,
      discount,
      productionCost,
      burnt,
      marketingCost,
    };

    // Users Age Group
    const usersAgeGroup = {
      teen: allUsers.filter((i) => i.age < 20).length,
      // youngAdult: allUsers.filter((i) => i.age > 18 && i.age <= 24).length,
      adult: allUsers.filter((i) => i.age >= 20 && i.age < 45).length,
      // middleAged: allUsers.filter((i) => i.age > 40 && i.age <= 54).length,
      old: allUsers.filter((i) => i.age >= 45).length,
    };

    // Admin vs Customer Pie Chart
    const adminCustomer = {
      admin: adminUsers,
      customer: customerUsers,
    };

    charts = {
      orderFulfillment,
      productCategories,
      stockAvailability,
      revenueDistribution,
      usersAgeGroup,
      adminCustomer,
    };

    myCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json({
    success: true,
    charts,
  });
});

// Dashboard BarChart Controller
export const getBarCharts = TryCatch(async (req, res, next) => {
  let charts;

  const key = "admin-bar-charts";

  if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
  else {
    const today = new Date();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const sixMonthsProductPromise = Product.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lt: today,
      },
    }).select("createdAt");

    const sixMonthsUsersPromise = User.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lt: today,
      },
    }).select("createdAt");

    const twelveMonthsOrdersPromise = Order.find({
      createdAt: {
        $gte: twelveMonthsAgo,
        $lt: today,
      },
    }).select("createdAt");

    const [products, users, orders] = await Promise.all([
      sixMonthsProductPromise,
      sixMonthsUsersPromise,
      twelveMonthsOrdersPromise,
    ]);

    const productCounts = getChartData({ length: 6, today, docArr: products });
    const usersCounts = getChartData({ length: 6, today, docArr: users });
    const ordersCounts = getChartData({ length: 12, today, docArr: orders });

    charts = {
      users: usersCounts,
      products: productCounts,
      orders: ordersCounts,
    };

    myCache.set(key, JSON.stringify(charts));
  }
  return res.status(200).json({
    success: true,
    charts,
  });
});

// Dashboard LineChart Controller
export const getLineCharts = TryCatch(async (req, res, next) => {
  let charts;

  const key = "admin-line-charts";

  if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
  else {
    const today = new Date();

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const baseQuery = {
      createdAt: {
        $gte: twelveMonthsAgo,
        $lt: today,
      },
    };

    const twelveMonthsProductsPromise =
      Product.find(baseQuery).select("createdAt");

    const twelveMonthsUsersPromise = User.find(baseQuery).select("createdAt");

    const twelveMonthsOrdersPromise = Order.find(baseQuery).select([
      "createdAt",
      "discount",
      "total",
    ]);

    const [products, users, orders] = await Promise.all([
      twelveMonthsProductsPromise,
      twelveMonthsUsersPromise,
      twelveMonthsOrdersPromise,
    ]);

    const productCounts = getChartData({ length: 12, today, docArr: products });
    const usersCounts = getChartData({ length: 12, today, docArr: users });
    const discount = getChartData({
      length: 12,
      today,
      docArr: orders,
      property: "discount",
    });
    const revenue = getChartData({
      length: 12,
      today,
      docArr: orders,
      property: "total",
    });

    charts = {
      users: usersCounts,
      products: productCounts,
      discount,
      revenue,
    };

    myCache.set(key, JSON.stringify(charts));
  }
  return res.status(200).json({
    success: true,
    charts,
  });
});
