import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";

export const checkObjectId = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400);
      throw new Error("Invalid ID format");
    }
    next();
  }
);
