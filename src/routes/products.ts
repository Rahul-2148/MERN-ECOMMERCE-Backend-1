import express, { RequestHandler } from "express";
import {
  deleteProduct,
  getAdminProducts,
  getAllCategories,
  getLatestProducts,
  getSingleProduct,
  newProduct,
  searchAllProducts,
  updateProduct,
} from "../controller/product.js";
import { adminOnly } from "../middlewares/auth.js";
import { singleUpload } from "../middlewares/multer.js";

const app = express.Router();

// To Create New Product - /api/v1/product/new
app.post(
  "/new",
  adminOnly as RequestHandler,
  singleUpload,
  newProduct as RequestHandler
);

// To get all Products with filters - /api/v1/product/search-all
app.get("/search-all", searchAllProducts as RequestHandler);

// To get last 5 Products - /api/v1/product/latest
app.get("/latest", getLatestProducts as RequestHandler);

// To get all unique Categories - /api/v1/product/categories
app.get("/categories", getAllCategories as RequestHandler);

// To get all Products - /api/v1/product/admin-products
app.get(
  "/admin-products",
  adminOnly as RequestHandler,
  getAdminProducts as RequestHandler
);

// To get Single Product, To Update Product and To Delete product - /api/v1/product/:id  , here only difference is get request and put request
app
  .route("/:id")
  .get(getSingleProduct as RequestHandler)
  .put(
    adminOnly as RequestHandler,
    singleUpload as RequestHandler,
    updateProduct as RequestHandler
  )
  .delete(adminOnly as RequestHandler, deleteProduct as RequestHandler);



export default app;
