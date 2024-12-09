import { Request } from "express";
import { rm } from "fs"; // The fs. rm() method is used to delete a file at the given path. It can also be used recursively to remove directories.
import { TryCatch } from "../middlewares/error.js";
import { Product } from "../models/product.js";
import { myCache } from "../server.js";
import {
  BaseQuery,
  NewProductRequestBody,
  SearchRequestQuery,
} from "../types/types.js";
import { invalidateCache } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";

// import {faker} from '@faker-js/faker';

// Get Latest Product Controller, Revalidate on New Update, Delete product & or New Order
export const getLatestProducts = TryCatch(async (req, res, next) => {
  let products;

  if (myCache.has("latest-products"))
    products = JSON.parse(myCache.get("latest-products") as string);
  else {
    products = await Product.find().sort({ createdAt: -1 }).limit(5);
    myCache.set("latest-products", JSON.stringify(products));
  }

  return res.status(200).json({
    success: true,
    products,
  });
});

// category controller, Revalidate on New Update, Delete product & or New Order
export const getAllCategories = TryCatch(async (req, res, next) => {
  let categories;

  if (myCache.has("categories"))
    categories = JSON.parse(myCache.get("categories") as string);
  else {
    categories = await Product.distinct("category");
    myCache.set("categories", JSON.stringify(categories));
  }

  return res.status(200).json({
    success: true,
    categories,
    // message: "Categories fetched successfully",
  });
});

// Get Admin all Products Controller
export const getAdminProducts = TryCatch(async (req, res, next) => {
  let products;

  if (myCache.has("all-products"))
    products = JSON.parse(myCache.get("all-products") as string);
  else {
    products = await Product.find();
    myCache.set("all-products", JSON.stringify(products));
  }

  return res.status(200).json({
    success: true,
    products,
  });
});

// Get Single Product Controller
export const getSingleProduct = TryCatch(async (req, res, next) => {
  let product;
  const id = req.params.id;

  if (myCache.has(`product-${id}`))
    product = JSON.parse(myCache.get(`product-${id}`) as string);
  else {
    product = await Product.findById(id);
    myCache.set(`product-${id}`, JSON.stringify(product));

    if (!product) return next(new ErrorHandler("Product not found", 404));
  }

  return res.status(200).json({
    success: true,
    product,
  });
});

// New Product add Controller
export const newProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const { name, category, price, stock } = req.body;
    const photo = req.file;

    if (!photo) return next(new ErrorHandler("Please add Product Photo", 400));

    if (!name || !category || !price || !stock) {
      rm(photo.path, () => {
        console.log("Photo deleted");
      });
      return next(new ErrorHandler("Please add all the fields", 400));
    }

    await Product.create({
      name,
      category: category.toLowerCase(),
      price,
      stock,
      photo: photo.path,
    });

    invalidateCache({ product: true, admin: true });

    return res.status(201).json({
      success: true,
      message: "Product added successfully",
    });
  }
);

// Update Product Controller
export const updateProduct = TryCatch(async (req, res, next) => {
  const id = req.params.id;
  const { name, category, price, stock } = req.body;
  const photo = req.file;
  const product = await Product.findById(id);

  if (!product) return next(new ErrorHandler("Product not found", 404));

  if (photo) {
    rm(product.photo!, () => {
      console.log("Old Photo deleted");
    });
    product.photo = photo.path;
  }

  if (name) product.name = name;
  if (category) product.category = category;
  if (price) product.price = price;
  if (stock) product.stock = stock;

  await product.save();

  invalidateCache({
    product: true,
    productId: String(product._id),
    admin: true,
  });

  return res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product,
  });
});

// Delete Product Controller
export const deleteProduct = TryCatch(async (req, res, next) => {
  const id = req.params.id;
  const product = await Product.findById(id);

  if (!product) return next(new ErrorHandler("Product not found", 404));

  rm(product.photo!, () => {
    console.log("Product Photo deleted");
  });

  await product.deleteOne();

  invalidateCache({
    product: true,
    productId: String(product._id),
    admin: true,
  });

  return res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

// Search All Products Controller
export const searchAllProducts = TryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { search, sort, category, price } = req.query;

    const page = Number(req.query.page) || 1;
    // 1,2,3,4,5,6,7,8  - page 1 (default limit 8 items)
    // 9,10,11,12,13,14,15,16 - page 2 (skipped 8 items)
    // 17,18,19,20,21,22,23,24 - page 3 (skipped 16 items)

    const limit = Number(process.env.Product_PER_PAGE) || 8;
    const skip = (page - 1) * limit;

    const baseQuery: BaseQuery = {};

    if (search)
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };

    if (price)
      baseQuery.price = {
        $lte: Number(price),
      };

    if (category) baseQuery.category = category;

    // if (shippingCost) baseQuery.shippingCost = shippingCost;

    const productPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const [products, filteredOnlyProduct] = await Promise.all([
      productPromise,
      Product.find(baseQuery),
    ]);

    const totalPage = Math.ceil(filteredOnlyProduct.length / limit);

    return res.status(200).json({
      success: true,
      products,
      totalPage,
    });
  }
);

// const generateRandomProducts = async (count: number = 10) => {
//     const products = [];

//         for (let i = 0; i < count; i++) {
//             const product = {
//                 name: faker.commerce.productName(),
//                 photo: "uploads/23bb0bcc-d28a-43ca-8ada-715059d955da.png",
//                 price: faker.commerce.price({ min: 1500, max: 80000, dec: 0 }),
//                 stock: faker.commerce.price({ min: 0, max:2000, dec: 0 }),
//                 category: faker.commerce.department(),
//                 createdAt: new Date(faker.date.past()),
//                 updatedAt: new Date(faker.date.recent()),
//                 _v: 0,
//             }
//             products.push(product);
//     }
//     await Product.create(products);

//     console.log({success: true});
// };

// Delete Random Products
// const deleteRandomProducts = async (count: number = 10) => {
//   const products = await Product.find({}).skip(2);

//   for (let i = 0; i < products.length; i++) {
//     const product = products[i];
//     await Product.deleteOne();
//   }
//   console.log({ success: true });
// };
