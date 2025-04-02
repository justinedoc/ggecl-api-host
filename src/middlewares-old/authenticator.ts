import { NextFunction, Response } from "express";
import { envConfig } from "../config/envValidator.js";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../types/express.js";

export function authenticator(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Invalid authorization header",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, envConfig.accessToken) as { id?: string };
    if (!decoded?.id) {
      res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });

      return;
    }
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Token has expired",
      });

      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: "Invalid token",
      });

      return;
    }
    console.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
    return;
  }
}
