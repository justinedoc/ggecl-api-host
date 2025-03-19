import { Request, Response } from "express";
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
export interface JwtPayload {
  id: string;
  role: UserRole;
}

// Role mapping with models for each role
export type RoleConfig = {
  student: { model: Model<IStudent> };
  instructor: { model: Model<IInstructor> };
};

export const roleMappings: RoleConfig = {
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

const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.session;

  if (!refreshToken) {
    res.status(401).json({
      success: false,
      message: "Refresh token required",
    });

    return;
  }

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(refreshToken, envConfig.refreshToken) as JwtPayload;
  } catch (error) {
    clearRefreshTokenCookie(res);
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Session expired - Please login again",
      });
      return;
    }
    res.status(401).json({
      success: false,
      message: "Invalid refresh token - Please login",
    });
    return;
  }

  // Validate payload structure
  if (!isJwtPayload(decoded)) {
    clearRefreshTokenCookie(res);
    res.status(401).json({
      success: false,
      message: "Invalid token payload",
    });
    return;
  }

  const { id, role } = decoded;
  const userModel = roleMappings[role].model as Model<IStudent | IInstructor>;

  // Find user with matching refresh token
  const user = await userModel.findOne({ _id: id, refreshToken });
  if (!user) {
    clearRefreshTokenCookie(res);
    res.status(401).json({
      success: false,
      message: "User not found or session invalid",
    });
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

  // Update refresh token in DB
  await userModel.findByIdAndUpdate(user._id, {
    refreshToken: newRefreshToken,
  });

  // Set the new refresh token cookie and respond with new access token
  setRefreshTokenCookie(res, newRefreshToken);
  res.json({ success: true, token: accessToken });
});

export default refresh;
