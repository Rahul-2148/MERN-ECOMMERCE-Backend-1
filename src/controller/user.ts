import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.js";
import { NewUserRequestBody } from "../types/types.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-class.js";

// Signup Controller
export const newUser = TryCatch(
  async (
    req: Request<{}, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, email, photo, gender, _id, dob } = req.body;

    let user = await User.findById(_id);

    if (user) 
      return res.status(200).json({
        success: true,
        message: `Welcome, ${user.name}`,
      });

      if(!_id || !name || !email || !photo || !gender || !dob)
        return next(new ErrorHandler("Please add all the fields", 400));
    

    user = await User.create({
      name,
      email,
      photo,
      gender,
      _id,
      dob: new Date(dob),
    });

    return res.status(201).json({
      success: true,
      message: `Welcome, ${user.name}`,
    });
  }
);

// Get All Users Controller
export const getAllUsers = TryCatch(async (req, res, next) => {
  const users = await User.find({});
  return res.status(200).json({
    success: true,
    users,
  });
});

// Get Single User Controller
export const getUser = TryCatch(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);

  if (!user)
    return next(new ErrorHandler("Invalid user ID", 404));
  return res.status(200).json({
    success: true,
    user,
  });
});

// Delete Single User Controller
export const deleteUser = TryCatch(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);
  if (!user)
    return next(new ErrorHandler("Invalid user ID", 404));
  await user.deleteOne();
  return res.status(200).json({
    success: true,
    message: "User Deleted successfully",
  });
});