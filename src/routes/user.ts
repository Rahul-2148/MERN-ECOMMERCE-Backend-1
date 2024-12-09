import express, { RequestHandler } from "express";
import { deleteUser, getAllUsers, getUser, newUser } from "../controller/user.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();


// Signup Route - /api/v1/user/new 
app.post("/new", newUser as RequestHandler );

// Get All Users Route - /api/v1/user/all
app.get("/all", adminOnly as RequestHandler, getAllUsers as unknown as RequestHandler);

// Get Single User Route - /api/v1/user/dynamicID
app.get("/:id", getUser as RequestHandler);

// Delete Single User Route - /api/v1/user/dynamicID
app.delete("/:id", adminOnly as RequestHandler, deleteUser as unknown as RequestHandler);

export default app;