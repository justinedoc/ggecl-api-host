import express from "express";
import jwt from "jsonwebtoken";
import { envConfig } from "../config/envValidator.js";
import { JwtPayload, roleMappings } from "../controllers/refresh.js";
import { Model } from "mongoose";
import { IStudent } from "../models/studentModel.js";
import { IInstructor } from "../models/instructorModel.js";

const router = express.Router();
router.get("/auth/session", async (req, res) => {
  const token = req.cookies.session;
  console.log("Session token:", token);

  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, envConfig.refreshToken) as JwtPayload;
    console.log("Decoded token:", decoded);
    const { role, id } = decoded;
    const userModel = roleMappings[role].model as Model<IStudent | IInstructor>;
    const user = await userModel.findById(id).select("-password");

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ success: false, message: "Invalid token" });
    return;
  }
});

export default router;
