import express from "express";
import jwt from "jsonwebtoken";
import { envConfig } from "../config/envValidator.js";
import { JwtPayload, roleMappings } from "../controllers/refresh.js";
import { Model } from "mongoose";
import { IStudent } from "../models/studentModel.js";
import { IInstructor } from "../models/instructorModel.js";
import { redis } from "../config/redisConfig.js";

const router = express.Router();

// Cache TTL configuration
const USER_CACHE_TTL = 3600;

router.get("/auth/session", async (req, res) => {
  const token = req.cookies.session;

  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, envConfig.refreshToken) as JwtPayload;
    const { role, id } = decoded;

    const cacheKey = `user:${id}:${role}`;

    const cachedUser = await redis.get(cacheKey);

    if (cachedUser) {
      res.json({
        success: true,
        fromCache: true,
        data: JSON.parse(cachedUser),
      });
      return;
    }

    const userModel = roleMappings[role].model as Model<IStudent | IInstructor>;
    const user = await userModel
      .findById(id)
      .select(
        "-password -refreshToken -emailVerificationExpires -emailVerificationToken"
      )
      .lean()
      .exec();

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    await redis.setEx(cacheKey, USER_CACHE_TTL, JSON.stringify(user));

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Session verification error:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, message: "Invalid token" });
      return;
    }

    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
