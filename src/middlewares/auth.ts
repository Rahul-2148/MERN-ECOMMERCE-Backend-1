import { TryCatch } from "./error.js";
import ErrorHandler from "../utils/utility-class.js"
import { User } from "../models/user.js";

// Middleware to make sure only admin is allowed
export const adminOnly = TryCatch(async (req, res, next) => {
    const {id} = req.query;

    if (!id) return next(new ErrorHandler("Please Login as Admin", 401));

    const user = await User.findById(id);
    if (!user) return next(new ErrorHandler("Invalid user ID", 404));

    if (user.role !== "admin") return next(new ErrorHandler("You are not an admin", 401));

    next();
});

// Middleware to make sure only user is allowed
export const userOnly = TryCatch(async (req, res, next) => {
    const { id } = req.query;
    if (!id) return next(new ErrorHandler("Please Login as User", 401));
    const user = await User.findById(id);
    if (!user) return next(new ErrorHandler("Invalid user ID", 404));
    if (user.role !== "user") return next(new ErrorHandler("You are not a user", 401));
    next();
});