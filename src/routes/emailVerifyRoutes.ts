// src/routes/authRoutes.ts
import { Router } from "express";
import { resendVerification, verifyEmail } from "../controllers/email.js";
import { rateLimiter } from "../middlewares-old/security.js";

const router = Router();

// Email Verification Flow
router.get("/auth/verify-email", verifyEmail);

router.post(
  "/auth/resend-verification",
  rateLimiter(50, 900),
  resendVerification
);

export default router;
