import express, { RequestHandler } from "express";
import {
  allOrders,
  deleteOrder,
  getSingleOrder,
  myOrders,
  newOrder,
  processOrder,
} from "../controller/order.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

// To Create New Order - route - /api/v1/order/new
app.post("/new", newOrder as RequestHandler);

// To get My Orders - route - /api/v1/order/my
app.get("/my", myOrders as RequestHandler);

// To get All Orders - route - /api/v1/order/all
app.get("/all", adminOnly as RequestHandler, allOrders as RequestHandler);

// To get Single Order - route - /api/v1/order/:id
app
  .route("/:id")
  .get(getSingleOrder as RequestHandler)
  .put(adminOnly as RequestHandler, processOrder as RequestHandler)
  .delete(adminOnly as RequestHandler, deleteOrder as RequestHandler);

export default app;
