// src/middleware/securityMiddleware.ts
import rateLimit from "express-rate-limit";

export const rateLimiter = (attempts: number, windowSeconds: number) => {
  return rateLimit({
    windowMs: windowSeconds * 1000,
    max: attempts,
    message: {
      code: "RATE_LIMITED",
      message: "Too many requests, please try again later",
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return `${req.ip}-${req.body?.email || "unknown"}`;
    },
  });
};
