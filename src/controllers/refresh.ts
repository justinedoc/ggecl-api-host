import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import studentModel, { IStudent } from "../models/studentModel.js";
import instructorModel, { IInstructor } from "../models/instructorModel.js";
import { Model } from "mongoose";
import { envConfig } from "../config/envValidator.js";
import { generateToken } from "../utils/generateToken.js";
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "../utils/cookieUtils.js";

// JWT payload type
type UserRole = "student" | "instructor";
interface JwtPayload {
  id: string;
  role: UserRole;
}

// Define roleMappings with specific model types for each role
type RoleConfig = {
  student: { model: Model<IStudent> };
  instructor: { model: Model<IInstructor> };
};

const roleMappings: RoleConfig = {
  student: { model: studentModel },
  instructor: { model: instructorModel },
};

// Type guard for JWT payload
const isJwtPayload = (decoded: unknown): decoded is JwtPayload => {
  return (
    typeof decoded === "object" &&
    decoded !== null &&
    "id" in decoded &&
    "role" in decoded &&
    (decoded as JwtPayload).role in roleMappings
  );
};

// Helper for consistent error responses
const sendErrorResponse = (
  res: Response,
  status: number,
  message: string
): void => {
  res.status(status).json({ success: false, message });
};

const refresh = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.session;

    if (!refreshToken) {
      sendErrorResponse(res, 401, "Authorization token required");
      return;
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        envConfig.refreshToken
      ) as JwtPayload;

      // Validate payload structure
      if (!isJwtPayload(decoded)) {
        clearRefreshTokenCookie(res);
        sendErrorResponse(res, 401, "Invalid token payload");
        return;
      }

      const { role, id } = decoded;
      const userModel = roleMappings[role].model as Model<
        IStudent | IInstructor
      >;

      // Find user with matching refresh token
      const user = await userModel.findOne({ refreshToken });

      if (!user) {
        clearRefreshTokenCookie(res);
        sendErrorResponse(res, 401, "Invalid session - User not found");
        return;
      }

      // Validate user ownership
      if (user._id.toString() !== id) {
        clearRefreshTokenCookie(res);
        user.refreshToken = "";
        await user.save();
        sendErrorResponse(res, 401, "Session mismatch detected");
        return;
      }

      // Generate new tokens
      const newRefreshToken = generateToken({
        id: user._id.toString(),
        role,
        type: "refreshToken",
      });

      const accessToken = generateToken({
        id: user._id.toString(),
        role,
        type: "accessToken",
      });

      // Update refresh token
      user.refreshToken = newRefreshToken;
      await user.save();

      // Set new cookie and response
      setRefreshTokenCookie(res, newRefreshToken);
      res.json({ success: true, token: accessToken });
    } catch (error) {
      clearRefreshTokenCookie(res);

      // Handle token invalidation
      try {
        const decoded = jwt.decode(refreshToken);
        if (isJwtPayload(decoded)) {
          const userModel = roleMappings[decoded.role].model as Model<
            IStudent | IInstructor
          >;
          await userModel.findByIdAndUpdate(decoded.id, {
            $unset: { refreshToken: "" },
          });
        }
      } catch (dbError) {
        console.error("Token cleanup error:", dbError);
      }

      // Handle specific JWT errors
      if (error instanceof jwt.TokenExpiredError) {
        sendErrorResponse(res, 401, "Session expired - Please login again");
        return;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        sendErrorResponse(res, 401, "Invalid session - Please authenticate");
        return;
      }

      next(error);
    }
  }
);

export default refresh;
