import { NextFunction, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { model } from "mongoose";
import { AuthenticatedRequest } from "../types/express.js";

export function isRole(role: "student" | "instructor" | "admin") {
  return expressAsyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const userId = req.user.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const RoleModel = model(role);

      const userExists = await RoleModel.exists({
        _id: userId,
      });

      if (!userExists) {
        res.status(403).json({ message: "Forbidden - Incorrect role" });
        return;
      }

      next();
    }
  );
}
