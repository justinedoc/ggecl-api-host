import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { IStudent } from "../models/studentModel.js";
import { IInstructor } from "../models/instructorModel.js";
import { Model } from "mongoose";
import { envConfig } from "../config/envValidator.js";
import { generateToken } from "../utils/generateToken.js";
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "../utils/cookieUtils.js";
import { redis } from "../config/redisConfig.js";
import { roleMappings, UserRole } from "../utils/roleMappings.js";

const REFRESH_CACHE_TTL = 14 * 60;

// JWT payload type
export interface JwtPayload {
  id: string;
  role: UserRole;
}

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

  const cacheKey = `refresh:${refreshToken}`;
  const cachedData = await redis.get(cacheKey);

  if (cachedData) {
    const { accessToken, newRefreshToken } = JSON.parse(cachedData);
    setRefreshTokenCookie(res, newRefreshToken);
    res.json({ success: true, fromCache: true, token: accessToken });
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
  const user = await userModel.findById(id);
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

  const multi = redis.multi();
  multi.setEx(
    `refresh:${newRefreshToken}`,
    REFRESH_CACHE_TTL,
    JSON.stringify({ accessToken, newRefreshToken })
  );
  multi.del(`refresh:${refreshToken}`);
  await multi.exec();

  // Update refresh token in DB
  await userModel.findByIdAndUpdate(user._id, {
    refreshToken: newRefreshToken,
  });

  // Set the new refresh token cookie and respond with new access token
  setRefreshTokenCookie(res, newRefreshToken);
  res.json({ success: true, token: accessToken });
});

export default refresh;
