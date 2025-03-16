import { Request, Response } from "express";
import { z } from "zod";
import asyncHandler from "express-async-handler";
import { emailService } from "../services/emailService.js";
import {
  createErrorResponse,
  createSuccessResponse,
  handleZodError,
} from "../utils/responseUtils.js";
import { studentAuthService } from "../services/studentAuth.js";
import { instructorAuthService } from "../services/instructorAuth.js";

// Zod Schemas
const VerifyEmailSchema = z.object({
  token: z.string().min(64).max(128),
  role: z.enum(["student", "instructor"]),
});

const ResendVerificationSchema = z.object({
  email: z.string().email(),
  role: z.enum(["student", "instructor"]),
});

// Verify Email Handler
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const parseResult = VerifyEmailSchema.safeParse(req.query);

  if (!parseResult.success) {
    handleZodError(res, parseResult.error);
    return;
  }

  const { token, role } = parseResult.data;
  const service = emailService(role);

  try {
    const verificationSuccess = await service.verifyEmailToken(token);

    if (!verificationSuccess) {
      return createErrorResponse(
        res,
        410,
        "Verification link has expired or is invalid"
      );
    }

    createSuccessResponse(res, 200, "Email successfully verified", {
      persistent: true,
    });
  } catch (error) {
    console.error(`[Email Verification] Error: ${error}`);
    createErrorResponse(res, 500, "Could not complete email verification");
  }
});

// Resend Verification Email Handler
export const resendVerification = asyncHandler(
  async (req: Request, res: Response) => {
    const parseResult = ResendVerificationSchema.safeParse({
      ...req.body,
      ...req.params,
    });

    if (!parseResult.success) {
      handleZodError(res, parseResult.error);
      return;
    }

    const { email, role } = parseResult.data;
    const service = emailService(role);

    const capsFirstLetter = (str: string) =>
      str.charAt(0).toUpperCase() + str.slice(1);
    const authService =
      role === "student" ? studentAuthService : instructorAuthService;

    try {
      // User verification check
      const user = await authService[`find${capsFirstLetter(role)}ByEmail`](
        email
      );

      if (!user) {
        return createErrorResponse(
          res,
          404,
          "No account found with this email"
        );
      }

      if (user.isVerified) {
        return createErrorResponse(
          res,
          409,
          "Email address is already verified"
        );
      }

      // Initiate verification process
      const data = await service.initiateEmailVerification(user.id, email);

      createSuccessResponse(
        res,
        200,
        "Verification email resent successfully",
        data
      );
    } catch (error) {
      console.error(`[Resend Verification] Error: ${error}`);
      createErrorResponse(res, 500, "Could not resend verification email");
    }
  }
);
